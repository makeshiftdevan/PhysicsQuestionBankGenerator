/* Module 7 — Autonomous & Control */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Autonomous & Control Theory",
  desc: "Write autonomous routines that actually work: encoder moves, state machines, and PID control with a live tuning lab.",
  level: "intermediate",
  lessons: [

  /* ---------------- 7.1 ---------------- */
  {
    id: "auto-basics",
    title: "Autonomous foundations: time vs encoders",
    sub: "From “drive for 1.5 seconds and pray” to “drive exactly 24 inches.”",
    objectives: [
      "Why time-based autonomous is unreliable",
      "Building a driveInches() method with RUN_TO_POSITION",
      "Structuring an autonomous OpMode"
    ],
    blocks: [
      { t: "h2", text: "The rookie auto (and why it betrays you)" },
      { t: "code", caption: "Time-based autonomous", code:
`waitForStart();

setDrivePower(0.5);
sleep(1500);          // "about 24 inches... on a full battery... on this tile"
setDrivePower(0);` },
      { t: "p", html: `It works in testing, then drifts at competition. Distance = speed × time, but speed depends on <strong>battery voltage</strong> (a fresh battery drives noticeably faster), floor traction, robot weight, and motor temperature. Every one changes between your practice field and match 27. Time-based moves are fine for crude actions (“run intake for a second”), never for positioning.` },

      { t: "h2", text: "Encoder-based driving" },
      { t: "p", html: `Encoders measure actual wheel rotation, so battery and speed stop mattering — the move ends when the distance is <em>done</em>. Combine the tick math from Module 4 with <code>RUN_TO_POSITION</code>:` },
      { t: "code", caption: "driveInches() — the workhorse of encoder autos", code:
`static final double TICKS_PER_INCH = 537.7 / (3.78 * Math.PI);

public void driveInches(double inches, double power) {
    int move = (int) (inches * TICKS_PER_INCH);

    // target = current + move, for every drive motor
    frontLeft.setTargetPosition(frontLeft.getCurrentPosition() + move);
    backLeft.setTargetPosition(backLeft.getCurrentPosition() + move);
    frontRight.setTargetPosition(frontRight.getCurrentPosition() + move);
    backRight.setTargetPosition(backRight.getCurrentPosition() + move);

    setMode(DcMotor.RunMode.RUN_TO_POSITION);   // helper: sets all 4
    setDrivePower(Math.abs(power));

    while (opModeIsActive() && frontLeft.isBusy()) {
        telemetry.addData("pos", frontLeft.getCurrentPosition());
        telemetry.addData("target", frontLeft.getTargetPosition());
        telemetry.update();
    }
    setDrivePower(0);
    setMode(DcMotor.RunMode.RUN_USING_ENCODER);
}` },
      { t: "p", html: `Negative <code>inches</code> drives backward automatically — the target ends up behind the current position and <code>RUN_TO_POSITION</code> figures out the direction (remember, it ignores power's sign).` },

      { t: "h2", text: "An auto that reads like a plan" },
      { t: "code", caption: "Full autonomous structure", code:
`@Autonomous(name = "Blue Left — Score & Park", preselectTeleOp = "Mecanum TeleOp")
public class BlueLeftAuto extends LinearOpMode {

    @Override
    public void runOpMode() {
        initHardware();               // lookups, directions, encoder resets

        telemetry.addData("Status", "Ready — Blue Left");
        telemetry.update();
        waitForStart();

        driveInches(26, 0.5);         // to the scoring zone
        turnToAngle(-45);             // face the target (Module 5!)
        liftTo(LIFT_HIGH);            // raise lift
        openClaw();                   // score
        sleep(300);                   // let the piece fall (fine use of sleep)
        liftTo(LIFT_GROUND);
        turnToAngle(90);
        driveInches(30, 0.7);         // park
    }
}` },
      { t: "note", style: "tip", html: `<p>Keep the top level readable as strategy — every line a verb. All the tick math and while-loops live inside the helper methods (better yet, in a shared base class or the RobotHardware class from Module 2, so all your autos share them).</p>` },
      { t: "quiz",
        q: "Your time-based auto overshoots at competition but was perfect at home. The most likely culprit?",
        opts: [
          "The field is bigger at competition",
          "A fresher battery made the robot faster, and time-based moves assume a fixed speed",
          "The code changed itself",
          "Encoders drifted"
        ],
        a: 1,
        explain: `Speed-at-a-given-power varies with voltage — that's the fundamental flaw of time-based motion. Encoder moves are immune: they measure the distance actually traveled and stop when it's reached.` },
      { t: "quiz",
        q: "In driveInches, why is the target `getCurrentPosition() + move` rather than just `move`?",
        opts: [
          "It's shorter to type",
          "Encoders keep counting across moves — targets must be relative to wherever the motor is NOW, or every move after the first goes to the wrong place",
          "getCurrentPosition() resets the encoder",
          "RUN_TO_POSITION requires positive numbers"
        ],
        a: 1,
        explain: `After the first 24″ move, the encoder reads ≈1088 ticks. If the second move set target = 1088 again, the robot wouldn't move at all. Relative targets (current + move) make each call mean “from here.” The alternative is resetting encoders every move — more fragile.` }
    ]
  },

  /* ---------------- 7.2 ---------------- */
  {
    id: "state-machines",
    title: "State machines",
    sub: "Do several things at once, react to events, never block the loop — the architecture of serious FTC code.",
    objectives: [
      "Why sequential (blocking) code limits your robot",
      "Building a state machine with an enum + switch",
      "Using ElapsedTime instead of sleep"
    ],
    blocks: [
      { t: "h2", text: "The wall you eventually hit" },
      { t: "p", html: `Sequential autos (<code>driveInches(...); liftTo(...);</code>) do one thing at a time: the robot drives, <em>then</em> raises the lift. Competitive robots raise the lift <em>while</em> driving — that's seconds saved per cycle. And TeleOp automation (“press Y → run a 3-step scoring sequence”) can't use <code>sleep()</code> at all without freezing the drivers. The answer to both is the <strong>state machine</strong>.` },
      { t: "p", html: `A state machine remembers <strong>which step it's on</strong> in a variable, does one small non-blocking piece of work per loop, and moves to the next state when a <em>condition</em> is met (position reached, timer expired). The loop keeps spinning fast, so everything else keeps working.` },

      { t: "h2", text: "The pattern: enum + switch + timer" },
      { t: "code", caption: "Automated scoring sequence in TeleOp", code:
`enum ScoreState { IDLE, LIFT_RAISING, DUMPING, RETRACTING }

ScoreState scoreState = ScoreState.IDLE;
ElapsedTime scoreTimer = new ElapsedTime();

while (opModeIsActive()) {
    // ---- drive code runs EVERY loop, never blocked ----
    driveFieldCentric(gamepad1);

    // ---- scoring state machine ----
    switch (scoreState) {
        case IDLE:
            if (gamepad2.y) {                    // start the sequence
                lift.setTargetPosition(LIFT_HIGH);
                lift.setPower(1.0);
                scoreState = ScoreState.LIFT_RAISING;
            }
            break;

        case LIFT_RAISING:
            if (Math.abs(lift.getCurrentPosition() - LIFT_HIGH) < 20) {
                dumpServo.setPosition(DUMP_OPEN);
                scoreTimer.reset();              // start timing the dump
                scoreState = ScoreState.DUMPING;
            }
            break;

        case DUMPING:
            if (scoreTimer.seconds() > 0.4) {    // non-blocking "sleep"
                dumpServo.setPosition(DUMP_CLOSED);
                lift.setTargetPosition(LIFT_GROUND);
                scoreState = ScoreState.RETRACTING;
            }
            break;

        case RETRACTING:
            if (lift.getCurrentPosition() < 30) {
                scoreState = ScoreState.IDLE;    // ready for next press
            }
            break;
    }

    telemetry.addData("score state", scoreState);
    telemetry.update();
}` },
      { t: "ul", items: [
        `<strong>One case runs per loop</strong> — each does a quick check and maybe a transition. No case ever waits.`,
        `<code>ElapsedTime</code> + a threshold replaces <code>sleep()</code>: the timer runs in the background while the loop keeps spinning.`,
        `Drivers keep full control the whole time — the drive code is outside the switch, running every iteration.`,
        `An abort is easy: <code>if (gamepad2.b) scoreState = ScoreState.RETRACTING;</code> — try adding that to blocking code!`
      ]},
      { t: "note", style: "rule", html: `<p>Telemetry the current state, always. When a sequence hangs, the display says exactly which transition condition never fired — turning “it's stuck, no idea why” into “LIFT_RAISING never sees 20 ticks of tolerance; the lift stalls at 1490.”</p>` },

      { t: "h2", text: "The same idea powers autonomous" },
      { t: "p", html: `An auto becomes states like <code>DRIVE_TO_SCORE → RAISE_AND_AIM → DUMP → DRIVE_TO_PARK</code>. Because nothing blocks, you can run the lift <em>during</em> the drive state — just command both and make the transition require both to finish:` },
      { t: "code", caption: "Parallel actions via transition conditions", code:
`case DRIVE_TO_SCORE:   // lift was commanded when we entered this state
    if (driveReachedTarget() && liftAtHeight(LIFT_HIGH)) {
        scoreState = AutoState.DUMP;
    }
    break;` },
      { t: "quiz",
        q: "Why use ElapsedTime + a check instead of sleep(400) inside a state machine?",
        opts: [
          "ElapsedTime is more precise",
          "sleep blocks the whole loop — drive control and every other mechanism would freeze for 400 ms. The timer check lets the loop keep running everything else",
          "sleep doesn't work in TeleOp",
          "Timers use less CPU"
        ],
        a: 1,
        explain: `The entire value of a state machine is a never-blocked loop. One sleep() anywhere breaks that guarantee for every subsystem. Timers make waiting just another condition to check each pass.` },
      { t: "quiz",
        q: "Your scoring sequence freezes in DUMPING forever. Telemetry shows scoreTimer.seconds() climbing normally. What's the likely bug?",
        opts: [
          "The timer is broken",
          "You forgot to call scoreTimer.reset() when entering DUMPING — no wait, seconds() is climbing… the transition condition or state assignment must be wrong, e.g. missing break or wrong threshold",
          "ElapsedTime needs batteries",
          "switch statements can't have four cases"
        ],
        a: 1,
        explain: `Debug from the data: the timer runs, so the condition <code>seconds() > 0.4</code> should fire — unless the code never reaches it (missing <code>break</code> in a previous case re-runs the wrong state) or the assignment sets the wrong state. Reading state + timer on telemetry narrows it to one line.` },
      { t: "fill",
        intro: `Complete the state machine fragment: transition from RAISING to DUMPING when the lift is within 20 ticks of target.`,
        code:
`case RAISING:
    if (Math.abs(lift.getCurrentPosition() - LIFT_HIGH) @@1@@ 20) {
        dumpServo.setPosition(DUMP_OPEN);
        scoreTimer.@@2@@();
        scoreState = ScoreState.@@3@@;
    }
    break;`,
        blanks: [
          { answer: "<", hint: "op", size: 45 },
          { answer: "reset", hint: "method", size: 80 },
          { answer: "DUMPING", hint: "state", size: 110 }
        ]}
    ]
  },

  /* ---------------- 7.3 ---------------- */
  {
    id: "pid",
    title: "PID control",
    sub: "The most famous algorithm in robotics — understand it, code it, then tune it in the live lab.",
    objectives: [
      "What P, I, and D each contribute",
      "Implementing a PID loop in Java",
      "Hands-on tuning intuition in the simulator"
    ],
    blocks: [
      { t: "h2", text: "The problem" },
      { t: "p", html: `You want a lift at exactly 600 ticks. Full power until you're there overshoots wildly; too little power never arrives (gravity!). You met the fix in Module 5's turn code: make power depend on <strong>error</strong> = target − current. PID is that idea, completed — three terms added together:` },
      { t: "table",
        head: ["Term", "Formula", "Personality", "Fixes"],
        rows: [
          [`<strong>P</strong>roportional`, `kP × error`, `“How far away am I? Push proportionally.”`, `Gets you to the target fast`],
          [`<strong>I</strong>ntegral`, `kI × Σ(error·dt)`, `“I've been slightly low for a while… push a bit more.”`, `Steady-state droop (gravity, friction)`],
          [`<strong>D</strong>erivative`, `kD × d(error)/dt`, `“I'm approaching fast — ease off!”`, `Overshoot and oscillation`]
        ]},
      { t: "code", caption: "A complete PID controller in Java", code:
`public class PIDController {
    private double kP, kI, kD;
    private double integral = 0;
    private double lastError = 0;
    private ElapsedTime timer = new ElapsedTime();

    public PIDController(double kP, double kI, double kD) {
        this.kP = kP; this.kI = kI; this.kD = kD;
    }

    public double update(double target, double current) {
        double error = target - current;
        double dt = timer.seconds();
        timer.reset();

        integral += error * dt;
        double derivative = (dt > 0) ? (error - lastError) / dt : 0;
        lastError = error;

        return kP * error + kI * integral + kD * derivative;
    }
}` },
      { t: "code", caption: "Using it on a lift (every loop!)", code:
`PIDController liftPID = new PIDController(0.02, 0.0008, 0.004);

while (opModeIsActive()) {
    double power = liftPID.update(liftTarget, lift.getCurrentPosition());
    lift.setPower(Range.clip(power, -1, 1));
    // ... rest of TeleOp
}` },
      { t: "note", style: "info", html: `<p>Wait — doesn't <code>RUN_TO_POSITION</code> already do this? Yes: it runs a PID <em>inside the hub</em>. Writing your own buys you control over the gains, custom behaviors (motion profiles, feedforward), and it's mandatory knowledge for understanding pathing libraries in Module 8, which run PIDs on the robot's whole position.</p>` },

      { t: "h2", text: "Tuning: learn it by feel" },
      { t: "p", html: `Textbook tuning procedure: start with kI = kD = 0. Raise kP until the mechanism reaches the target quickly but oscillates a bit. Add kD to damp the oscillation. If it settles slightly below the target (gravity droop), add a whisper of kI. Now experience each step yourself:` },
      { t: "sim", name: "pid" },
      { t: "h3", text: "What you should have noticed" },
      { t: "ul", items: [
        `<strong>kP alone:</strong> either slow and droopy (low kP) or fast with oscillation (high kP). Gravity means P-only settles <em>below</em> 600 — at the point where kP × error exactly cancels gravity.`,
        `<strong>Adding kD:</strong> the oscillation dies out; you can afford a bigger kP. D resists <em>change</em>, acting like a damper.`,
        `<strong>Adding kI:</strong> the last stubborn gap to 600 closes — I accumulates until the droop is gone. Too much kI causes slow, wallowing oscillation (and “integral windup” — real implementations clamp the integral).`
      ]},
      { t: "quiz",
        q: "Your lift oscillates around the target, never settling. Which change helps most directly?",
        opts: [
          "Increase kP",
          "Increase kI",
          "Increase kD (or reduce kP)",
          "Increase the loop time"
        ],
        a: 2,
        explain: `Oscillation means corrections are too aggressive for the system's momentum. D-term damping opposes the rapid error changes; lowering kP reduces the aggression. More P or I would make it worse.` },
      { t: "quiz",
        q: "A P-only controller holds a heavy lift at 570 when the target is 600 — stable, but 30 ticks low, forever. Why, and what fixes it?",
        opts: [
          "kD is missing; add kD",
          "At 570 the P output (kP × 30) exactly balances gravity, so there's no net force to climb further. The I term accumulates this persistent error and adds the missing push",
          "The encoder is broken",
          "The target is unreachable"
        ],
        a: 1,
        explain: `Steady-state error is P control's signature weakness with constant disturbances like gravity: it needs nonzero error to produce nonzero output. Integral action exists precisely to erase that. (Feedforward — adding a constant anti-gravity term — is the other classic fix.)` },
      { t: "fill",
        intro: `Complete the PID update.`,
        code:
`double error = @@1@@ - current;
integral += error * dt;
double derivative = (error - @@2@@) / dt;
lastError = error;
return kP * error + kI * @@3@@ + kD * derivative;`,
        blanks: [
          { answer: "target", hint: "var", size: 90 },
          { answer: "lastError", hint: "var", size: 110 },
          { answer: "integral", hint: "var", size: 100 }
        ]}
    ]
  }
]});
