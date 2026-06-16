"""Idiot-proof Tkinter GUI. No command line, no stack traces.

Flow:
    1. Pick a PDF (Browse, or drag-and-drop if the optional helper is present).
    2. Click Convert -> the tool analyzes the PDF in a background thread.
    3. A summary screen shows counts, difficulty mix, and items needing review,
       with the editable bank title and a Confirm button.
    4. After writing, it shows where the files are, the review punch list, the
       one-time .bnk walkthrough (if needed), and an "Open folder" button.
"""

import os
import queue
import sys
import threading
import traceback

try:
    import tkinter as tk
    from tkinter import filedialog, messagebox, scrolledtext, ttk
    _TK_AVAILABLE = True
except Exception:  # pragma: no cover - headless environments
    _TK_AVAILABLE = False

from . import report
from .bnk import BnkResult
from .pipeline import (Analysis, WriteResult, analyze, default_output_dir,
                       write_outputs)


APP_TITLE = "Physics Question Bank Generator"


def _open_folder(path: str) -> None:
    try:
        if os.name == "nt":
            os.startfile(path)  # noqa: S606 - intended, opens file explorer
        elif sys.platform == "darwin":
            import subprocess
            subprocess.Popen(["open", path])
        else:
            import subprocess
            subprocess.Popen(["xdg-open", path])
    except Exception:
        pass


