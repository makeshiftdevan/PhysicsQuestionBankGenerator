/* Module 10 — Level Up */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Level Up: Architecture & Beyond",
  desc: "Organize a season-sized codebase like the top teams, and know where to go from here.",
  level: "advanced",
  lessons: [

  /* ---------------- 10.1 ---------------- */
  {
    id: "architecture",
    title: "Structuring a competition codebase",
    sub: "From one giant file to subsystems — code your whole team can work on.",
    objectives: [
      "The subsystem pattern",
      "Sharing code between TeleOp and autonomous",
      "Version control habits that save seasons"
    ],
    blocks: [
      { t: "h2", text: "The 800-line OpMode problem" },
      { t: "p", html: `Every team's first season ends with a TeleOp file nobody wants to touch: drive code tangled with lift code tangled with claw timers. Adding a feature breaks two others; only one student understands it; they graduate. The cure is the <strong>subsystem pattern</strong> — each mechanism becomes a class (Module 2!) that owns its hardware and exposes intent-level methods:` },
      { t: "code", caption: "A subsystem: owns hardware, exposes intent", code:
`public class Lift {
    public static final int GROUND = 0, LOW = 750, MID = 1500, HIGH = 2250;

    private final DcMotorEx motor;
    private int target = GROUND;

    public Lift(HardwareMap hwMap) {
        motor = hwMap.get(DcMotorEx.class, "lift");
        motor.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER);
        motor.setMode(DcMotor.RunMode.RUN_TO_POSITION);
        motor.setTargetPosition(0);
        motor.setPower(1.0);
    }

    public void goTo(int position) { target = position; }
    public boolean atTarget() {
        return Math.abs(motor.getCurrentPosition() - target) < 20;
    }

    // called once per loop — the subsystem's heartbeat
    public void update() {
        motor.setTargetPosition(target);
    }
}` },
      { t: "code", caption: "OpModes become thin and readable", code:
`public class CompTeleOp extends LinearOpMode {
    @Override
    public void runOpMode() {
        Drivetrain drive = new Drivetrain(hardwareMap);
        Lift lift = new Lift(hardwareMap);
        Claw claw = new Claw(hardwareMap);

        waitForStart();
        while (opModeIsActive()) {
            drive.fieldCentric(gamepad1);

            if (gamepad2.y) lift.goTo(Lift.HIGH);
            if (gamepad2.a) lift.goTo(Lift.GROUND);
            if (gamepad2.b) claw.toggle();

            lift.update();
            claw.update();
            telemetry.update();
        }
    }
}` },
      { t: "ul", items: [
        `<strong>Autonomous reuses everything:</strong> the same <code>Lift</code> works in autos (its <code>atTarget()</code> is a ready-made state machine transition — or wrap it as a Road Runner Action).`,
        `<strong>Parallel work:</strong> one student improves the lift while another tunes the drivetrain — different files, no merge pain.`,
        `<strong>Testability:</strong> a tiny <code>LiftTest</code> OpMode exercises one subsystem in isolation.`
      ]},
      { t: "note", style: "info", html: `<p>This pattern scaled up (with a scheduler, commands, and default behaviors) is “command-based” programming — see libraries like <strong>NextFTC</strong> or FTCLib, and it's how FRC code is written. The subsystem discipline is the part worth adopting immediately at any level.</p>` },

      { t: "h2", text: "Version control: non-negotiable" },
      { t: "ul", items: [
        `Put the project on <strong>GitHub</strong> from day one (Android Studio: VCS → Share Project).`,
        `Commit small and often, with messages that say <em>why</em>: <code>"Lift: raise kP after adding counterweight"</code>.`,
        `<strong>Tag competition versions</strong> (<code>git tag states-v1</code>) so “the code that worked at States” is always recoverable.`,
        `Branch for experiments; keep <code>main</code> always driveable. Never debug at a competition on your only copy.`
      ]},
      { t: "quiz",
        q: "Why does the Lift subsystem expose goTo(HIGH) instead of letting OpModes call motor.setTargetPosition directly?",
        opts: [
          "Fewer letters to type",
          "Encapsulation: safety limits, presets, and tuning live in one class — every OpMode gets them automatically, and a lift bug is always in Lift.java",
          "setTargetPosition is deprecated",
          "OpModes can't access motors"
        ],
        a: 1,
        explain: `Same logic as Module 2's Claw, at team scale: one owner per mechanism. When behavior needs to change (new preset, new safety rule), you edit one file and TeleOp + three autos all inherit the fix.` },
      { t: "quiz",
        q: "It's the night before a tournament and a risky refactor broke driving. With good git habits, what's the move?",
        opts: [
          "Rewrite everything from memory by 2 AM",
          "Check out the last known-good commit or competition tag, drive that, and retry the refactor after the event",
          "Delete the repository",
          "Comment out code until it compiles"
        ],
        a: 1,
        explain: `This is the entire point of version control: working versions are never lost. <code>git checkout states-v1</code> beats heroics every time. Teams without VC have lost tournaments to exactly this scenario.` }
    ]
  },

  /* ---------------- 10.2 ---------------- */
  {
    id: "next-steps",
    title: "Where to go next",
    sub: "You've built the foundation — here's the map of everything beyond it.",
    objectives: [
      "A self-assessment of what you've learned",
      "The best resources in the FTC community",
      "Project ideas that will push you further"
    ],
    blocks: [
      { t: "h2", text: "Look how far you've come" },
      { t: "p", html: `If you worked through every module, you now can: write Java (variables → classes) fluently enough to read any FTC codebase; build TeleOps with mecanum field-centric drive, subsystems, and driver assists; write autonomous with encoders, state machines and PID; set up and tune Road Runner or Pedro Pathing; and close control loops around Limelight vision. That is genuinely the skill set of a strong FTC programmer. The rest is practice, iteration, and the community.` },

      { t: "h2", text: "The essential bookmarks" },
      { t: "table",
        head: ["Resource", "What it's for"],
        rows: [
          [`<strong>gm0 — Game Manual 0</strong> (gm0.org)`, `THE community-written FTC bible — software chapters cover everything this course did, plus hardware/strategy`],
          [`<strong>FTC Docs</strong> (ftc-docs.firstinspires.org)`, `Official documentation: SDK, hardware, AprilTags, rules`],
          [`<strong>SDK samples</strong> (FtcRobotController/external/samples)`, `Dozens of official example OpModes for every sensor and feature — read these!`],
          [`<strong>Road Runner docs</strong> (rr.brott.dev)`, `Installation and the full tuning guide`],
          [`<strong>Pedro Pathing</strong> (pedropathing.com)`, `Docs + the visual path designer`],
          [`<strong>Limelight docs</strong> (docs.limelightvision.io)`, `Pipelines, APIs, tuning`],
          [`<strong>FTC Discord</strong>`, `The unofficial community — thousands of programmers, including top teams, answering questions daily`],
          [`<strong>FTC Dashboard</strong> (acmerobotics.github.io/ftc-dashboard)`, `Live graphing, config tuning, field view`]
        ]},

      { t: "h2", text: "Projects that will level you up" },
      { t: "ol", items: [
        `<strong>Telemetry-driven PID tuner:</strong> adjust your lift's kP/kI/kD from the gamepad at runtime and watch the response on FTC Dashboard graphs — turns theory into intuition permanently.`,
        `<strong>Odometry from scratch:</strong> before trusting a library, write 2-dead-wheel + IMU pose tracking yourself and drive squares until the numbers close. Nothing teaches localization better.`,
        `<strong>Vision-corrected auto:</strong> run a Road Runner auto, then use an AprilTag botpose to correct accumulated drift before the final scoring move.`,
        `<strong>A driver-assist suite:</strong> auto-aim (done!), automatic game-piece pickup with the color sensor, one-button scoring sequences — measure cycle times with and without.`,
        `<strong>Teach it:</strong> onboard a rookie using what you know. Explaining loops, states, and PID to someone else is the final boss of understanding.`
      ]},
      { t: "note", style: "tip", html: `<p>Last advice, from every veteran team ever: <strong>consistent beats clever.</strong> An auto that scores 3 every match beats one that scores 5 once. Build simple, test relentlessly, add complexity only when the simple version is bulletproof. Good luck this season! 🤖</p>` },
      { t: "quiz",
        q: "Final exam, one question. Your robot's new auto misses the scoring position by a growing margin as the run progresses. Sketch the diagnosis path a trained FTC programmer follows:",
        opts: [
          "Rewrite the auto",
          "Growing error over a run = accumulating localization drift → check odometry (pod contact, inPerTick, slip during fast segments), verify with Dashboard's field view, and consider an AprilTag pose correction before scoring",
          "Increase all PID gains",
          "Drive slower and hope"
        ],
        a: 1,
        explain: `You reasoned like a systems engineer: the error's <em>shape</em> (growing, not constant) points to integration drift, which lives in localization — not the path follower, not the gains. Congratulations — you've finished the course. Now go build something great.` }
    ]
  }
]});
