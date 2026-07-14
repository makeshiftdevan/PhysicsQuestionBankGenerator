/* Module 8 — Advanced Pathing */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Advanced Pathing",
  desc: "Trajectory-based autonomous with Road Runner and Pedro Pathing: localization, splines, motion profiles, and tuning.",
  level: "advanced",
  lessons: [

  /* ---------------- 8.1 ---------------- */
  {
    id: "why-pathing",
    title: "Localization & trajectories: why pathing libraries exist",
    sub: "The ideas underneath Road Runner and Pedro — poses, odometry, and motion profiles.",
    objectives: [
      "What a pose is and how odometry tracks it",
      "Dead wheels / odometry pods and why they beat drive encoders",
      "Motion profiles: velocity-planned movement"
    ],
    blocks: [
      { t: "h2", text: "The ceiling of driveInches()" },
      { t: "p", html: `Encoder moves are reliable but <strong>blind and segmented</strong>: drive, stop, turn, stop, drive… Each stop wastes time; each segment accumulates error the robot never notices (wheel slip, a bump from a partner). Meanwhile top autos flow through smooth curves while raising a lift and never stop moving. That requires two upgrades: the robot must <em>know where it is</em> continuously (localization), and it must <em>plan motion</em> instead of just applying power (trajectories).` },

      { t: "h2", text: "Pose: position + heading" },
      { t: "p", html: `A robot's <strong>pose</strong> is (x, y, heading) in field coordinates — FTC convention puts (0,0) at field center, measured in inches, with heading in radians. Everything in pathing is poses: where you start, where you want to be, the error between them.` },
      { t: "code", caption: "Poses in Road Runner", code:
`Pose2d startPose = new Pose2d(-36, -62, Math.toRadians(90));
// x = -36 in, y = -62 in (near the audience-side blue wall),
// facing 90° (up the field, +y direction)` },

      { t: "h2", text: "Odometry: dead reckoning done right" },
      { t: "p", html: `<strong>Odometry</strong> integrates many tiny wheel-movement measurements into a live pose estimate, updated every loop. Sources, in increasing accuracy:` },
      { t: "table",
        head: ["Method", "How", "Accuracy"],
        rows: [
          [`Drive encoders + IMU`, `Use the drivetrain's own motor encoders`, `OK — but mecanum wheels slip while strafing, corrupting the estimate`],
          [`<strong>Dead wheels (odometry pods)</strong>`, `2–3 unpowered omni wheels with high-res encoders, spring-loaded to the floor`, `Very good — they never slip because they're not driven`],
          [`<strong>Pinpoint / OTOS</strong>`, `Dedicated localizer hardware (goBILDA Pinpoint computer with 2 pods, or SparkFun optical sensor)`, `Excellent, minimal setup — very popular now`],
          [`+ AprilTags`, `Vision fixes absolute position (Module 9)`, `Corrects accumulated drift entirely`]
        ]},
      { t: "note", style: "info", html: `<p>Why unpowered wheels? A driven wheel spinning under acceleration lies to its encoder (“I turned 500 ticks!” — but the robot skidded). A free-spinning pod only turns when the robot actually moves across the floor. Localization quality is the #1 factor in pathing accuracy — buy or build good odometry before tuning anything.</p>` },

      { t: "h2", text: "Motion profiles: don't just floor it" },
      { t: "p", html: `Commanding full power instantly causes wheel slip, jerk, and overshoot. A <strong>motion profile</strong> plans a velocity curve for a move: accelerate at a controlled rate, cruise at max velocity, decelerate to arrive at exactly zero speed at the target. The classic shape is the <strong>trapezoid</strong> (speed up — cruise — slow down). A <strong>trajectory</strong> is a path (the geometric curve) plus a motion profile along it (where you should be at every instant, and how fast).` },
      { t: "p", html: `Then, while driving, the library runs <strong>feedback control</strong> (PID — Module 7!) comparing the odometry pose against where the trajectory says the robot should be, continuously correcting. That's the whole stack: <em>localization tells you where you are, the trajectory says where you should be, PID closes the gap.</em>` },
      { t: "quiz",
        q: "Why do dead-wheel odometry pods track position better than the drivetrain's own motor encoders?",
        opts: [
          "They have Bluetooth",
          "They're unpowered, so they can't spin against the floor during acceleration or strafing — they only rotate when the robot truly moves",
          "They're bigger wheels",
          "They read the IMU directly"
        ],
        a: 1,
        explain: `Driven mecanum wheels slip constantly (especially strafing — the rollers make it inherently slippery), and slip means encoder ticks with no matching robot motion. Free-rolling pods measure actual travel. Garbage in, garbage out applies hard to localization.` },
      { t: "quiz",
        q: "A trajectory differs from a path because it also specifies…",
        opts: [
          "The color of the line in the dashboard",
          "Timing: a velocity/acceleration profile saying where the robot should be at every moment",
          "The motor directions",
          "The field size"
        ],
        a: 1,
        explain: `Path = geometry (the curve on the field). Trajectory = geometry + schedule. The schedule is what lets a feedback controller know if the robot is ahead/behind/off-course at any instant and correct accordingly.` }
    ]
  },

  /* ---------------- 8.2 ---------------- */
  {
    id: "roadrunner-setup",
    title: "Road Runner: setup & tuning",
    sub: "Installing the quickstart and surviving the tuning gauntlet.",
    objectives: [
      "What Road Runner is and how it's structured",
      "Installing the quickstart project",
      "The tuning sequence and what each step calibrates"
    ],
    blocks: [
      { t: "h2", text: "What Road Runner is" },
      { t: "p", html: `<strong>Road Runner</strong> (v1.0+) is the most widely used FTC motion-planning library. It provides pose/vector math, trajectory generation with motion profiles, feedback controllers for mecanum drives, an <strong>Actions</strong> system for sequencing robot behavior, and integration with <strong>FTC Dashboard</strong> (a browser tool that graphs your robot live and draws it on a field map). You don't install it into a bare project — you start from the official <strong>quickstart</strong>:` },
      { t: "ol", items: [
        `Clone or download <code>acmerobotics/road-runner-quickstart</code> from GitHub (this is why Module 0 said advanced work needs Android Studio).`,
        `Copy in or write your hardware configuration: motor names in <code>MecanumDrive.java</code> must match your robot's config.`,
        `Pick your localizer: drive encoders (default), two/three dead wheels, or Pinpoint/OTOS — the quickstart has classes for each.`,
        `Set physical constants: <code>inPerTick</code> (from measuring), track width, and the localizer's offsets.`,
        `Run the tuning OpModes, in order. Do not skip steps. Do not guess numbers.`
      ]},

      { t: "h2", text: "The tuning gauntlet" },
      { t: "p", html: `Road Runner ships tuning OpModes that measure your robot empirically. Each step feeds the next — a wrong early value poisons everything after, so verify as you go (the docs at <code>rr.brott.dev</code> describe expected plots for every step):` },
      { t: "table",
        head: ["Step", "OpMode", "What it calibrates"],
        rows: [
          ["1", `ForwardPushTest / <code>inPerTick</code>`, `How many inches one encoder tick represents — push the robot by hand, read the ticks`],
          ["2", `ForwardRampLogger → feedforward`, `<code>kS</code> (static friction) and <code>kV</code> (velocity constant): the voltage needed to achieve a speed`],
          ["3", `LateralRampLogger`, `<code>lateralInPerTick</code> — mecanum strafing is less efficient; this measures by how much`],
          ["4", `AngularRampLogger`, `<code>trackWidthTicks</code> — effective turning geometry`],
          ["5", `ManualFeedforwardTuner`, `Verify/adjust kV, kA by matching commanded vs actual velocity plots`],
          ["6", `ManualFeedbackTuner`, `The PID-style gains (<code>axialGain</code>, <code>lateralGain</code>, <code>headingGain</code>) that correct path error`],
          ["7", `SplineTest`, `Victory lap: robot drives a smooth spline accurately`]
        ]},
      { t: "note", style: "warn", html: `<p>Teams sink weekends into pathing bugs that are really tuning bugs. Golden rules: fresh battery for tuning sessions, tune on competition-like tiles, re-verify after robot weight changes, and if SplineTest looks wrong, go <em>backwards</em> through the steps — don't crank feedback gains to mask a bad feedforward.</p>` },

      { t: "h2", text: "FTC Dashboard: your eyes" },
      { t: "p", html: `The quickstart includes FTC Dashboard — connect to the robot's Wi-Fi and open <code>http://192.168.43.1:8080/dash</code>. It graphs target vs actual velocity in real time (the heart of tuning) and draws the robot's live pose on a field overlay. Tuning without it is guessing; with it, each step is “make the orange line match the blue line.”` },
      { t: "quiz",
        q: "Your SplineTest curves are consistently too short by ~10% in every direction. Which tuning value is the prime suspect?",
        opts: [
          "headingGain",
          "inPerTick — the tick-to-distance conversion scales every motion, so a uniform percentage error points straight at it",
          "The spline algorithm",
          "kS"
        ],
        a: 1,
        explain: `A constant proportional error in all distances is the fingerprint of a wrong distance-per-tick constant (wrong wheel diameter, wrong measurement). Feedback gains cause wobble/overshoot, not uniform scaling. Fix step 1, then re-verify later steps.` },
      { t: "quiz",
        q: "Why must feedforward (kV/kS/kA) be tuned before the feedback gains?",
        opts: [
          "Alphabetical order",
          "Feedforward does the bulk of the work (predicting the power needed); feedback only corrects small residual errors. Tuning feedback against a broken feedforward means huge gains fighting systematic error — unstable and unfixable",
          "Feedback gains are optional",
          "The OpModes crash otherwise"
        ],
        a: 1,
        explain: `The architecture is feedforward-first: predict ~95% of the required command from the motion profile, let PID trim the rest. If prediction is wrong, PID must be cranked up to compensate, and high-gain PID on a systematic error oscillates. Order matters.` }
    ]
  },

  /* ---------------- 8.3 ---------------- */
  {
    id: "roadrunner-autos",
    title: "Writing Road Runner autonomous routines",
    sub: "actionBuilder, splines, and running your lift in parallel — plus a path builder you can play with.",
    objectives: [
      "Building trajectories with actionBuilder",
      "The trajectory vocabulary: splineTo, strafeTo, turnTo, waits",
      "Running mechanisms in parallel with SequentialAction/ParallelAction"
    ],
    blocks: [
      { t: "h2", text: "The shape of a Road Runner auto" },
      { t: "code", caption: "A complete RR 1.0 autonomous", code:
`@Autonomous(name = "RR Blue Auto")
public class RRBlueAuto extends LinearOpMode {

    @Override
    public void runOpMode() {
        Pose2d beginPose = new Pose2d(-36, -62, Math.toRadians(90));
        MecanumDrive drive = new MecanumDrive(hardwareMap, beginPose);

        // Build trajectories during INIT (building takes time!)
        Action scorePath = drive.actionBuilder(beginPose)
                .splineTo(new Vector2d(-36, -36), Math.toRadians(90))
                .splineTo(new Vector2d(-30, -10), Math.toRadians(45))
                .build();

        Action parkPath = drive.actionBuilder(
                        new Pose2d(-30, -10, Math.toRadians(45)))
                .setTangent(Math.toRadians(-90))
                .splineTo(new Vector2d(-58, -60), Math.toRadians(180))
                .build();

        waitForStart();

        Actions.runBlocking(scorePath);
        // ... score ...
        Actions.runBlocking(parkPath);
    }
}` },
      { t: "ul", items: [
        `<code>beginPose</code> must match where you <em>physically place</em> the robot — trajectories are planned from it. A robot placed 3 inches off starts 3 inches off.`,
        `Each subsequent trajectory starts from the previous one's end pose.`,
        `Build during init: trajectory generation does real math and can take tens of milliseconds each.`
      ]},

      { t: "h2", text: "The trajectory vocabulary" },
      { t: "table",
        head: ["Builder call", "Motion"],
        rows: [
          [`<code>.splineTo(pos, tangent)</code>`, `Smooth curve to a position, arriving traveling in the tangent direction (heading follows the path)`],
          [`<code>.splineToLinearHeading(pose, tangent)</code>`, `Curved path while independently rotating to the pose's heading — mecanum superpower`],
          [`<code>.strafeTo(pos)</code>`, `Straight line to a position, heading unchanged`],
          [`<code>.turnTo(angle)</code> / <code>.turn(angle)</code>`, `Rotate in place (absolute / relative)`],
          [`<code>.waitSeconds(t)</code>`, `Pause in the sequence`],
          [`<code>.setTangent(angle)</code>`, `Set the departure direction for the next spline (control the curve's shape)`]
        ]},
      { t: "p", html: `Get a feel for waypoints and splines here — click to add points, then read the generated builder code:` },
      { t: "sim", name: "path" },

      { t: "h2", text: "Actions: mechanisms in the flow" },
      { t: "p", html: `Road Runner's <strong>Action</strong> interface is a tiny state machine (sound familiar?): its <code>run()</code> method is called repeatedly and returns <code>true</code> to keep running, <code>false</code> when done. Wrap your mechanisms as Actions and compose them:` },
      { t: "code", caption: "A lift Action + parallel composition", code:
`public class LiftTo implements Action {
    private final int target;
    public LiftTo(int target) { this.target = target; }

    @Override
    public boolean run(TelemetryPacket packet) {
        lift.setTargetPosition(target);
        lift.setMode(DcMotor.RunMode.RUN_TO_POSITION);
        lift.setPower(1.0);
        packet.put("lift pos", lift.getCurrentPosition());
        return Math.abs(lift.getCurrentPosition() - target) > 20;
        // true = still running, false = done
    }
}

// Drive AND raise the lift at the same time, then dump:
Actions.runBlocking(new SequentialAction(
        new ParallelAction(
                scorePath,           // the trajectory is an Action too!
                new LiftTo(LIFT_HIGH)
        ),
        new DumpAction()
));` },
      { t: "note", style: "tip", html: `<p>This is the payoff of the whole course path: Actions are state machines (Module 7), wrapping mechanisms built on encoders and RUN_TO_POSITION (Module 4), composed around trajectories running PID on odometry (Modules 7–8). Advanced FTC code is the basics, stacked.</p>` },
      { t: "quiz",
        q: "Why must the pose passed to actionBuilder match the previous trajectory's end pose (or the robot's true placement)?",
        opts: [
          "The builder throws an exception otherwise",
          "Trajectories are planned in absolute field coordinates from that pose — if it's wrong, every point of the plan is shifted, and feedback will chase a path offset from reality",
          "It makes the code compile faster",
          "Poses are only decorative"
        ],
        a: 1,
        explain: `RR plans in field coordinates. The controller then steers the odometry pose onto the planned curve — so a wrong start pose means the entire plan is displaced. Chain your poses carefully (store the end pose in a variable rather than retyping numbers).` },
      { t: "quiz",
        q: "In a ParallelAction containing a trajectory and LiftTo, when does the composite action finish?",
        opts: [
          "When the trajectory finishes",
          "When the lift finishes",
          "When BOTH have returned false (all children complete)",
          "After a fixed timeout"
        ],
        a: 2,
        explain: `ParallelAction runs all children each loop and completes when every child reports done — exactly the “transition when all conditions met” pattern from the state machine lesson. SequentialAction, by contrast, runs children one at a time in order.` }
    ]
  },

  /* ---------------- 8.4 ---------------- */
  {
    id: "pedro-purepursuit",
    title: "Pedro Pathing & pure pursuit",
    sub: "The other modern option, and the classic algorithm worth understanding.",
    objectives: [
      "What Pedro Pathing offers and how it compares to Road Runner",
      "How the pure pursuit algorithm works",
      "Choosing a pathing approach for your team"
    ],
    blocks: [
      { t: "h2", text: "Pedro Pathing" },
      { t: "p", html: `<strong>Pedro Pathing</strong> is a newer FTC path-following library that has become seriously popular. Instead of Road Runner's time-parameterized trajectories, Pedro is a <strong>reactive follower</strong>: it computes correction vectors toward the path plus centripetal force correction for curves, which makes it robust to bumps and very fast between waypoints. Its structure looks similar at the surface — Bezier-curve paths built in a chain:` },
      { t: "code", caption: "Pedro Pathing flavor", code:
`Follower follower = new Follower(hardwareMap);
follower.setStartingPose(new Pose(9, 60, Math.toRadians(0)));

PathChain scorePath = follower.pathBuilder()
        .addPath(new BezierCurve(
                new Point(9, 60, Point.CARTESIAN),
                new Point(30, 55, Point.CARTESIAN),   // control point
                new Point(38, 72, Point.CARTESIAN)))  // end
        .setLinearHeadingInterpolation(Math.toRadians(0),
                                       Math.toRadians(45))
        .build();

follower.followPath(scorePath);
while (opModeIsActive() && follower.isBusy()) {
    follower.update();   // call every loop — it's non-blocking!
}` },
      { t: "p", html: `Note the loop: <code>follower.update()</code> every iteration, non-blocking by design — it slots directly into a state machine auto, and you run your lift logic in the same loop. Pedro also has a web-based <strong>visualizer</strong> for designing paths by dragging control points (much like this module's path lab).` },
      { t: "table",
        head: ["", "Road Runner 1.0", "Pedro Pathing"],
        rows: [
          ["Following style", "Time-based trajectory + feedback", "Reactive vector follower"],
          ["Sequencing", "Actions (Sequential/Parallel)", "PathChains + your own state machine"],
          ["Strengths", "Mature, huge community, precise timing, Dashboard ecosystem", "Fast, recovers well from disturbance, easy visual path design"],
          ["Tuning", "Feedforward + feedback gauntlet", "Fewer, follower-centric constants (still requires care)"],
          ["Pick it if…", "You want the most documented, battle-tested route", "You want speed/robustness and like the visualizer workflow"]
        ]},

      { t: "h2", text: "Pure pursuit: the algorithm behind the curtain" },
      { t: "p", html: `Before these libraries, teams wrote <strong>pure pursuit</strong> by hand, and understanding it demystifies all path following. The idea fits in one sentence: <em>continuously chase a point on the path a fixed distance ahead of you.</em>` },
      { t: "ol", items: [
        `Draw a circle of radius <strong>L</strong> (the <em>lookahead distance</em>) around the robot's current position.`,
        `Find where that circle intersects the path — take the intersection <em>furthest along</em> the path.`,
        `Drive toward that point (for mecanum: compute the drive vector to it; for tank: steer an arc through it).`,
        `Repeat every loop. As the robot moves, the lookahead point slides along the path ahead of it.`
      ]},
      { t: "p", html: `The robot behaves like it's chasing a carrot on a stick — it never targets its current closest path point (which causes oscillation), always a point ahead, which naturally smooths corners. The lookahead distance is the one big tuning knob: <strong>small L</strong> hugs the path tightly but can oscillate; <strong>large L</strong> is smooth and stable but cuts corners.` },
      { t: "note", style: "info", html: `<p>Sound familiar? It should — it's proportional control in disguise (steer toward the target, harder the more you're off), with the lookahead acting like a damper. Every “advanced” motion algorithm keeps reusing the same handful of control ideas.</p>` },
      { t: "quiz",
        q: "In pure pursuit, what happens if the lookahead distance is too small?",
        opts: [
          "The robot cuts corners badly",
          "The robot tracks the path very tightly but tends to oscillate/wiggle around it, especially at speed",
          "The robot drives backwards",
          "Nothing changes"
        ],
        a: 1,
        explain: `A close carrot means aggressive corrections — the signature small-L behavior is weaving around the path like an overcaffeinated puppy. Large L smooths that out at the cost of rounding corners. Tune to your robot's speed.` },
      { t: "quiz",
        q: "Your autonomous gets bumped by a partner robot mid-path. Which design recovers most gracefully?",
        opts: [
          "Time-based moves — they always take the same time",
          "Blind encoder moves — they finish their tick counts",
          "A reactive follower (Pedro / pure pursuit) or trajectory feedback with good localization: the controller sees the pose error and steers back to the path",
          "None — a bump always ends the auto"
        ],
        a: 2,
        explain: `This is the core argument for localization-based pathing. Time and blind-encoder autos have no idea they were bumped (the encoders kept counting!). A follower comparing its live pose against the path treats the bump as just another error to correct.` }
    ]
  }
]});
