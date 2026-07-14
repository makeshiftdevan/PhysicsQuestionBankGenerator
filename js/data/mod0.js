/* Module 0 — Start Here */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Start Here: Robots & Code",
  desc: "What FTC is, what a program actually does on a robot, the hardware you'll control, and the tools you'll write code with. Zero experience required.",
  level: "beginner",
  lessons: [

  /* ---------------- 0.1 ---------------- */
  {
    id: "welcome",
    title: "Welcome! What is FTC, and why Java?",
    sub: "The big picture before we write a single line of code.",
    objectives: [
      "What FIRST Tech Challenge robots do at a competition",
      "What a program is, in plain language",
      "Why FTC uses Java and what \"the SDK\" means"
    ],
    blocks: [
      { t: "h2", text: "What is FIRST Tech Challenge?" },
      { t: "p", html: `<strong>FIRST Tech Challenge (FTC)</strong> is a robotics competition where teams of students design, build, and program a robot about the size of a microwave (18″ × 18″ × 18″ at the start of a match) to play a game on a 12 ft × 12 ft field. Every season has a new game — but every game has the same two phases:` },
      { t: "ul", items: [
        `<strong>Autonomous (30 seconds):</strong> the robot runs <em>entirely on its own</em>, driven only by the code you wrote ahead of time.`,
        `<strong>TeleOp / Driver-Controlled (2 minutes):</strong> human drivers control the robot with gamepads — but your code decides <em>how</em> stick movements and button presses turn into motor movement.`
      ]},
      { t: "p", html: `That means programming is not a side job on an FTC team. The autonomous period is pure code, and even in TeleOp, a well-programmed robot (smooth driving, automatic arm presets, driver assists) beats a poorly-programmed one every time.` },

      { t: "h2", text: "What is a program, really?" },
      { t: "p", html: `A program is just a <strong>list of instructions</strong> that a computer follows, one after another, extremely fast and extremely literally. Your robot's computer (the Control Hub) can't guess what you meant — it does <em>exactly</em> what your code says. If you say “set the left motor to full power” and forget the right motor, your robot spins in circles. This literalness is frustrating at first and then becomes your superpower: the robot will do exactly the same thing every time.` },
      { t: "note", style: "info", html: `<p>A good mental model: writing code is like writing directions for someone who has never been to your town, follows directions perfectly, and never uses common sense. Nothing is “obvious” to a robot.</p>` },

      { t: "h2", text: "Why Java?" },
      { t: "p", html: `FTC robots are controlled by the <strong>REV Control Hub</strong>, which runs Android. Android apps are written in <strong>Java</strong> (or Kotlin), so FTC code is Java. FIRST provides an official <strong>SDK</strong> — <em>Software Development Kit</em> — called the <code>FtcRobotController</code>. It handles all the hard low-level work (talking to motors over wires, reading the gamepads, the phone app UI) and gives you clean Java building blocks like <code>DcMotor</code> and <code>Servo</code> to work with.` },
      { t: "p", html: `So you're never starting from nothing: your job is to write small Java classes called <strong>OpModes</strong> (“operation modes”) that plug into the SDK. An OpMode is one runnable robot program — you might have one OpMode for TeleOp and several for different autonomous routines. Here's a real, complete FTC program. Don't worry about understanding it yet — by Module 3 you'll be writing this yourself:` },
      { t: "code", caption: "A complete FTC TeleOp program (you'll fully understand this soon)", code:
`@TeleOp(name = "My First TeleOp")
public class MyFirstTeleOp extends LinearOpMode {

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
      { t: "p", html: `Fifteen lines, and it's a fully driveable tank-drive robot. That's the power of the SDK doing the heavy lifting for you.` },

      { t: "h2", text: "How this course works" },
      { t: "ul", items: [
        `<strong>Modules 0–2</strong> teach you Java itself, using robot-flavored examples.`,
        `<strong>Modules 3–5</strong> put you on the robot: OpModes, motors, servos, encoders, and sensors.`,
        `<strong>Modules 6–7</strong> cover mecanum drive and real autonomous programming (state machines, PID).`,
        `<strong>Modules 8–9</strong> are the advanced endgame: trajectory-based pathing (Road Runner, Pedro Pathing) and Limelight vision.`,
        `Along the way you'll hit <strong>quizzes</strong>, <strong>fill-in-the-code exercises</strong>, and <strong>interactive labs</strong> — a virtual mecanum robot, a PID tuner, a path builder, and an AprilTag auto-aim sim.`
      ]},
      { t: "quiz",
        q: "During the autonomous period of an FTC match, who controls the robot?",
        opts: [
          "A driver using a gamepad",
          "The code the team wrote before the match — nothing else",
          "A referee with a remote control",
          "The robot is disabled during autonomous"
        ],
        a: 1,
        explain: `Autonomous means the robot acts entirely on its pre-programmed instructions. No human input is allowed — which is exactly why programming matters so much in FTC.` },
      { t: "quiz",
        q: "What does the FTC SDK (FtcRobotController) do for you?",
        opts: [
          "It plays the match automatically so you don't have to code",
          "It handles low-level hardware communication and gives you Java classes like DcMotor to build with",
          "It's a robot simulator",
          "It converts Blocks programs into Java"
        ],
        a: 1,
        explain: `The SDK is the foundation your code plugs into. It manages the Android app, hardware buses, and gamepads, and exposes clean interfaces (<code>DcMotor</code>, <code>Servo</code>, <code>IMU</code>…) so your OpModes stay short and readable.` }
    ]
  },

  /* ---------------- 0.2 ---------------- */
  {
    id: "hardware-tour",
    title: "Meet the hardware you'll control",
    sub: "You can't program what you don't understand. A tour of the electronics on an FTC robot.",
    objectives: [
      "The role of the Control Hub and Driver Station",
      "The difference between motors, servos, and sensors",
      "What the hardware configuration is and why names must match"
    ],
    blocks: [
      { t: "h2", text: "The brain: REV Control Hub" },
      { t: "p", html: `The <strong>Control Hub</strong> is an Android computer + motor controller in one box. Your code runs on it. It has ports for 4 DC motors, 6 servos, and a collection of sensor ports (I2C, digital, analog), plus a built-in <strong>IMU</strong> (an orientation sensor — very important later for field-centric driving and turning accurately). Teams that need more than 4 motors add an <strong>Expansion Hub</strong>, which doubles the ports.` },
      { t: "p", html: `The <strong>Driver Station</strong> is a separate Android device (or the official Driver Hub) that the human drivers hold. It connects to the Control Hub over Wi-Fi, shows your telemetry (debug messages), lets you pick which OpMode to run, and has the gamepads plugged into it.` },
      { t: "table",
        head: ["Device", "What it is", "Your code's relationship to it"],
        rows: [
          [`<strong>Control Hub</strong>`, `The robot's onboard computer & motor/servo/sensor controller`, `Your OpModes run here`],
          [`<strong>Expansion Hub</strong>`, `Extra ports (4 more motors, 6 more servos)`, `Same API — extra hardware just shows up in the config`],
          [`<strong>Driver Station</strong>`, `Driver's phone/Driver Hub with gamepads`, `Sends gamepad state to your code; displays your telemetry`],
          [`<strong>Gamepads</strong>`, `PS4/PS5, Xbox-style, or Etpark controllers`, `Read in code as <code>gamepad1</code> and <code>gamepad2</code>`]
        ]},

      { t: "h2", text: "Actuators: things that move" },
      { t: "h3", text: "DC motors" },
      { t: "p", html: `<strong>DC motors</strong> spin continuously and are your muscle: drivetrain wheels, lifts, intakes, flywheels. In code you set them a <strong>power from -1.0 to +1.0</strong> — full reverse to full forward. Most FTC motors (REV HD Hex, goBILDA Yellow Jacket) include an <strong>encoder</strong>, a sensor that counts how far the shaft has rotated in “ticks.” Encoders are what make precise autonomous movement possible.` },
      { t: "h3", text: "Servos" },
      { t: "p", html: `<strong>Servos</strong> rotate to a <em>specific position</em> (usually within a 270°–300° range) and hold it. You command a <strong>position from 0.0 to 1.0</strong>. Perfect for claws, wrists, and flippers. A variant called a <strong>continuous rotation (CR) servo</strong> spins like a weak motor instead of holding position.` },
      { t: "note", style: "warn", html: `<p>The #1 beginner mix-up: motors take a <strong>power</strong> (how fast to spin), servos take a <strong>position</strong> (where to go). <code>motor.setPower(0.5)</code> spins at half speed forever; <code>servo.setPosition(0.5)</code> moves to the middle of its range and stops there.</p>` },

      { t: "h2", text: "Sensors: things that perceive" },
      { t: "table",
        head: ["Sensor", "What it tells you", "Typical use"],
        rows: [
          [`IMU (built into hub)`, `Robot orientation (yaw / pitch / roll)`, `Accurate turns, field-centric drive`],
          [`Motor encoders`, `How far a motor has rotated`, `Drive distances, lift heights`],
          [`Distance sensor`, `Range to an object (cm)`, `Stop before a wall, detect a game piece`],
          [`Color sensor`, `Color + proximity of what's below/ahead`, `Line detection, sorting game pieces`],
          [`Touch sensor`, `Pressed / not pressed`, `Limit switch at the bottom of a lift`],
          [`Camera / Limelight`, `Full computer vision (AprilTags, objects)`, `Localization, auto-aim — Module 9!`]
        ]},

      { t: "h2", text: "The hardware configuration" },
      { t: "p", html: `Here's the crucial link between wires and code. On the Driver Station you create a <strong>hardware configuration</strong>: a list that says “motor port 0 is called <code>left_drive</code>, I2C port 1 is called <code>imu</code>…”. In code, you ask for devices <em>by that exact name</em>. If the names don't match — capitalization included — your program crashes when it starts, with an error like <code>Unable to find a hardware device with name "left_drve"</code>.` },
      { t: "quiz",
        q: "You want a claw to open to a specific angle and stay there. Which actuator and command?",
        opts: [
          `A DC motor with <code>setPower(0.3)</code>`,
          `A servo with <code>setPosition(0.3)</code>`,
          `A DC motor with <code>setPosition(0.3)</code>`,
          `A touch sensor`
        ],
        a: 1,
        explain: `Servos go to a commanded position and hold it — exactly what a claw needs. A motor with constant power would keep pushing (and burn out); motors don't have a simple <code>setPosition</code> method.` },
      { t: "quiz",
        q: `Your configuration names a motor <code>armMotor</code>, but your code asks for <code>ArmMotor</code>. What happens?`,
        opts: [
          "It works — capitalization doesn't matter",
          "The robot uses a default motor",
          "The OpMode crashes on init with a “unable to find hardware device” error",
          "The code won't compile"
        ],
        a: 2,
        explain: `Hardware names are matched exactly at <em>runtime</em>, so the code compiles fine — and then fails the moment it tries to look up the misspelled name. This is one of the most common FTC errors, so check spelling and capitalization first.` }
    ]
  },

  /* ---------------- 0.3 ---------------- */
  {
    id: "tools",
    title: "Your coding tools: OnBot Java & Android Studio",
    sub: "Where FTC code actually gets written, and how it gets onto the robot.",
    objectives: [
      "The three ways to program an FTC robot",
      "When to choose OnBot Java vs Android Studio",
      "Where your code lives inside the FtcRobotController project"
    ],
    blocks: [
      { t: "h2", text: "Three ways to program an FTC robot" },
      { t: "table",
        head: ["Tool", "What it is", "Best for"],
        rows: [
          [`<strong>Blocks</strong>`, `Drag-and-drop visual programming in the browser`, `Absolute first steps; most teams outgrow it quickly`],
          [`<strong>OnBot Java</strong>`, `A code editor in your browser, served by the Control Hub itself. Compiles on the hub.`, `Learning Java, small codebases, quick edits at competition`],
          [`<strong>Android Studio</strong>`, `Professional IDE on your laptop; you download the FtcRobotController project and build the full app`, `Serious codebases, external libraries (Road Runner, Pedro, Limelight helpers), version control with Git`]
        ]},
      { t: "p", html: `This course teaches <strong>Java</strong>, and every line works in both OnBot Java and Android Studio. For the advanced modules (Road Runner in Module 8) you'll need <strong>Android Studio</strong>, because installing external libraries requires it. If you're just starting, OnBot Java is a wonderful low-friction way in: connect to the Control Hub's Wi-Fi, open <code>http://192.168.43.1:8080</code>, and code.` },

      { t: "h2", text: "The FtcRobotController project" },
      { t: "p", html: `In Android Studio, you download (or clone from GitHub) the official <code>FtcRobotController</code> project. Almost everything in it belongs to FIRST — <strong>your code goes in one specific folder</strong>:` },
      { t: "code", caption: "Where your code lives", code:
`FtcRobotController/
├── FtcRobotController/   // FIRST's app code — don't touch
└── TeamCode/
    └── src/main/java/org/firstinspires/ftc/teamcode/
        ├── MyFirstTeleOp.java      // ← your OpModes go here
        ├── BlueAutonomous.java
        └── ...`},
      { t: "p", html: `Every <code>.java</code> file you create in <code>teamcode</code> that's marked as an OpMode automatically appears in the OpMode list on the Driver Station after you build and install the app to the Control Hub (via USB-C cable or Wi-Fi ADB).` },

      { t: "h2", text: "The edit → build → run loop" },
      { t: "ol", items: [
        `<strong>Edit:</strong> write or change your Java code.`,
        `<strong>Build:</strong> the compiler translates Java into something the hub can run. If you made a syntax mistake, it fails here with an error message — read it! It tells you the file and line number.`,
        `<strong>Deploy:</strong> the app installs onto the Control Hub (instant in OnBot Java, a few seconds in Android Studio).`,
        `<strong>Run:</strong> on the Driver Station, pick your OpMode, press <strong>INIT</strong>, then <strong>▶ START</strong>.`,
        `<strong>Observe & repeat:</strong> watch what the robot does, use telemetry to see what the code <em>thinks</em> is happening, and iterate.`
      ]},
      { t: "note", style: "tip", html: `<p>Compiler errors are your friend. A program with an error <em>never reaches the robot</em>, so the compiler catching your typo is infinitely better than the robot doing something wrong on the field. Beginners who read error messages carefully learn about 3× faster.</p>` },
      { t: "quiz",
        q: "You want to use Road Runner (an external pathing library) on your robot. Which tool do you need?",
        opts: [
          "Blocks",
          "OnBot Java",
          "Android Studio",
          "None — it's built into the SDK"
        ],
        a: 2,
        explain: `External libraries are added through Gradle dependencies, which requires the full Android Studio project. OnBot Java only compiles the files you write against the built-in SDK.` },
      { t: "quiz",
        q: "Your code has a typo like a missing semicolon. When do you find out?",
        opts: [
          "The robot behaves strangely during the match",
          "At build time — the compiler refuses to build and points at the line",
          "The Driver Station shows a warning during the match",
          "Never, Java fixes it automatically"
        ],
        a: 1,
        explain: `Syntax errors are caught by the compiler before the code ever runs. Logic errors (code that compiles but does the wrong thing) are the ones that show up on the field — telemetry and testing catch those.` }
    ]
  }
]});
