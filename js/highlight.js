/* Tiny Java syntax highlighter — tokenizes and wraps in spans. */
(function () {
  const KEYWORDS = new Set([
    "abstract","assert","boolean","break","byte","case","catch","char","class","const",
    "continue","default","do","double","else","enum","extends","final","finally","float",
    "for","goto","if","implements","import","instanceof","int","interface","long","native",
    "new","package","private","protected","public","return","short","static","strictfp",
    "super","switch","synchronized","this","throw","throws","transient","try","void",
    "volatile","while","var","true","false","null"
  ]);

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightJava(src) {
    let out = "";
    let i = 0;
    const n = src.length;

    while (i < n) {
      const ch = src[i];

      // line comment
      if (ch === "/" && src[i + 1] === "/") {
        let j = src.indexOf("\n", i);
        if (j === -1) j = n;
        out += '<span class="tok-com">' + esc(src.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      // block comment
      if (ch === "/" && src[i + 1] === "*") {
        let j = src.indexOf("*/", i + 2);
        j = j === -1 ? n : j + 2;
        out += '<span class="tok-com">' + esc(src.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      // string
      if (ch === '"') {
        let j = i + 1;
        while (j < n && src[j] !== '"') {
          if (src[j] === "\\") j++;
          j++;
        }
        j = Math.min(j + 1, n);
        out += '<span class="tok-str">' + esc(src.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      // char literal
      if (ch === "'") {
        let j = i + 1;
        while (j < n && src[j] !== "'") {
          if (src[j] === "\\") j++;
          j++;
        }
        j = Math.min(j + 1, n);
        out += '<span class="tok-str">' + esc(src.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      // annotation
      if (ch === "@" && /[A-Za-z]/.test(src[i + 1] || "")) {
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        out += '<span class="tok-ann">' + esc(src.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      // number
      if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] || ""))) {
        let j = i;
        while (j < n && /[0-9a-fA-FxX._eE+-]/.test(src[j])) {
          // stop +/- unless right after e/E
          if ((src[j] === "+" || src[j] === "-") && !/[eE]/.test(src[j - 1] || "")) break;
          j++;
        }
        // trailing type suffix
        if (j < n && /[fFdDlL]/.test(src[j])) j++;
        out += '<span class="tok-num">' + esc(src.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      // identifier / keyword / type / call
      if (/[A-Za-z_$]/.test(ch)) {
        let j = i;
        while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
        const word = src.slice(i, j);
        let cls = null;
        if (KEYWORDS.has(word)) cls = "tok-kw";
        else if (/^[A-Z]/.test(word)) cls = "tok-type";
        else {
          // lookahead for method call
          let k = j;
          while (k < n && src[k] === " ") k++;
          if (src[k] === "(") cls = "tok-call";
        }
        out += cls ? '<span class="' + cls + '">' + esc(word) + "</span>" : esc(word);
        i = j;
        continue;
      }

      out += esc(ch);
      i++;
    }
    return out;
  }

  window.highlightJava = highlightJava;
})();
