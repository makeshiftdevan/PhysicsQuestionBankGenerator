/* Module 2 — Methods, Classes & Objects */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Methods, Classes & Objects",
  desc: "Organize code into reusable pieces — the concepts behind every line of SDK code you'll ever call.",
  level: "beginner",
  lessons: [

  /* ---------------- 2.1 ---------------- */
  {
    id: "methods",
    title: "Methods: reusable chunks of code",
    sub: "Stop copy-pasting drive code — write it once, call it anywhere.",
    objectives: [
      "Defining and calling methods",
      "Parameters (inputs) and return values (outputs)",
      "Refactoring repeated autonomous code into helpers"
    ],
    blocks: [
      { t: "h2", text: "The problem methods solve" },
      { t: "p", html: `Imagine an autonomous routine: drive forward, turn, drive forward, turn… Without methods, you'd copy-paste the same 6 lines of motor code over and over. When you find a bug, you'd have to fix every copy. A <strong>method</strong> is a named block of code you write once and <em>call</em> as many times as you like:` },
      { t: "code", caption: "Defining and calling a method", code:
`// DEFINITION — the recipe (goes inside your class, outside runOpMode)
public void driveForward(double power, int milliseconds) {
    leftDrive.setPower(power);
    rightDrive.setPower(power);
    sleep(milliseconds);
    leftDrive.setPower(0);
    rightDrive.setPower(0);
}

// CALLS — using the recipe (inside runOpMode)
driveForward(0.5, 1000);   // half power for 1 second
driveForward(0.8, 250);    // fast nudge
driveForward(-0.5, 500);   // backward!` },
      { t: "p", html: `Reading the definition: <code>public</code> (anyone can call it), <code>void</code> (it returns nothing), <code>driveForward</code> (its name), then the <strong>parameters</strong> in parentheses — typed inputs the caller must supply. Inside the method, <code>power</code> and <code>milliseconds</code> act like variables filled with whatever the caller passed.` },

      { t: "h2", text: "Return values: methods that answer questions" },
      { t: "p", html: `Replace <code>void</code> with a type, and the method hands a value back with the <code>return</code> keyword. You've already been <em>calling</em> methods like this — <code>motor.getCurrentPosition()</code> returns an <code>int</code>:` },
      { t: "code", caption: "A method that computes and returns", code:
`public double ticksToInches(int ticks) {
    double ticksPerRev = 537.7;              // goBILDA 312 RPM motor
    double wheelCircumference = 4.09 * Math.PI;
    return ticks / ticksPerRev * wheelCircumference;
}

// use it:
double distance = ticksToInches(leftDrive.getCurrentPosition());
telemetry.addData("Distance (in)", distance);` },
      { t: "note", style: "tip", html: `<p>Name methods as verbs that say what they do: <code>openClaw()</code>, <code>driveForward(...)</code>, <code>isLiftDown()</code> (boolean-returning methods read best as questions). If you can't name a method cleanly, it's probably doing too many things — split it.</p>` },

      { t: "h2", text: "Before and after" },
      { t: "p", html: `Here's what methods do to a real autonomous routine:` },
      { t: "code", caption: "The whole auto becomes readable", code:
`// Without methods: 40 lines of motor powers and sleeps...

// With methods: the strategy reads like English.
driveForward(0.5, 1200);
turnRight(0.4, 400);
driveForward(0.5, 800);
openClaw();
driveBackward(0.5, 800);` },
      { t: "quiz",
        q: `A method is declared <code>public boolean isPressed()</code>. What must appear inside its body?`,
        opts: [
          "Nothing special",
          `A <code>return</code> statement that produces a <code>boolean</code>`,
          `A call to <code>sleep()</code>`,
          `The keyword <code>void</code>`
        ],
        a: 1,
        explain: `Any method with a non-<code>void</code> return type must return a value of exactly that type on every path through the method — here, <code>true</code> or <code>false</code>. The compiler enforces it.` },
      { t: "quiz",
        q: `What's the main benefit of turning repeated code into a method?`,
        opts: [
          "The robot runs faster",
          "One place to write it, one place to fix it, and calls that read like plain English",
          "It uses less battery",
          "Methods are required by the FTC rules"
        ],
        a: 1,
        explain: `Methods don't speed up execution — they speed up <em>you</em>. Less duplication means fewer bugs, easier tuning, and autonomous routines you can actually read at a glance.` },
      { t: "fill",
        intro: `Write a method that turns the robot in place: left wheel forward, right wheel backward. Fill in the return type, parameter type, and the negation.`,
        code:
`public @@1@@ turnRight(@@2@@ power, int ms) {
    leftDrive.setPower(power);
    rightDrive.setPower(@@3@@power);
    sleep(ms);
    leftDrive.setPower(0);
    rightDrive.setPower(0);
}`,
        blanks: [
          { answer: "void", hint: "returns?", size: 80 },
          { answer: "double", hint: "type", size: 90 },
          { answer: "-", hint: "1 char", size: 45 }
        ]}
    ]
  },

  /* ---------------- 2.2 ---------------- */
  {
    id: "classes-objects",
    title: "Classes & objects",
    sub: "Why your code says DcMotor leftDrive — and how to build your own Robot class.",
    objectives: [
      "Classes as blueprints, objects as the things built from them",
      "Fields, constructors, and the new keyword",
      "The FTC classic: one hardware class used by every OpMode"
    ],
    blocks: [
      { t: "h2", text: "Blueprints and instances" },
      { t: "p", html: `A <strong>class</strong> is a blueprint that bundles data (<strong>fields</strong>) with behavior (<strong>methods</strong>). An <strong>object</strong> is one concrete thing built from that blueprint. You've been using objects all along: <code>DcMotor</code> is a class; <code>leftDrive</code> and <code>rightDrive</code> are two separate objects of it — each with its own power, direction, and encoder count. The dot in <code>leftDrive.setPower(1.0)</code> means “call this method <em>on this object</em>.”` },
      { t: "code", caption: "Defining your own class", code:
`public class Claw {
    // FIELDS — data every Claw object carries
    private Servo servo;
    private boolean isOpen = false;

    // CONSTRUCTOR — runs once when the object is created with 'new'
    public Claw(Servo servo) {
        this.servo = servo;
    }

    // METHODS — behavior
    public void open()  { servo.setPosition(0.85); isOpen = true;  }
    public void close() { servo.setPosition(0.42); isOpen = false; }
    public boolean isOpen() { return isOpen; }
}` },
      { t: "code", caption: "Creating and using an object", code:
`Claw claw = new Claw(hardwareMap.get(Servo.class, "claw_servo"));

claw.open();
if (claw.isOpen()) {
    telemetry.addData("Claw", "open");
}` },
      { t: "p", html: `<code>new Claw(...)</code> builds the object and runs the constructor. <code>private</code> on the fields means only the class's own methods can touch them — outsiders must go through <code>open()</code>/<code>close()</code>. That's <strong>encapsulation</strong>: the rest of your code can't set the servo to a weird position, because the only ways in are the two safe methods.` },

      { t: "h2", text: "The FTC classic: a hardware class" },
      { t: "p", html: `Every OpMode needs the same hardware lookups. Instead of copy-pasting them into TeleOp <em>and</em> three autos, teams put them in one class:` },
      { t: "code", caption: "RobotHardware.java — write once, use everywhere", code:
`public class RobotHardware {
    public DcMotor leftDrive, rightDrive, lift;
    public Servo claw;
    public IMU imu;

    public void init(HardwareMap hwMap) {
        leftDrive  = hwMap.get(DcMotor.class, "left_drive");
        rightDrive = hwMap.get(DcMotor.class, "right_drive");
        lift       = hwMap.get(DcMotor.class, "lift");
        claw       = hwMap.get(Servo.class, "claw");
        imu        = hwMap.get(IMU.class, "imu");

        rightDrive.setDirection(DcMotor.Direction.REVERSE);
        lift.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER);
        lift.setMode(DcMotor.RunMode.RUN_USING_ENCODER);
    }
}` },
      { t: "code", caption: "Any OpMode, three lines to a full robot", code:
`RobotHardware robot = new RobotHardware();

@Override
public void runOpMode() {
    robot.init(hardwareMap);
    waitForStart();
    // robot.leftDrive.setPower(...), robot.claw.setPosition(...) ...
}` },
      { t: "note", style: "tip", html: `<p>When you change a motor's configuration name or direction, you now fix it in <strong>one file</strong> and every OpMode is instantly correct. This single idea prevents more competition-day bugs than any other.</p>` },
      { t: "quiz",
        q: `<code>DcMotor leftDrive</code> and <code>DcMotor rightDrive</code> — what's the relationship?`,
        opts: [
          "They're the same object with two names",
          "Two separate objects of the same class, each with independent state",
          "Two different classes",
          "leftDrive is a copy of rightDrive"
        ],
        a: 1,
        explain: `One class (blueprint), many objects (instances). Setting <code>leftDrive</code>'s power doesn't touch <code>rightDrive</code> — each object tracks its own power, direction, and encoder position.` },
      { t: "quiz",
        q: `Why make the <code>servo</code> field in <code>Claw</code> private?`,
        opts: [
          "private fields use less memory",
          "So other code can only use the claw through its safe methods — nobody can command an invalid position from outside",
          "Java requires all fields to be private",
          "So the servo can't move"
        ],
        a: 1,
        explain: `Encapsulation limits how state can change. If the claw ever misbehaves, you only have to check the handful of methods inside <code>Claw</code> — not every file in the project.` },
      { t: "fill",
        intro: `Create a RobotHardware object and initialize it. Fill in the keyword that creates objects and the field access.`,
        code:
`RobotHardware robot = @@1@@ RobotHardware();
robot.@@2@@(hardwareMap);
robot.@@3@@.setPower(0.5);   // drive the left motor`,
        blanks: [
          { answer: "new", hint: "keyword", size: 70 },
          { answer: "init", hint: "method", size: 80 },
          { answer: "leftDrive", hint: "field", size: 110 }
        ]}
    ]
  },

  /* ---------------- 2.3 ---------------- */
  {
    id: "inheritance",
    title: "Inheritance, @Override & enums",
    sub: "Decoding the boilerplate: what “extends LinearOpMode” actually means.",
    objectives: [
      "Inheritance: extending a class to build on it",
      "What @Override and @TeleOp/@Autonomous annotations do",
      "Enums — and why the SDK uses them everywhere"
    ],
    blocks: [
      { t: "h2", text: "extends: building on an existing class" },
      { t: "p", html: `<strong>Inheritance</strong> lets a class start from everything another class already has. When you write <code>class MyTeleOp extends LinearOpMode</code>, your class inherits a huge toolkit FIRST wrote for you: <code>hardwareMap</code>, <code>telemetry</code>, <code>gamepad1</code>, <code>waitForStart()</code>, <code>sleep()</code>, <code>opModeIsActive()</code> — that's why you can use them without defining them.` },
      { t: "p", html: `The deal works both ways: <code>LinearOpMode</code> declares one <strong>abstract</strong> method, <code>runOpMode()</code>, which it deliberately leaves empty for <em>you</em> to fill in. The SDK handles Wi-Fi, buttons, and hardware, and at the right moment calls <em>your</em> <code>runOpMode()</code>. You write the interesting 5%; inheritance wires it into the other 95%.` },
      { t: "code", caption: "The boilerplate, decoded line by line", code:
`@TeleOp(name = "Drive Program")           // annotation: list me on the
                                          // Driver Station, TeleOp tab
public class DriveProgram
        extends LinearOpMode {            // inherit the OpMode toolkit

    @Override                             // "I'm replacing a method my
    public void runOpMode() {             //  parent class declared"
        // your robot code here
    }
}` },
      { t: "h3", text: "What @Override buys you" },
      { t: "p", html: `<code>@Override</code> tells the compiler “this method must match one from my parent class.” If you typo <code>public void runOpmode()</code> (lowercase m), the compiler errors immediately instead of silently creating a new, never-called method — turning a mystifying “robot does nothing” bug into a clear compile error. Always write it.` },

      { t: "h2", text: "Annotations put OpModes on the Driver Station" },
      { t: "table",
        head: ["Annotation", "Effect"],
        rows: [
          [`<code>@TeleOp(name="Drive", group="comp")</code>`, `Appears in the Driver Station's TeleOp list`],
          [`<code>@Autonomous(name="Blue Left", preselectTeleOp="Drive")</code>`, `Appears in the Autonomous list; can auto-queue your TeleOp after`],
          [`<code>@Disabled</code>`, `Hidden from the list (great for old/test OpModes)`]
        ]},

      { t: "h2", text: "Enums: a type with a fixed set of values" },
      { t: "p", html: `An <code>enum</code> defines a type whose value must be one of a short, named list. The SDK uses enums so you can't pass nonsense — a direction must be <code>FORWARD</code> or <code>REVERSE</code>, nothing else:` },
      { t: "code", caption: "Enums you'll use constantly", code:
`motor.setDirection(DcMotor.Direction.REVERSE);
motor.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
motor.setMode(DcMotor.RunMode.RUN_USING_ENCODER);

// You'll define your own for state machines (Module 7):
enum LiftState { DOWN, RISING, HOLDING, LOWERING }
LiftState state = LiftState.DOWN;` },
      { t: "note", style: "info", html: `<p>Why not just use numbers or strings ("brake", "float")? Because you'd be one typo away from a runtime bug. With enums, the compiler only accepts the listed values, and your IDE autocompletes them. That's the SDK's design philosophy: make wrong code fail to compile.</p>` },
      { t: "quiz",
        q: `Where does <code>telemetry</code> come from when you use it inside <code>runOpMode()</code>?`,
        opts: [
          "You're supposed to declare it at the top of your class",
          "It's a global variable in Java",
          "It's inherited from LinearOpMode via extends",
          "The compiler creates it automatically"
        ],
        a: 2,
        explain: `<code>telemetry</code>, <code>hardwareMap</code>, <code>gamepad1</code>/<code>gamepad2</code> and friends are fields of <code>LinearOpMode</code>. Your class <code>extends</code> it, so it inherits them all — no declaration needed.` },
      { t: "quiz",
        q: `You accidentally write <code>public void runOpmode()</code> (lowercase m) with <code>@Override</code> on it. What happens?`,
        opts: [
          "Compile error — no parent method matches, which is exactly what you want to know",
          "It runs both methods",
          "The robot runs the misspelled one",
          "The OpMode silently never runs your code"
        ],
        a: 0,
        explain: `With <code>@Override</code>, the compiler verifies a matching parent method exists — the typo is caught instantly. <em>Without</em> the annotation, option D is what happens: your method compiles as a brand-new method nobody ever calls, and the robot “does nothing” with no error. That's why @Override matters.` },
      { t: "fill",
        intro: `Complete an autonomous OpMode skeleton.`,
        code:
`@@@1@@(name = "Park Auto")
public class ParkAuto @@2@@ LinearOpMode {

    @@@3@@
    public void runOpMode() {
        waitForStart();
        // drive to the parking zone...
    }
}`,
        blanks: [
          { answer: "Autonomous", hint: "annotation", size: 130 },
          { answer: "extends", hint: "keyword", size: 100 },
          { answer: "Override", hint: "annotation", size: 110 }
        ]}
    ]
  }
]});
