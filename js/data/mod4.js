/* Module 4 — Motors, Servos & Encoders */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Motors, Servos & Encoders",
  desc: "Precise control of everything that moves: run modes, encoder math, servo mechanics, and a preset-driven lift.",
  level: "beginner",
  lessons: [

  /* ---------------- 4.1 ---------------- */
  {
    id: "encoders",
    title: "Encoders: how a motor knows where it is",
    sub: "The little sensor that turns “spin at 50%” into “move exactly 12 inches.”",
    objectives: [
      "What encoder ticks are and how to read them",
      "Ticks-per-revolution and converting ticks to distance",
      "Resetting encoders and why zero matters"
    ],
    blocks: [
      { t: "h2", text: "Ticks" },
      { t: "p", html: `An <strong>encoder</strong> counts tiny fractions of a motor shaft's rotation, called <strong>ticks</strong>. The count starts at 0 (when reset), increases as the motor turns forward, decreases in reverse. Reading it is one call:` },
      { t: "code", caption: "Reading an encoder", code:
`int position = liftMotor.getCurrentPosition();   // ticks since reset
telemetry.addData("Lift position", position);` },
      { t: "p", html: `Each motor has a fixed <strong>ticks-per-revolution (TPR)</strong> that depends on its gearbox. Common values:` },
      { t: "table",
        head: ["Motor", "Ticks per output revolution"],
        rows: [
          ["REV HD Hex 20:1", "560"],
          ["REV HD Hex 40:1", "1120"],
          ["goBILDA 5202/5203 (19.2:1, 312 RPM)", "537.7"],
          ["goBILDA 5202/5203 (13.7:1, 435 RPM)", "384.5"],
          ["REV Core Hex", "288"]
        ]},
      { t: "note", style: "tip", html: `<p>Always look up your exact motor's TPR on the manufacturer's page — using the wrong constant makes every distance calculation silently wrong by a fixed ratio (a classic “my auto drives 80% of the distance” bug).</p>` },

      { t: "h2", text: "From ticks to inches" },
      { t: "p", html: `For a drivetrain: one wheel revolution moves the robot one wheel circumference. Chain the conversions:` },
      { t: "code", caption: "The distance formula every team derives", code:
`static final double TICKS_PER_REV = 537.7;   // goBILDA 312 RPM
static final double WHEEL_DIAMETER_IN = 3.78; // 96mm goBILDA wheel
static final double TICKS_PER_INCH =
        TICKS_PER_REV / (WHEEL_DIAMETER_IN * Math.PI);

// how far to drive 24 inches?
int targetTicks = (int) (24 * TICKS_PER_INCH);   // ≈ 1088 ticks` },
      { t: "p", html: `(If the motor drives the wheel through extra gears or sprockets, multiply by that ratio too.)` },

      { t: "h2", text: "Resetting to zero" },
      { t: "p", html: `Encoders count from wherever they were when reset. At init, reset the mechanisms whose position you care about, <em>with the mechanism in a known physical position</em> (lift all the way down, arm resting):` },
      { t: "code", caption: "Encoder reset at init", code:
`lift.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER); // zero the count
lift.setMode(DcMotor.RunMode.RUN_USING_ENCODER);      // back to a running mode` },
      { t: "note", style: "warn", html: `<p><code>STOP_AND_RESET_ENCODER</code> also stops the motor and leaves it in a non-running mode — always switch back to a running mode afterwards, or later <code>setPower</code> calls will do nothing.</p>` },
      { t: "quiz",
        q: "A goBILDA 312 RPM motor (537.7 TPR) directly drives a wheel of circumference 12 in. Roughly how many ticks is 36 inches?",
        opts: ["~537", "~1613", "~4837", "~134"],
        a: 1,
        explain: `36 in ÷ 12 in per rev = 3 revolutions → 3 × 537.7 ≈ 1613 ticks. Working tick math forwards and backwards should feel routine — it's the foundation of encoder autonomous.` },
      { t: "quiz",
        q: "Why must the lift be physically at the bottom when you reset its encoder?",
        opts: [
          "Otherwise the encoder breaks",
          "Because after reset, code treats the current position as 0 — all targets are measured from wherever the mechanism was at reset",
          "The SDK requires it",
          "To calibrate the battery"
        ],
        a: 1,
        explain: `Zero is defined by the reset moment. If the lift is half-raised at reset, “go to 0” now means half-raised, and every preset is shifted. Known physical position at reset = trustworthy coordinates forever after.` }
    ]
  },

  /* ---------------- 4.2 ---------------- */
  {
    id: "run-modes",
    title: "Motor run modes",
    sub: "Four modes, four behaviors — choosing the right one is half of motor control.",
    objectives: [
      "RUN_WITHOUT_ENCODER vs RUN_USING_ENCODER",
      "RUN_TO_POSITION: the built-in position controller",
      "Which mode to use for drivetrain, lift, flywheel"
    ],
    blocks: [
      { t: "h2", text: "The four modes" },
      { t: "table",
        head: ["Mode", "setPower means…", "Use for"],
        rows: [
          [`<code>RUN_WITHOUT_ENCODER</code>`, `Raw voltage fraction. Simple and instant.`, `Drivetrains in TeleOp, simple intakes`],
          [`<code>RUN_USING_ENCODER</code>`, `Target <em>velocity</em> — the hub adjusts voltage to hold a steady speed as the battery sags or load changes`, `Flywheels, consistent-speed mechanisms`],
          [`<code>RUN_TO_POSITION</code>`, `Max speed toward <code>setTargetPosition()</code> — hub drives the motor to the target and actively holds it`, `Lifts, arms, encoder-based auto moves`],
          [`<code>STOP_AND_RESET_ENCODER</code>`, `(not a running mode) zeros the encoder`, `Init, re-homing`]
        ]},
      { t: "note", style: "info", html: `<p>Surprise for many teams: <code>RUN_USING_ENCODER</code> makes drivetrains feel <em>slower</em> — it caps power to a velocity target it can always achieve. That's why TeleOp drivetrains usually use <code>RUN_WITHOUT_ENCODER</code>. You can still <em>read</em> the encoder in any mode!</p>` },

      { t: "h2", text: "RUN_TO_POSITION: the magic one" },
      { t: "p", html: `Give the hub a target and a max power; it accelerates, approaches, and holds the position — a built-in feedback controller. The order of calls matters:` },
      { t: "code", caption: "The RUN_TO_POSITION recipe (order matters!)", code:
`lift.setTargetPosition(1200);                       // 1. target FIRST
lift.setMode(DcMotor.RunMode.RUN_TO_POSITION);      // 2. then the mode
lift.setPower(0.8);                                 // 3. then max power

while (opModeIsActive() && lift.isBusy()) {         // 4. wait (in auto)
    telemetry.addData("lift", lift.getCurrentPosition());
    telemetry.update();
}` },
      { t: "ul", items: [
        `Setting the mode before a target throws an exception (“must set target position first”).`,
        `In <code>RUN_TO_POSITION</code>, power's <em>sign is ignored</em> — the hub picks the direction. <code>setPower(0.8)</code> works for both up and down moves.`,
        `<code>isBusy()</code> is true until the motor gets close to the target.`,
        `Leaving power on after arrival makes the motor <em>hold</em> the position — great for lifts fighting gravity.`
      ]},

      { t: "h2", text: "Velocity control for flywheels" },
      { t: "p", html: `Cast to <code>DcMotorEx</code> (an extended interface) for direct velocity control in ticks/second — much more consistent shooting than raw power:` },
      { t: "code", caption: "DcMotorEx velocity API", code:
`DcMotorEx flywheel = hardwareMap.get(DcMotorEx.class, "flywheel");
flywheel.setVelocity(1800);                    // ticks per second
double actual = flywheel.getVelocity();        // measure it
telemetry.addData("flywheel", "%.0f / 1800", actual);` },
      { t: "quiz",
        q: "Your lift code throws “java.lang.IllegalArgumentException: motor must have a target position before RUN_TO_POSITION.” What's wrong?",
        opts: [
          "The encoder cable is unplugged",
          "You called setMode(RUN_TO_POSITION) before setTargetPosition()",
          "The power is negative",
          "The lift is too heavy"
        ],
        a: 1,
        explain: `The SDK insists on a target before entering the mode — otherwise the motor would take off toward an undefined position. Remember: target → mode → power.` },
      { t: "quiz",
        q: "Best mode for a TeleOp drivetrain that should feel responsive and use full power?",
        opts: [
          "RUN_TO_POSITION",
          "RUN_USING_ENCODER",
          "RUN_WITHOUT_ENCODER",
          "STOP_AND_RESET_ENCODER"
        ],
        a: 2,
        explain: `Raw power mode gives instant, full-range response — what drivers want. Velocity mode (<code>RUN_USING_ENCODER</code>) trades top speed for consistency; position mode is for point-to-point moves, not stick driving.` },
      { t: "fill",
        intro: `Send an arm to 850 ticks at 60% power — in the right order.`,
        code:
`arm.@@1@@(850);
arm.setMode(DcMotor.RunMode.@@2@@);
arm.setPower(@@3@@);`,
        blanks: [
          { answer: "setTargetPosition", hint: "method", size: 170 },
          { answer: "RUN_TO_POSITION", hint: "mode", size: 170 },
          { answer: ["0.6", ".6"], hint: "power", size: 70 }
        ]}
    ]
  },

  /* ---------------- 4.3 ---------------- */
  {
    id: "servos",
    title: "Servos in depth",
    sub: "Positions, ranges, continuous rotation, and finding your mechanism's magic numbers.",
    objectives: [
      "setPosition and what 0.0–1.0 physically means",
      "Finding and storing servo positions as constants",
      "Continuous rotation servos and when to use them"
    ],
    blocks: [
      { t: "h2", text: "Position servos" },
      { t: "p", html: `A standard servo sweeps a fixed arc (REV Smart Robot Servo: 270°). <code>setPosition(0.0)</code> is one end, <code>1.0</code> the other, <code>0.5</code> the middle. The servo drives itself to the commanded position and <em>actively holds it</em> — no encoder, no waiting API, it just goes:` },
      { t: "code", caption: "Servo control", code:
`Servo wrist = hardwareMap.get(Servo.class, "wrist");

wrist.setPosition(0.0);    // one end of travel
wrist.setPosition(1.0);    // other end
wrist.setPosition(0.37);   // anywhere in between` },
      { t: "note", style: "warn", html: `<p>Servos give no feedback — <code>getPosition()</code> returns the last <em>commanded</em> value, not where the horn truly is. And a servo commanded into a hard stop will stall, buzz, overheat, and strip gears. Find your mechanism's real usable range and never command past it.</p>` },

      { t: "h2", text: "Finding the magic numbers" },
      { t: "p", html: `Every claw has two numbers that matter: the position where it's open, and where it grips. Find them experimentally with a tester OpMode, then freeze them as constants:` },
      { t: "code", caption: "Servo tester — nudge with the D-pad, read the value", code:
`double pos = 0.5;

while (opModeIsActive()) {
    if (gamepad1.dpad_up)   pos += 0.001;
    if (gamepad1.dpad_down) pos -= 0.001;
    pos = Range.clip(pos, 0, 1);

    wrist.setPosition(pos);
    telemetry.addData("position", "%.3f", pos);
    telemetry.update();
}
// Move it where you want, write the number down, done:
// final double WRIST_SCORE = 0.712;` },

      { t: "h2", text: "Continuous rotation (CR) servos" },
      { t: "p", html: `A CR servo ignores position entirely — it's a small motor. The SDK gives it a motor-like API: <code>setPower()</code> from -1 to 1, where 0 is stop. Configure it as a <code>CRServo</code>:` },
      { t: "code", caption: "CRServo", code:
`CRServo spinner = hardwareMap.get(CRServo.class, "spinner");
spinner.setPower(1.0);    // full speed one way
spinner.setPower(0.0);    // stop
spinner.setPower(-0.6);   // 60% the other way` },
      { t: "table",
        head: ["Need", "Device", "API"],
        rows: [
          ["Hold an exact angle (claw, wrist)", "Servo", `<code>setPosition(0–1)</code>`],
          ["Spin continuously, light load (intake roller)", "CRServo", `<code>setPower(-1–1)</code>`],
          ["Spin continuously, heavy load / need feedback", "DcMotor", `<code>setPower</code> + encoder`]
        ]},
      { t: "quiz",
        q: "getPosition() on a Servo returns…",
        opts: [
          "The measured angle of the servo horn",
          "The last position you commanded — the servo has no feedback to report",
          "The servo's speed",
          "A random value"
        ],
        a: 1,
        explain: `Hobby-style servos are open-loop from the code's perspective. If someone physically forces the claw open, your code has no idea. Plan mechanisms (and match strategy) accordingly.` },
      { t: "quiz",
        q: "Your claw servo buzzes loudly and gets hot when closed on a game piece. Likely fix?",
        opts: [
          "Use setPower instead",
          "The closed-position constant commands it past where it can physically reach — back it off until it grips firmly without stalling",
          "Reverse the servo direction",
          "Add a second servo"
        ],
        a: 1,
        explain: `Buzzing + heat = stall: the servo is straining toward an unreachable position. Tune the constant so it grips with slight pressure, not maximum force. Servos die at competitions from exactly this.` }
    ]
  },

  /* ---------------- 4.4 ---------------- */
  {
    id: "lift-presets",
    title: "Project: a lift with preset heights",
    sub: "Combining encoders, RUN_TO_POSITION, and button logic into the most common FTC mechanism.",
    objectives: [
      "Designing preset positions as constants",
      "Driving a lift to presets with buttons",
      "Adding manual override and a safety bottom limit"
    ],
    blocks: [
      { t: "h2", text: "The goal" },
      { t: "p", html: `Nearly every FTC game rewards scoring at fixed heights. The winning TeleOp pattern: the operator presses one button, the lift flies to exactly the right height while they think about the next game piece. Let's build it properly.` },
      { t: "code", caption: "Presets + button selection", code:
`// Found by raising the lift manually and reading telemetry:
final int LIFT_GROUND = 0;
final int LIFT_LOW    = 750;
final int LIFT_MID    = 1500;
final int LIFT_HIGH   = 2250;

int liftTarget = LIFT_GROUND;

while (opModeIsActive()) {
    // --- pick a target ---
    if (gamepad2.a)      liftTarget = LIFT_GROUND;
    else if (gamepad2.x) liftTarget = LIFT_LOW;
    else if (gamepad2.y) liftTarget = LIFT_MID;
    else if (gamepad2.b) liftTarget = LIFT_HIGH;

    // --- command the motor every loop ---
    lift.setTargetPosition(liftTarget);
    lift.setMode(DcMotor.RunMode.RUN_TO_POSITION);
    lift.setPower(1.0);

    telemetry.addData("target", liftTarget);
    telemetry.addData("actual", lift.getCurrentPosition());
    telemetry.update();
}` },
      { t: "p", html: `Notice the structure: buttons only change <code>liftTarget</code> (a plain <code>int</code>), and the motor is commanded from that variable every loop. Separating “what the operator wants” from “commanding hardware” keeps the code easy to extend — that separation is the seed of real robot architecture.` },

      { t: "h2", text: "Adding manual fine-tuning" },
      { t: "p", html: `Presets are 95% of the job; drivers still want a nudge for the last inch. Blend stick input into the target:` },
      { t: "code", caption: "Manual nudge on top of presets", code:
`// stick moves the TARGET, not the motor directly
double nudge = -gamepad2.right_stick_y;
if (Math.abs(nudge) > 0.1) {              // deadzone: ignore drift
    liftTarget += (int) (nudge * 15);     // ~15 ticks per loop
    liftTarget = Range.clip(liftTarget, 0, LIFT_HIGH + 100);
}` },
      { t: "note", style: "tip", html: `<p>The deadzone (<code>Math.abs(nudge) > 0.1</code>) matters: gamepad sticks rarely rest at exactly 0.0, and without it the lift slowly creeps. Deadzone every analog input that changes state.</p>` },

      { t: "h2", text: "Safety: trust physics, not just numbers" },
      { t: "p", html: `What if the encoder zero is wrong (belt skipped, robot restarted mid-match)? A <strong>limit switch</strong> at the bottom gives you truth. When it's pressed: stop driving down and re-zero:` },
      { t: "code", caption: "Auto re-homing with a touch sensor", code:
`if (bottomLimit.isPressed() && liftTarget <= 0) {
    lift.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER);
    lift.setMode(DcMotor.RunMode.RUN_TO_POSITION);
    liftTarget = 0;
    lift.setTargetPosition(0);
}` },
      { t: "quiz",
        q: "Why do buttons set liftTarget instead of calling lift.setTargetPosition directly inside each if?",
        opts: [
          "It compiles faster",
          "Separating intent (target variable) from hardware commands makes it trivial to add nudge, clamping, and safety checks in one place before the motor is commanded",
          "setTargetPosition can only be called once",
          "Buttons can't call methods"
        ],
        a: 1,
        explain: `With one variable holding “desired height,” every feature (presets, nudge, limits, re-homing) just manipulates that variable, and exactly one code path talks to the motor. Direct calls scattered through the ifs turn into spaghetti as features grow.` },
      { t: "fill",
        intro: `Add the deadzone and clip to the manual nudge.`,
        code:
`double nudge = -gamepad2.right_stick_y;
if (Math.@@1@@(nudge) > @@2@@) {
    liftTarget += (int) (nudge * 15);
    liftTarget = Range.@@3@@(liftTarget, 0, 2350);
}`,
        blanks: [
          { answer: "abs", hint: "method", size: 70 },
          { answer: ["0.1", "0.05", ".1"], hint: "deadzone", size: 70 },
          { answer: "clip", hint: "method", size: 70 }
        ]}
    ]
  }
]});