class App:
    def __init__(self, root):
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("680x560")
        self.root.minsize(620, 500)

        self.pdf_path = tk.StringVar()
        self.status = tk.StringVar(value="Pick a PDF of exam questions to begin.")
        self.title_var = tk.StringVar()
        self.output_dir = default_output_dir()

        self._analysis = None
        self._queue = queue.Queue()

        self._build_picker()

    # --- screen 1: pick + convert ------------------------------------------

    def _clear(self):
        for child in self.root.winfo_children():
            child.destroy()

    def _build_picker(self):
        self._clear()
        frame = ttk.Frame(self.root, padding=20)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text=APP_TITLE, font=("Segoe UI", 16, "bold")).pack(
            anchor="w")
        ttk.Label(frame, text="Turn a PDF of exam questions into an ExamView "
                              "import file (RTF) and a question bank.",
                  wraplength=620).pack(anchor="w", pady=(4, 16))

        box = ttk.LabelFrame(frame, text="Step 1: Choose your PDF", padding=14)
        box.pack(fill="x")

        row = ttk.Frame(box)
        row.pack(fill="x")
        entry = ttk.Entry(row, textvariable=self.pdf_path)
        entry.pack(side="left", fill="x", expand=True)
        ttk.Button(row, text="Browse...", command=self._browse).pack(
            side="left", padx=(8, 0))

        hint = ttk.Label(box, text="Tip: you can also drag a PDF onto this "
                                   "window.", foreground="#666")
        hint.pack(anchor="w", pady=(8, 0))
        self._enable_drag_and_drop()

        step2 = ttk.LabelFrame(frame, text="Step 2: Convert", padding=14)
        step2.pack(fill="x", pady=(16, 0))
        self.convert_btn = ttk.Button(step2, text="Convert",
                                      command=self._start_analyze)
        self.convert_btn.pack(anchor="w")

        self.progress = ttk.Progressbar(frame, mode="indeterminate")
        ttk.Label(frame, textvariable=self.status, wraplength=620,
                  foreground="#333").pack(anchor="w", pady=(18, 0))

    def _browse(self):
        path = filedialog.askopenfilename(
            title="Choose a PDF of exam questions",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")])
        if path:
            self.pdf_path.set(path)
            self.status.set("Ready. Click Convert.")

    def _enable_drag_and_drop(self):
        # Optional: only if tkinterdnd2 is installed (kept out of requirements
        # to honour the minimal-dependency rule). Browse always works.
        try:
            from tkinterdnd2 import DND_FILES  # type: ignore
            self.root.drop_target_register(DND_FILES)
            self.root.dnd_bind("<<Drop>>", self._on_drop)
        except Exception:
            pass

    def _on_drop(self, event):
        path = event.data.strip().strip("{}")
        if path.lower().endswith(".pdf"):
            self.pdf_path.set(path)
            self.status.set("Ready. Click Convert.")
        else:
            messagebox.showinfo(APP_TITLE, "Please drop a PDF file.")

    # --- analyze (background) ----------------------------------------------

    def _start_analyze(self):
        path = self.pdf_path.get().strip()
        if not path:
            messagebox.showinfo(APP_TITLE, "Please choose a PDF first.")
            return
        self.convert_btn.config(state="disabled")
        self.status.set("Reading and analyzing the PDF... this can take a "
                        "moment for big files.")
        self.progress.pack(fill="x", pady=(14, 0))
        self.progress.start(12)

        threading.Thread(target=self._analyze_worker, args=(path,),
                         daemon=True).start()
        self.root.after(120, self._poll_analyze)

    def _analyze_worker(self, path):
        try:
            self._queue.put(("ok", analyze(path)))
        except Exception:
            # Absolute last-resort guard: never surface a stack trace.
            self._queue.put(("crash", traceback.format_exc()))

    def _poll_analyze(self):
        try:
            kind, payload = self._queue.get_nowait()
        except queue.Empty:
            self.root.after(120, self._poll_analyze)
            return

        self.progress.stop()
        self.progress.pack_forget()
        self.convert_btn.config(state="normal")

        if kind == "crash":
            messagebox.showerror(
                APP_TITLE,
                "Sorry - something unexpected happened while reading the PDF. "
                "Please try a different PDF, or re-save this one and try again.")
            self.status.set("Ready. Pick a PDF and click Convert.")
            return

        analysis: Analysis = payload
        if analysis.error:
            messagebox.showwarning(APP_TITLE, analysis.error)
            self.status.set("Pick a PDF and click Convert.")
            return

        self._analysis = analysis
        self.title_var.set(analysis.title)
        self._build_summary()

    # --- screen 2: summary + confirm ---------------------------------------

    def _build_summary(self):
        self._clear()
        a = self._analysis
        frame = ttk.Frame(self.root, padding=20)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text="Review before saving",
                  font=("Segoe UI", 15, "bold")).pack(anchor="w")

        title_box = ttk.LabelFrame(frame, text="Bank title (you can edit this)",
                                   padding=10)
        title_box.pack(fill="x", pady=(12, 8))
        ttk.Entry(title_box, textvariable=self.title_var).pack(fill="x")

        info = scrolledtext.ScrolledText(frame, height=14, wrap="word")
        info.pack(fill="both", expand=True, pady=(8, 8))
        info.insert("1.0", report.summary_text(a.questions, self.title_var.get(),
                                               a.ocr_required))
        if a.warnings:
            info.insert("end", "\n\nDocument notes:\n")
            for w in a.warnings:
                info.insert("end", "  - %s\n" % w)
        info.config(state="disabled")

        out = ttk.Frame(frame)
        out.pack(fill="x")
        ttk.Label(out, text="Save to: %s" % self.output_dir,
                  foreground="#555", wraplength=620).pack(anchor="w")

        btns = ttk.Frame(frame)
        btns.pack(fill="x", pady=(12, 0))
        ttk.Button(btns, text="Confirm and save", command=self._start_write).pack(
            side="left")
        ttk.Button(btns, text="Back", command=self._build_picker).pack(
            side="left", padx=(8, 0))

    # --- write (background) ------------------------------------------------

    def _start_write(self):
        title = self.title_var.get().strip()
        if not title:
            messagebox.showinfo(APP_TITLE, "Please enter a bank title.")
            return
        self.status.set("Saving files...")
        threading.Thread(target=self._write_worker, args=(title,),
                         daemon=True).start()
        self.root.after(120, self._poll_write)

    def _write_worker(self, title):
        try:
            res = write_outputs(self._analysis, self.output_dir,
                                title_override=title)
            self._queue.put(("written", res))
        except Exception:
            self._queue.put(("crash", traceback.format_exc()))

    def _poll_write(self):
        try:
            kind, payload = self._queue.get_nowait()
        except queue.Empty:
            self.root.after(120, self._poll_write)
            return

        if kind == "crash":
            messagebox.showerror(
                APP_TITLE, "Sorry - the files could not be saved. Make sure the "
                "output folder is not open elsewhere and try again.")
            return

        res: WriteResult = payload
        if res.error:
            messagebox.showwarning(APP_TITLE, res.error)
            return
        self._build_results(res)

    # --- screen 3: results -------------------------------------------------

    def _build_results(self, res: WriteResult):
        self._clear()
        frame = ttk.Frame(self.root, padding=20)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text="Done!", font=("Segoe UI", 15, "bold")).pack(
            anchor="w")
        ttk.Label(frame, text="Your files are in:", foreground="#333").pack(
            anchor="w", pady=(8, 0))
        ttk.Label(frame, text=res.output_dir, foreground="#0a52a8",
                  wraplength=620).pack(anchor="w")

        text = scrolledtext.ScrolledText(frame, height=16, wrap="word")
        text.pack(fill="both", expand=True, pady=(10, 8))

        lines = ["Files written:"]
        for path in res.rtf_files:
            lines.append("  - %s" % os.path.basename(path))
        if res.report_file:
            lines.append("  - %s" % os.path.basename(res.report_file))
        if res.punch_list_file:
            lines.append("  - %s" % os.path.basename(res.punch_list_file))
        lines.append("")

        # .bnk status / walkthrough.
        any_bnk = any(b.created for b in res.bnk_results)
        if any_bnk:
            lines.append("ExamView question bank (.bnk): created automatically.")
        else:
            lines.append("Creating the ExamView question bank (.bnk):")
            if res.bnk_results:
                lines.append("  " + res.bnk_results[0].message)
                lines.append("")
                for i, step in enumerate(res.bnk_results[0].walkthrough, 1):
                    lines.append("  %d. %s" % (i, step))
        lines.append("")

        if res.validation_problems:
            lines.append("Heads-up - the RTF was written but a few checks "
                         "flagged things to look at:")
            for p in res.validation_problems:
                lines.append("  - %s" % p)
            lines.append("")

        lines.append(report.punch_list_text(self._analysis.questions))
        text.insert("1.0", "\n".join(lines))
        text.config(state="disabled")

        btns = ttk.Frame(frame)
        btns.pack(fill="x", pady=(10, 0))
        ttk.Button(btns, text="Open output folder",
                   command=lambda: _open_folder(res.output_dir)).pack(side="left")
        ttk.Button(btns, text="Convert another PDF",
                   command=self._reset).pack(side="left", padx=(8, 0))

    def _reset(self):
        self.pdf_path.set("")
        self._analysis = None
        self.status.set("Pick a PDF of exam questions to begin.")
        self._build_picker()


def launch():
    if not _TK_AVAILABLE:
        print("This tool needs a graphical desktop to run.")
        return
    # tkinterdnd2 provides a special root that supports drag-and-drop; fall back
    # to a normal Tk root if it isn't installed.
    try:
        from tkinterdnd2 import TkinterDnD  # type: ignore
        root = TkinterDnD.Tk()
    except Exception:
        root = tk.Tk()

    try:
        ttk.Style().theme_use("clam")
    except Exception:
        pass

    App(root)
    root.mainloop()
