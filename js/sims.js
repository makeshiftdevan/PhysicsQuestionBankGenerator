/* Interactive labs: mecanum drive, PID tuning, path builder, Limelight auto-aim.
   Each sim is a function(container) that builds its own DOM inside `container`. */
(function () {
  const { el } = { el: (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }};

  function slider(labelText, min, max, step, value) {
    const label = el("label");
    label.appendChild(el("span", "lname", labelText));
    const input = document.createElement("input");
    input.type = "range";
    input.min = min; input.max = max; input.step = step; input.value = value;
    const val = el("span", "lval", (+value).toFixed(2));
    input.addEventListener("input", () => (val.textContent = (+input.value).toFixed(2)));
    label.appendChild(input);
    label.appendChild(val);
    return { label, input, val };
  }

  function powerBar(name) {
    const row = el("div", "pw-row");
    row.appendChild(el("span", "pw-name", name));
    const bar = el("div", "pw-bar");
    const fill = el("div", "pw-fill");
    bar.appendChild(fill);
    row.appendChild(bar);
    const val = el("span", "pw-val", "0.00");
    row.appendChild(val);
    return {
      row,
      set(p) {
        const pct = Math.abs(p) * 50;
        fill.style.width = pct + "%";
        fill.style.background = p >= 0 ? "var(--green)" : "var(--red)";
        if (p >= 0) { fill.style.left = "50%"; fill.style.right = ""; }
        else { fill.style.right = "50%"; fill.style.left = ""; }
        val.textContent = p.toFixed(2);
      }
    };
  }

  /* ================= MECANUM DRIVE ================= */
  function mecanum(container) {
    container.appendChild(el("h4", "", "Mecanum drive lab — move the sliders, watch the wheels and the robot"));
    container.appendChild(el("p", "", 'These three sliders are your gamepad inputs: <code>-gamepad1.left_stick_y</code> (drive), <code>gamepad1.left_stick_x</code> (strafe) and <code>gamepad1.right_stick_x</code> (turn). The bars show the power each wheel gets from the mecanum formula, and the robot on the field moves accordingly.'));

    const row = el("div", "sim-row");
    const left = el("div", "sim-col");
    const right = el("div", "sim-col sim-controls");

    const canvas = document.createElement("canvas");
    canvas.width = 420; canvas.height = 420;
    left.appendChild(canvas);

    const sAx = slider("drive (y)", -1, 1, 0.01, 0);
    const sLat = slider("strafe (x)", -1, 1, 0.01, 0);
    const sYaw = slider("turn (rx)", -1, 1, 0.01, 0);
    [sAx, sLat, sYaw].forEach(s => right.appendChild(s.label));

    const powers = el("div", "powers");
    const fl = powerBar("frontLeft");
    const bl = powerBar("backLeft");
    const fr = powerBar("frontRight");
    const br = powerBar("backRight");
    [fl, bl, fr, br].forEach(p => powers.appendChild(p.row));
    right.appendChild(powers);

    const btns = el("div", "sim-buttons");
    const presets = [
      ["Forward", 1, 0, 0], ["Strafe →", 0, 1, 0], ["Spin ↻", 0, 0, 1],
      ["Diagonal ↗", 1, 1, 0], ["Stop", 0, 0, 0]
    ];
    presets.forEach(([name, a, l, y]) => {
      const b = el("button", "btn ghost small", name);
      b.addEventListener("click", () => {
        sAx.input.value = a; sLat.input.value = l; sYaw.input.value = y;
        [sAx, sLat, sYaw].forEach(s => s.val.textContent = (+s.input.value).toFixed(2));
      });
      btns.appendChild(b);
    });
    right.appendChild(btns);

    const codeOut = el("div", "sim-code");
    right.appendChild(codeOut);

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);

    // robot state (field coords, canvas px)
    let rx = 210, ry = 210, rh = -Math.PI / 2; // heading: up
    const ctx = canvas.getContext("2d");
    let last = performance.now();

    function step(now) {
      if (!canvas.isConnected) return; // stop when lesson unloads
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const axial = +sAx.input.value;
      const lateral = +sLat.input.value;
      const yaw = +sYaw.input.value;

      let pfl = axial + lateral + yaw;
      let pbl = axial - lateral + yaw;
      let pfr = axial - lateral - yaw;
      let pbr = axial + lateral - yaw;
      const max = Math.max(1, Math.abs(pfl), Math.abs(pbl), Math.abs(pfr), Math.abs(pbr));
      pfl /= max; pbl /= max; pfr /= max; pbr /= max;

      fl.set(pfl); bl.set(pbl); fr.set(pfr); br.set(pbr);

      codeOut.textContent =
        "double axial   = " + axial.toFixed(2) + ";   // -left_stick_y\n" +
        "double lateral = " + lateral.toFixed(2) + ";   // left_stick_x\n" +
        "double yaw     = " + yaw.toFixed(2) + ";   // right_stick_x\n\n" +
        "frontLeft  = axial + lateral + yaw  →  " + pfl.toFixed(2) + "\n" +
        "backLeft   = axial - lateral + yaw  →  " + pbl.toFixed(2) + "\n" +
        "frontRight = axial - lateral - yaw  →  " + pfr.toFixed(2) + "\n" +
        "backRight  = axial + lateral - yaw  →  " + pbr.toFixed(2);

      // integrate robot motion (robot-centric)
      const speed = 140; // px/s
      const vx = axial * Math.cos(rh) - lateral * Math.sin(rh);
      const vy = axial * Math.sin(rh) + lateral * Math.cos(rh);
      rx += vx * speed * dt;
      ry += vy * speed * dt;
      rh += yaw * 2.4 * dt;
      rx = Math.max(30, Math.min(390, rx));
      ry = Math.max(30, Math.min(390, ry));

      draw();
      requestAnimationFrame(step);
    }

    function draw() {
      ctx.clearRect(0, 0, 420, 420);
      // field tiles
      ctx.strokeStyle = "#232b3b";
      for (let i = 0; i <= 6; i++) {
        ctx.beginPath(); ctx.moveTo(i * 70, 0); ctx.lineTo(i * 70, 420); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * 70); ctx.lineTo(420, i * 70); ctx.stroke();
      }
      // robot
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rh + Math.PI / 2);
      ctx.fillStyle = "#1b2230";
      ctx.strokeStyle = "#f57e25";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-24, -24, 48, 48, 6);
      ctx.fill(); ctx.stroke();
      // wheels
      ctx.fillStyle = "#4da3ff";
      [[-24, -20], [16, -20], [-24, 10], [16, 10]].forEach(([x, y]) => {
        ctx.fillRect(x, y, 8, 12);
      });
      // heading arrow
      ctx.fillStyle = "#f57e25";
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.lineTo(-7, -18); ctx.lineTo(7, -18);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(step);
  }

  /* ================= PID TUNING ================= */
  function pid(container) {
    container.appendChild(el("h4", "", "PID tuning lab — get the lift to the target line"));
    container.appendChild(el("p", "", 'This simulates a heavy lift moving to a target of <b>600 ticks</b>. Gravity constantly drags it down. Tune <code>kP</code>, <code>kI</code> and <code>kD</code>, then press <b>Run</b>. Try kP alone first — notice the oscillation and the droop — then fix it with kD and kI.'));

    const row = el("div", "sim-row");
    const left = el("div", "sim-col");
    const right = el("div", "sim-col sim-controls");

    const canvas = document.createElement("canvas");
    canvas.width = 460; canvas.height = 300;
    left.appendChild(canvas);
    const readout = el("div", "sim-readout", "");
    left.appendChild(readout);

    const sP = slider("kP", 0, 0.05, 0.001, 0.01);
    const sI = slider("kI", 0, 0.002, 0.0001, 0);
    const sD = slider("kD", 0, 0.01, 0.0005, 0);
    // wider readouts for small numbers
    [sP, sI, sD].forEach(s => {
      s.input.addEventListener("input", () => (s.val.textContent = (+s.input.value).toFixed(4)));
      s.val.textContent = (+s.input.value).toFixed(4);
      right.appendChild(s.label);
    });

    const btns = el("div", "sim-buttons");
    const run = el("button", "btn small", "▶ Run");
    const presetP = el("button", "btn ghost small", "P only");
    const presetPD = el("button", "btn ghost small", "PD");
    const presetPID = el("button", "btn ghost small", "Full PID");
    btns.appendChild(run); btns.appendChild(presetP); btns.appendChild(presetPD); btns.appendChild(presetPID);
    right.appendChild(btns);
    right.appendChild(el("div", "sim-code",
      "double error = target - position;\n" +
      "integral += error * dt;\n" +
      "double derivative = (error - lastError) / dt;\n" +
      "double power = kP*error + kI*integral + kD*derivative;\n" +
      "lift.setPower(power);\n" +
      "lastError = error;"));

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);

    const ctx = canvas.getContext("2d");
    const TARGET = 600, T_MAX = 4, POS_MAX = 1000;
    let trace = [];

    function setGains(p, i, d) {
      sP.input.value = p; sI.input.value = i; sD.input.value = d;
      [sP, sI, sD].forEach(s => (s.val.textContent = (+s.input.value).toFixed(4)));
    }
    presetP.addEventListener("click", () => setGains(0.012, 0, 0));
    presetPD.addEventListener("click", () => setGains(0.02, 0, 0.004));
    presetPID.addEventListener("click", () => setGains(0.02, 0.0008, 0.004));

    function simulate() {
      const kP = +sP.input.value, kI = +sI.input.value, kD = +sD.input.value;
      const dt = 0.01;
      let pos = 0, vel = 0, integral = 0, lastErr = TARGET;
      trace = [];
      for (let t = 0; t <= T_MAX; t += dt) {
        const error = TARGET - pos;
        integral += error * dt;
        const deriv = (error - lastErr) / dt;
        let power = kP * error + kI * integral + kD * deriv;
        power = Math.max(-1, Math.min(1, power));
        lastErr = error;
        // plant: motor accel minus gravity minus friction
        const accel = power * 2600 - 220 - vel * 1.9;
        vel += accel * dt;
        pos += vel * dt;
        if (pos < 0) { pos = 0; vel = Math.max(0, vel); }
        trace.push([t, pos]);
      }
      const finalErr = TARGET - trace[trace.length - 1][1];
      let overshoot = 0;
      trace.forEach(([, p]) => (overshoot = Math.max(overshoot, p - TARGET)));
      readout.textContent =
        "final error: " + finalErr.toFixed(0) + " ticks   |   overshoot: " +
        overshoot.toFixed(0) + " ticks" +
        (Math.abs(finalErr) < 15 && overshoot < 60 ? "   ✔ nicely tuned!" : "");
    }

    let animStart = null;
    function draw(now) {
      if (!canvas.isConnected) return;
      const W = 460, H = 300, padL = 44, padB = 26, padT = 12, padR = 66;
      ctx.clearRect(0, 0, W, H);

      const x = t => padL + (t / T_MAX) * (W - padL - padR);
      const y = p => H - padB - (p / POS_MAX) * (H - padB - padT);

      // axes
      ctx.strokeStyle = "#2a3345"; ctx.fillStyle = "#8b96a8";
      ctx.font = "11px Consolas, monospace";
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
      for (let p = 0; p <= POS_MAX; p += 200) {
        ctx.fillText(p, 6, y(p) + 4);
        ctx.strokeStyle = "#1c2330";
        ctx.beginPath(); ctx.moveTo(padL, y(p)); ctx.lineTo(W - padR, y(p)); ctx.stroke();
      }
      for (let t = 0; t <= T_MAX; t++) ctx.fillText(t + "s", x(t) - 6, H - 8);

      // target line
      ctx.strokeStyle = "#3ecf8e"; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(padL, y(TARGET)); ctx.lineTo(W - padR, y(TARGET)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#3ecf8e"; ctx.fillText("target 600", padL + 6, y(TARGET) - 6);

      // trace (animated reveal)
      const elapsed = animStart ? (now - animStart) / 1000 : T_MAX;
      const upTo = Math.min(elapsed, T_MAX);
      ctx.strokeStyle = "#f57e25"; ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (const [t, p] of trace) {
        if (t > upTo) break;
        if (!started) { ctx.moveTo(x(t), y(p)); started = true; }
        else ctx.lineTo(x(t), y(p));
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      // lift cartoon at right edge
      const cur = trace.length ? trace[Math.min(trace.length - 1, Math.floor((upTo / T_MAX) * (trace.length - 1)))][1] : 0;
      const lx = W - 34;
      ctx.strokeStyle = "#4da3ff";
      ctx.beginPath(); ctx.moveTo(lx, y(0)); ctx.lineTo(lx, y(POS_MAX)); ctx.stroke();
      ctx.fillStyle = "#4da3ff";
      ctx.fillRect(lx - 10, y(cur) - 6, 20, 12);

      if (elapsed < T_MAX) requestAnimationFrame(draw);
    }

    run.addEventListener("click", () => {
      simulate();
      animStart = performance.now();
      requestAnimationFrame(draw);
    });

    // initial render
    simulate();
    requestAnimationFrame(t => { animStart = t - T_MAX * 1000; draw(t); });
  }

  /* ================= PATH BUILDER ================= */
  function path(container) {
    container.appendChild(el("h4", "", "Path builder — click the field to drop waypoints"));
    container.appendChild(el("p", "", 'This is a top-down FTC field (12 ft × 12 ft, in field coordinates where +X is away from the audience). Click to add waypoints: a smooth spline is fit through them, just like Road Runner\'s <code>splineTo()</code> builds trajectories. Press <b>▶ Follow</b> to watch the robot drive it, and check the generated code below.'));

    const row = el("div", "sim-row");
    const left = el("div", "sim-col");

    const canvas = document.createElement("canvas");
    canvas.width = 440; canvas.height = 440;
    left.appendChild(canvas);

    const btns = el("div", "sim-buttons");
    const follow = el("button", "btn small", "▶ Follow path");
    const clear = el("button", "btn ghost small", "Clear");
    const undo = el("button", "btn ghost small", "Undo point");
    btns.appendChild(follow); btns.appendChild(clear); btns.appendChild(undo);
    left.appendChild(btns);

    const codeOut = el("div", "sim-code", "");
    row.appendChild(left);
    container.appendChild(row);
    container.appendChild(codeOut);

    const ctx = canvas.getContext("2d");
    const S = 440;
    // field coords: inches, -72..72 both axes. canvas y down = -field... map:
    const toPx = (fx, fy) => [S / 2 + (fy / 72) * (S / 2 - 20) * -1, S / 2 - (fx / 72) * (S / 2 - 20)];
    const toField = (px, py) => [((S / 2 - py) / (S / 2 - 20)) * 72, -(((px - S / 2)) / (S / 2 - 20)) * 72];

    let pts = [{ x: -60, y: -36 }]; // start pose
    let animT = null;

    canvas.addEventListener("pointerdown", e => {
      const r = canvas.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * S;
      const py = ((e.clientY - r.top) / r.height) * S;
      const [fx, fy] = toField(px, py);
      pts.push({ x: Math.round(fx), y: Math.round(fy) });
      animT = null;
      render();
    });
    clear.addEventListener("click", () => { pts = [{ x: -60, y: -36 }]; animT = null; render(); });
    undo.addEventListener("click", () => { if (pts.length > 1) pts.pop(); animT = null; render(); });

    // Catmull-Rom through points
    function splinePoints() {
      if (pts.length < 2) return pts.slice();
      const p = [pts[0], ...pts, pts[pts.length - 1]];
      const out = [];
      for (let i = 0; i < p.length - 3; i++) {
        for (let t = 0; t < 1; t += 0.02) {
          const t2 = t * t, t3 = t2 * t;
          const q = (c0, c1, c2, c3) =>
            0.5 * ((2 * c1) + (-c0 + c2) * t + (2 * c0 - 5 * c1 + 4 * c2 - c3) * t2 + (-c0 + 3 * c1 - 3 * c2 + c3) * t3);
          out.push({
            x: q(p[i].x, p[i + 1].x, p[i + 2].x, p[i + 3].x),
            y: q(p[i].y, p[i + 1].y, p[i + 2].y, p[i + 3].y)
          });
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    }

    function genCode() {
      if (pts.length < 2) {
        codeOut.textContent = "// Click the field to add waypoints…";
        return;
      }
      let s = "Pose2d beginPose = new Pose2d(" + pts[0].x + ", " + pts[0].y + ", Math.toRadians(0));\n";
      s += "MecanumDrive drive = new MecanumDrive(hardwareMap, beginPose);\n\n";
      s += "Actions.runBlocking(\n    drive.actionBuilder(beginPose)\n";
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1], cur = pts[i];
        const deg = Math.round(Math.atan2(cur.y - prev.y, cur.x - prev.x) * 180 / Math.PI);
        s += "        .splineTo(new Vector2d(" + cur.x + ", " + cur.y + "), Math.toRadians(" + deg + "))\n";
      }
      s += "        .build());";
      codeOut.textContent = s;
    }

    function render(robotIdx) {
      ctx.clearRect(0, 0, S, S);
      // field
      ctx.fillStyle = "#10151d";
      ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = "#232b3b";
      const inner = S - 40;
      for (let i = 0; i <= 6; i++) {
        const v = 20 + (inner / 6) * i;
        ctx.beginPath(); ctx.moveTo(v, 20); ctx.lineTo(v, S - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, v); ctx.lineTo(S - 20, v); ctx.stroke();
      }
      ctx.strokeStyle = "#3a465e";
      ctx.strokeRect(20, 20, inner, inner);
      ctx.fillStyle = "#5d6b81";
      ctx.font = "11px sans-serif";
      ctx.fillText("audience ↓", S / 2 - 26, S - 5);

      const sp = splinePoints();
      // path
      if (sp.length > 1) {
        ctx.strokeStyle = "#4da3ff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        sp.forEach((p, i) => {
          const [px, py] = toPx(p.x, p.y);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      // waypoints
      pts.forEach((p, i) => {
        const [px, py] = toPx(p.x, p.y);
        ctx.fillStyle = i === 0 ? "#3ecf8e" : "#f57e25";
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#dbe2ee";
        ctx.font = "10px Consolas, monospace";
        ctx.fillText(i === 0 ? "start" : "(" + p.x + ", " + p.y + ")", px + 9, py - 6);
      });
      // robot
      if (sp.length > 1) {
        const idx = robotIdx !== undefined ? robotIdx : 0;
        const p = sp[Math.min(idx, sp.length - 1)];
        const nxt = sp[Math.min(idx + 2, sp.length - 1)];
        const ang = Math.atan2(nxt.y - p.y, nxt.x - p.x);
        const [px, py] = toPx(p.x, p.y);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-ang + Math.PI / 2); // field→canvas rotation
        ctx.fillStyle = "#1b2230";
        ctx.strokeStyle = "#f57e25";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-16, -16, 32, 32, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f57e25";
        ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-6, -12); ctx.lineTo(6, -12); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      genCode();
    }

    follow.addEventListener("click", () => {
      const sp = splinePoints();
      if (sp.length < 2) return;
      let i = 0;
      function stepAnim() {
        if (!canvas.isConnected) return;
        render(i);
        i += 2;
        if (i < sp.length) requestAnimationFrame(stepAnim);
      }
      requestAnimationFrame(stepAnim);
    });

    render();
  }

  /* ================= LIMELIGHT AUTO-AIM ================= */
  function limelight(container) {
    container.appendChild(el("h4", "", "Limelight auto-aim lab — center the AprilTag with a P controller"));
    container.appendChild(el("p", "", 'The left panel is what the Limelight sees: an AprilTag somewhere in view. <code>tx</code> is how many degrees the tag is left/right of the crosshair. Your code turns the robot with <code>power = tx * kP</code>. Enable auto-aim and tune <code>kP</code> — too low is sluggish, too high oscillates. <b>Scramble</b> moves the tag.'));

    const row = el("div", "sim-row");
    const left = el("div", "sim-col");
    const right = el("div", "sim-col sim-controls");

    const canvas = document.createElement("canvas");
    canvas.width = 440; canvas.height = 260;
    left.appendChild(canvas);
    const readout = el("div", "sim-readout", "");
    left.appendChild(readout);

    const sKp = slider("kP", 0, 0.1, 0.002, 0.02);
    sKp.input.addEventListener("input", () => (sKp.val.textContent = (+sKp.input.value).toFixed(3)));
    sKp.val.textContent = "0.020";
    right.appendChild(sKp.label);

    const btns = el("div", "sim-buttons");
    const toggle = el("button", "btn small", "Enable auto-aim");
    const scramble = el("button", "btn ghost small", "Scramble tag");
    btns.appendChild(toggle); btns.appendChild(scramble);
    right.appendChild(btns);
    right.appendChild(el("div", "sim-code",
      'LLResult result = limelight.getLatestResult();\n' +
      'if (result != null && result.isValid()) {\n' +
      '    double tx = result.getTx();\n' +
      '    double turn = tx * kP;\n' +
      '    leftDrive.setPower(turn);\n' +
      '    rightDrive.setPower(-turn);\n' +
      '}'));

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);

    const ctx = canvas.getContext("2d");
    // world: tag at fixed bearing; robot heading rotates. tx = tagBearing - heading (deg)
    let tagBearing = 18, heading = 0, headingVel = 0, aiming = false;
    let last = performance.now();

    toggle.addEventListener("click", () => {
      aiming = !aiming;
      toggle.textContent = aiming ? "Disable auto-aim" : "Enable auto-aim";
      toggle.classList.toggle("ghost", aiming);
    });
    scramble.addEventListener("click", () => {
      tagBearing = (Math.random() * 44 - 22);
    });

    function step(now) {
      if (!canvas.isConnected) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const tx = tagBearing - heading;
      if (aiming) {
        const kP = +sKp.input.value;
        let turn = tx * kP;
        turn = Math.max(-1, Math.min(1, turn));
        // robot rotational dynamics with inertia
        headingVel += (turn * 260 - headingVel * 4.5) * dt;
      } else {
        headingVel += (-headingVel * 4.5) * dt;
      }
      heading += headingVel * dt;

      draw(tx);
      readout.textContent =
        "tx = " + tx.toFixed(1) + "°   |   turn power = " +
        (aiming ? Math.max(-1, Math.min(1, tx * +sKp.input.value)).toFixed(2) : "0.00") +
        (Math.abs(tx) < 1 && aiming ? "   ✔ locked on!" : "");
      requestAnimationFrame(step);
    }

    function draw(tx) {
      const W = 440, H = 260;
      ctx.clearRect(0, 0, W, H);
      // camera view background
      ctx.fillStyle = "#0b0f15";
      ctx.fillRect(0, 0, W, H);
      // FOV: ±28° maps to width
      const degToPx = d => W / 2 + (d / 28) * (W / 2);

      // crosshair
      ctx.strokeStyle = "#3ecf8e";
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      ctx.setLineDash([]);

      // AprilTag
      const tagX = degToPx(tx);
      if (tagX > -40 && tagX < W + 40) {
        const s = 56;
        ctx.fillStyle = "#fff";
        ctx.fillRect(tagX - s / 2, H / 2 - s / 2, s, s);
        ctx.fillStyle = "#000";
        ctx.fillRect(tagX - s / 2 + 7, H / 2 - s / 2 + 7, s - 14, s - 14);
        // fake tag pattern
        ctx.fillStyle = "#fff";
        [[0,0],[2,0],[1,1],[0,2],[2,2]].forEach(([cx, cy]) => {
          ctx.fillRect(tagX - 15 + cx * 10, H / 2 - 15 + cy * 10, 9, 9);
        });
        ctx.strokeStyle = "#f57e25";
        ctx.lineWidth = 2;
        ctx.strokeRect(tagX - s / 2 - 5, H / 2 - s / 2 - 5, s + 10, s + 10);
        ctx.lineWidth = 1;
        ctx.fillStyle = "#f57e25";
        ctx.font = "11px Consolas, monospace";
        ctx.fillText("ID 20", tagX - s / 2 - 5, H / 2 - s / 2 - 12);
      } else {
        ctx.fillStyle = "#8b96a8";
        ctx.font = "13px sans-serif";
        ctx.fillText("tag out of view — scramble again", W / 2 - 100, 30);
      }

      // tx label
      ctx.fillStyle = "#8b96a8";
      ctx.font = "12px Consolas, monospace";
      ctx.fillText("tx: " + tx.toFixed(1) + "°", 10, H - 12);
    }

    requestAnimationFrame(step);
  }

  window.Sims = { mecanum, pid, path, limelight };
})();
