/* Module 3 — Your First OpMode */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Your First OpMode",
  desc: "Put it all together on real hardware: the OpMode lifecycle, hardwareMap, telemetry, and a driveable TeleOp.",
  level: "beginner",
  lessons: [

  /* ---------------- 3.1 ---------------- */
  {
    id: "opmode-anatomy",
    title: "Anatomy of a LinearOpMode",
    sub: "INIT, START, STOP — the lifecycle every FTC program lives through.",
    objectives: [
      "The phases of an OpMode: init, waiting, running, stopped",
      "What belongs before vs after waitForStart()",
      "LinearOpMode vs iterative OpMode"
    ],
    blocks: [
      { t: "h2", text: "The lifecycle" },
      { t: "p", html: `On the Driver Station, running a program is a two-button process: <strong>INIT</strong>, then <strong>▶ START</strong>. Your <code>runOpMode()</code> method maps onto that timeline:` },
      { t: "code", caption: "The complete skeleton, annotated", code:
`@TeleOp(name = "Skeleton")
public class Skeleton extends LinearOpMode {

    @Override
    public void runOpMode() {
        // ===== 1. INIT PHASE =====
        // Runs when the driver presses INIT.
        // Get hardware, set directions, reset encoders here.
        DcMotor leftDrive  = hardwareMap.get(DcMotor.class, "left_drive");
        DcMotor rightDrive = hardwareMap.get(DcMotor.class, "right_drive");
        rightDrive.setDirection(DcMotor.Direction.REVERSE);

        telemetry.addData("Status", "Initialized — ready!");
        telemetry.update();

        // ===== 2. WAIT =====
        waitForStart();   // blocks here until the driver presses ▶

        // ===== 3. RUN PHASE =====
        while (opModeIsActive()) {
            // repeats until STOP or the timer ends
            leftDrive.setPower(-gamepad1.left_stick_y);
            rightDrive.setPower(-gamepad1.right_stick_y);
        }

        // ===== 4. AFTER STOP ===== (optional cleanup)
    }
}` },
      { t: "note", style: "rule", html: `<p><strong>Rule of the match:</strong> the robot must not move during INIT — moving before START is a penalty. So: hardware setup and sensor reads <em>before</em> <code>waitForStart()</code>; anything that moves motors or servos <em>after</em> it.</p>` },

      { t: "h2", text: "LinearOpMode vs OpMode" },
      { t: "p", html: `The SDK offers two styles. <strong>LinearOpMode</strong> (this course's choice) reads top-to-bottom like a story — great for both learning and autonomous. The iterative <strong>OpMode</strong> instead has you fill in methods the SDK calls repeatedly (<code>init()</code>, <code>loop()</code>); some advanced teams prefer it for TeleOp. Everything you learn here transfers.` },
      { t: "table",
        head: ["", "LinearOpMode", "Iterative OpMode"],
        rows: [
          ["You write", `<code>runOpMode()</code>, one flowing method`, `<code>init()</code> + <code>loop()</code> methods`],
          ["The loop", `You write <code>while (opModeIsActive())</code> yourself`, `SDK calls <code>loop()</code> ~50×/s for you`],
          ["Waiting/sequencing", `Natural — statements run in order`, `Needs state variables`],
          ["Best for", `Learning, autonomous`, `Some teams' TeleOp preference`]
        ]},
      { t: "quiz",
        q: "The drivers press INIT and your OpMode immediately crashes with a hardware error. Which line most likely caused it?",
        opts: [
          `<code>waitForStart();</code>`,
          `<code>hardwareMap.get(DcMotor.class, "left_drive");</code> with a name not in the configuration`,
          `<code>telemetry.update();</code>`,
          `<code>while (opModeIsActive())</code>`
        ],
        a: 1,
        explain: `Hardware lookups run during INIT, so a name mismatch crashes right then — before START. That's actually convenient: you find out on the practice table, not mid-match.` },
      { t: "quiz",
        q: "Where must servo/motor movement commands go, and why?",
        opts: [
          "Before waitForStart(), so the robot is ready sooner",
          "After waitForStart() — moving during INIT is against the rules",
          "Anywhere, it makes no difference",
          "In the class constructor"
        ],
        a: 1,
        explain: `Robot movement before START is a rules violation (and dangerous around field staff). Init is for setup; movement begins after <code>waitForStart()</code> returns.` }
    ]
  },

  /* ---------------- 3.2 ---------------- */
  {
    id: "hardwaremap",
    title: "hardwareMap: connecting code to hardware",
    sub: "The bridge between the names in your configuration file and the objects in your code.",
    objectives: [
      "Using hardwareMap.get with different device classes",
      "Setting directions and zero-power behavior at init",
      "Diagnosing the dreaded “unable to find hardware device”"
    ],
    blocks: [
      { t: "h2", text: "How the lookup works" },
      { t: "p", html: `Remember the hardware configuration from Module 0 — the list on the Driver Station mapping ports to names. <code>hardwareMap</code> is that list, handed to your code. You ask it for a device by <strong>class</strong> (what kind of thing) and <strong>name</strong> (which one):` },
      { t: "code", caption: "One pattern for every device type", code:
`DcMotor lift    = hardwareMap.get(DcMotor.class, "lift");
Servo claw      = hardwareMap.get(Servo.class, "claw");
IMU imu         = hardwareMap.get(IMU.class, "imu");
DistanceSensor rangeSensor =
        hardwareMap.get(DistanceSensor.class, "front_range");
ColorSensor colorSensor =
        hardwareMap.get(ColorSensor.class, "color");` },
      { t: "p", html: `The string must match the configuration name <em>exactly</em>. The convention most teams use: lowercase with underscores (<code>"left_drive"</code>) or camelCase (<code>"leftDrive"</code>) — pick one style and stick to it.` },

      { t: "h2", text: "Init-time setup: direction & brake" },
      { t: "p", html: `Motors mounted on opposite sides of a drivetrain face opposite directions — positive power spins them opposite ways. Fix it once at init by reversing one side, so “positive = robot forward” everywhere in your code:` },
      { t: "code", caption: "Standard drivetrain init", code:
`leftDrive.setDirection(DcMotor.Direction.FORWARD);
rightDrive.setDirection(DcMotor.Direction.REVERSE);

// BRAKE: motor actively resists motion at power 0 (default on many kits)
// FLOAT: motor coasts freely at power 0
leftDrive.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
rightDrive.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);` },
      { t: "note", style: "tip", html: `<p>Use <code>BRAKE</code> on drivetrains (stops precisely, resists being pushed) and on lifts (fights gravity a bit). <code>FLOAT</code> suits flywheels and mechanisms you want to spin down naturally.</p>` },

      { t: "h2", text: "When the lookup fails" },
      { t: "p", html: `If the name isn't found you'll see something like:` },
      { t: "code", caption: "The error every rookie meets", code:
`// java.lang.IllegalArgumentException:
//   Unable to find a hardware device with name "left_drve"` },
      { t: "ul", items: [
        `<strong>Check spelling & capitalization</strong> — in code AND in the config.`,
        `<strong>Check the active configuration</strong> — is the right config selected on the Driver Station?`,
        `<strong>Check the device type</strong> — asking for a <code>Servo</code> on a motor port fails differently but fails.`,
        `<strong>Robot restarted after config change?</strong> — “Restart Robot” applies a new config.`
      ]},
      { t: "quiz",
        q: "Why do we reverse one side of the drivetrain at init?",
        opts: [
          "To make the robot turn faster",
          "Motors on opposite sides are mirrored, so the same positive power would spin the wheels in opposite directions — reversing one side makes +power mean “forward” for both",
          "The SDK requires it",
          "To save battery"
        ],
        a: 1,
        explain: `It's pure geometry: mirrored mounting means mirrored rotation. Reversing one side once at init means every later line of code can think in robot terms (“forward”) instead of motor terms.` },
      { t: "fill",
        intro: `Initialize a claw servo and an intake motor, and make the intake brake when stopped.`,
        code:
`Servo claw = hardwareMap.@@1@@(Servo.class, @@2@@);
DcMotor intake = hardwareMap.get(DcMotor.class, "intake");
intake.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.@@3@@);`,
        blanks: [
          { answer: "get", hint: "method", size: 70 },
          { answer: ["\"claw\"", "\"claw_servo\""], hint: "\"name\"", size: 110 },
          { answer: "BRAKE", hint: "enum", size: 90 }
        ]}
    ]
  },

  /* ---------------- 3.3 ---------------- */
  {
    id: "telemetry",
    title: "Telemetry: seeing what your robot thinks",
    sub: "Your window into the running program — the #1 debugging tool in FTC.",
    objectives: [
      "addData and update — and why nothing shows without update()",
      "What to display during init vs during the loop",
      "Using telemetry to debug instead of guessing"
    ],
    blocks: [
      { t: "h2", text: "The two-step API" },
      { t: "p", html: `<strong>Telemetry</strong> prints live values from your code onto the Driver Station screen. It's a two-step process: queue up lines with <code>addData</code>, then push them all to the screen with <code>update()</code>:` },
      { t: "code", caption: "Telemetry basics", code:
`while (opModeIsActive()) {
    double drive = -gamepad1.left_stick_y;

    telemetry.addData("Status", "Running");
    telemetry.addData("Drive power", "%.2f", drive);       // formatted
    telemetry.addData("Lift ticks", lift.getCurrentPosition());
    telemetry.addData("Heading (deg)",
            imu.getRobotYawPitchRollAngles().getYaw(AngleUnit.DEGREES));
    telemetry.update();   // ← nothing appears without this!
}` },
      { t: "note", style: "warn", html: `<p>Forgetting <code>telemetry.update()</code> is the most common telemetry bug — data is queued but never displayed. Second most common: calling <code>update()</code> more than once per loop, which flickers and erases lines. One <code>update()</code>, at the end of the loop.</p>` },

      { t: "h2", text: "Debug with data, not guesses" },
      { t: "p", html: `When the robot misbehaves, the difference between a 5-minute fix and an hour of frustration is telemetry. The robot turns left when it should go straight? Don't stare at the code — <em>print the powers</em>:` },
      { t: "code", caption: "Diagnosing a drivetrain pull", code:
`telemetry.addData("left cmd",  leftPower);
telemetry.addData("right cmd", rightPower);
telemetry.addData("left enc",  leftDrive.getCurrentPosition());
telemetry.addData("right enc", rightDrive.getCurrentPosition());
telemetry.update();
// If commands match but encoder counts don't → mechanical issue.
// If commands differ → your math/gamepad logic is wrong. Case closed.` },
      { t: "p", html: `During autonomous development, telemetry is even more valuable — print your state machine's current state, sensor values, and targets. During <em>init</em>, use it to confirm the robot is ready ("Gyro calibrated", "Camera streaming").` },
      { t: "quiz",
        q: "Your telemetry.addData lines are in the loop, but the Driver Station shows nothing. Most likely cause?",
        opts: [
          "The Driver Station is out of range",
          "You never call telemetry.update()",
          "addData is spelled wrong",
          "Telemetry only works in autonomous"
        ],
        a: 1,
        explain: `<code>addData</code> only queues lines in a buffer; <code>update()</code> transmits and displays them. No update, no display. (A misspelling would be a compile error — you'd know.)` },
      { t: "quiz",
        q: "The robot drives straight but your code “should” make it turn. What's the fastest next step?",
        opts: [
          "Rewrite the drive code from scratch",
          "Swap the motor wires",
          "Add telemetry showing the computed motor powers and the gamepad values, and watch them live",
          "Restart the Driver Station"
        ],
        a: 2,
        explain: `Measure before you modify. Watching the actual numbers instantly tells you whether the bug is in input reading, your math, or the hardware — three totally different fixes.` }
    ]
  },

  /* ---------------- 3.4 ---------------- */
  {
    id: "first-teleop",
    title: "Driving: tank & arcade TeleOp",
    sub: "Your first complete, driveable program — two classic control schemes.",
    objectives: [
      "Tank drive: one stick per side",
      "Arcade drive: drive + turn on one stick pair",
      "A full TeleOp with drive, lift, and claw"
    ],
    blocks: [
      { t: "h2", text: "Tank drive" },
      { t: "p", html: `<strong>Tank drive</strong>: left stick controls the left wheels, right stick the right wheels. Push both up to go straight, opposite to spin. Dead simple to code, and some drivers love it:` },
      { t: "code", caption: "Complete tank drive TeleOp", code:
`@TeleOp(name = "Tank Drive")
public class TankDrive extends LinearOpMode {

    @Override
    public void runOpMode() {
        DcMotor leftDrive  = hardwareMap.get(DcMotor.class, "left_drive");
        DcMotor rightDrive = hardwareMap.get(DcMotor.class, "right_drive");
        rightDrive.setDirection(DcMotor.Direction.REVERSE);

        waitForStart();

        while (opModeIsActive()) {
            leftDrive.setPower(-gamepad1.left_stick_y);
            rightDrive.setPower(-gamepad1.right_stick_y);
        }
    }
}` },

      { t: "h2", text: "Arcade drive" },
      { t: "p", html: `<strong>Arcade drive</strong>: one stick's Y drives, another axis turns. The math mixes the two into left/right powers — and this mixing idea scales straight up to mecanum in Module 6:` },
      { t: "code", caption: "Arcade mixing", code:
`double drive = -gamepad1.left_stick_y;   // forward/back
double turn  =  gamepad1.right_stick_x;  // rotate

double leftPower  = Range.clip(drive + turn, -1.0, 1.0);
double rightPower = Range.clip(drive - turn, -1.0, 1.0);

leftDrive.setPower(leftPower);
rightDrive.setPower(rightPower);` },
      { t: "p", html: `Sanity-check the math: full forward (<code>drive=1, turn=0</code>) → both sides 1.0, straight ahead. Pure right turn (<code>drive=0, turn=1</code>) → left +1, right −1, spin in place. Forward + slight right → left faster than right → a smooth arc. One formula, all behaviors.` },

      { t: "h2", text: "A competition-shaped TeleOp" },
      { t: "p", html: `Real robots do more than drive. Here's the standard structure — every mechanism handled once per loop:` },
      { t: "code", caption: "Drive + lift + claw", code:
`while (opModeIsActive()) {
    // ---- DRIVE ----
    double drive = -gamepad1.left_stick_y;
    double turn  =  gamepad1.right_stick_x;
    leftDrive.setPower(Range.clip(drive + turn, -1, 1));
    rightDrive.setPower(Range.clip(drive - turn, -1, 1));

    // ---- LIFT (gamepad2 = operator) ----
    double liftPower = -gamepad2.left_stick_y;
    lift.setPower(liftPower * 0.8);

    // ---- CLAW ----
    if (gamepad2.a)      claw.setPosition(CLAW_OPEN);
    else if (gamepad2.b) claw.setPosition(CLAW_CLOSED);

    // ---- TELEMETRY ----
    telemetry.addData("Lift", lift.getCurrentPosition());
    telemetry.update();
}` },
      { t: "note", style: "info", html: `<p>Notice <code>gamepad2</code>: FTC allows two drivers. Standard split — driver 1 drives, driver 2 (“operator”) runs mechanisms. Splitting the workload is a genuine competitive advantage.</p>` },
      { t: "quiz",
        q: `In arcade drive, the driver holds drive = 0.6 and turn = 0.6. What are the wheel powers?`,
        opts: [
          "left 0.6, right 0.6",
          "left 1.2, right 0.0",
          "left 1.0 (clipped from 1.2), right 0.0",
          "left 0.0, right 1.0"
        ],
        a: 2,
        explain: `left = drive + turn = 1.2 → clipped to 1.0; right = drive − turn = 0.0. The robot arcs forward-right. This is also a preview of why proper scaling (dividing by the max) matters — coming in the mecanum module.` },
      { t: "fill",
        intro: `Complete the arcade drive mixing (remember which side gets + and which gets −, and clip!).`,
        code:
`double drive = -gamepad1.left_stick_y;
double turn  =  gamepad1.right_stick_x;

double leftPower  = Range.clip(drive @@1@@ turn, -1.0, 1.0);
double rightPower = Range.@@2@@(drive @@3@@ turn, -1.0, 1.0);`,
        blanks: [
          { answer: "+", hint: "op", size: 45 },
          { answer: "clip", hint: "method", size: 70 },
          { answer: "-", hint: "op", size: 45 }
        ]},
      { t: "quiz",
        q: "Why route the lift to gamepad2 instead of putting everything on gamepad1?",
        opts: [
          "gamepad1 doesn't have enough buttons",
          "Two drivers can split attention — one drives, one operates mechanisms — which is faster and safer in a match",
          "gamepad2 has lower latency",
          "The rules require using both gamepads"
        ],
        a: 1,
        explain: `It's a human-factors decision: driving well is a full-time job. FTC gives you two gamepads precisely so teams can divide the cognitive load.` }
    ]
  }
]});
