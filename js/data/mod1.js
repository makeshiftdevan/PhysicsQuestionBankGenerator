/* Module 1 — Java Fundamentals */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Java Fundamentals",
  desc: "Statements, variables, math, decisions, and loops — the core of Java, taught entirely with robot examples.",
  level: "beginner",
  lessons: [

  /* ---------------- 1.1 ---------------- */
  {
    id: "java-syntax",
    title: "Statements, syntax & comments",
    sub: "The grammar of Java: how instructions are written so the compiler understands them.",
    objectives: [
      "How Java statements and blocks are structured",
      "Why semicolons, braces, and capitalization matter",
      "How and when to write comments"
    ],
    blocks: [
      { t: "h2", text: "Statements: one instruction at a time" },
      { t: "p", html: `Java code is a sequence of <strong>statements</strong> — single instructions that end with a <strong>semicolon</strong> (<code>;</code>). The robot executes them top to bottom, one at a time:` },
      { t: "code", caption: "Three statements, executed in order", code:
`leftDrive.setPower(1.0);    // 1st: left motor full forward
rightDrive.setPower(1.0);   // 2nd: right motor full forward
sleep(1000);                // 3rd: wait 1000 milliseconds` },
      { t: "p", html: `Order matters. These three statements drive forward for one second. Swap the <code>sleep</code> to the top and the robot waits first, <em>then</em> drives — forever, because nothing ever stops it. The computer executes exactly what's written, in the order written.` },

      { t: "h2", text: "Blocks and braces" },
      { t: "p", html: `Curly braces <code>{ }</code> group statements into a <strong>block</strong>. Blocks belong to something — a class, a method, an <code>if</code>, a loop. Java doesn't care about indentation (unlike Python), but <em>humans do</em>, so always indent the contents of a block. Every <code>{</code> must have a matching <code>}</code> — unbalanced braces are a classic beginner compile error.` },
      { t: "code", caption: "Blocks inside blocks", code:
`public class MyOpMode extends LinearOpMode {   // class block starts

    @Override
    public void runOpMode() {                  // method block starts
        waitForStart();

        while (opModeIsActive()) {             // loop block starts
            // statements in here repeat over and over
        }                                      // loop block ends
    }                                          // method block ends
}                                              // class block ends` },

      { t: "h2", text: "Java is case-sensitive and picky" },
      { t: "ul", items: [
        `<code>setPower</code>, <code>SetPower</code>, and <code>setpower</code> are three different names. Only the first exists.`,
        `Strings (text) go in double quotes: <code>"left_drive"</code>.`,
        `Names can't contain spaces: FTC convention is <code>camelCase</code> — <code>leftDrive</code>, <code>armTargetPosition</code>, <code>isClawOpen</code>.`,
        `Every statement needs its <code>;</code>. Forgetting one gives a compile error on (or near) that line.`
      ]},

      { t: "h2", text: "Comments: notes for humans" },
      { t: "p", html: `Anything after <code>//</code> on a line, or between <code>/*</code> and <code>*/</code>, is a <strong>comment</strong> — the compiler ignores it completely. Comments explain <em>why</em> code does what it does, for your teammates and for future-you at a 7 AM competition:` },
      { t: "code", caption: "Comment styles", code:
`// Single-line comment: reverse the right side so both wheels drive forward.
rightDrive.setDirection(DcMotor.Direction.REVERSE);

/* Multi-line comment:
   The arm motor is geared 5:1, so 1 revolution of the arm
   = 5 revolutions of the motor = 5 * 28 = 140 encoder ticks. */
int TICKS_PER_ARM_REV = 140;` },
      { t: "quiz",
        q: "Which of these lines will the compiler accept?",
        opts: [
          `<code>leftDrive.setPower(1.0)</code>`,
          `<code>leftDrive.SetPower(1.0);</code>`,
          `<code>leftDrive.setPower(1.0);</code>`,
          `<code>left drive.setPower(1.0);</code>`
        ],
        a: 2,
        explain: `Option A is missing the semicolon, B capitalizes <code>SetPower</code> (no such method — Java is case-sensitive), and D has a space in the variable name. Only C is valid.` },
      { t: "fill",
        intro: `Complete this snippet so the robot drives forward for half a second, then stops. (<code>sleep</code> takes milliseconds; stopping means power <code>0</code>.)`,
        code:
`leftDrive.setPower(1.0);
rightDrive.setPower(1.0);
sleep(@@1@@);
leftDrive.setPower(@@2@@);
rightDrive.setPower(0);`,
        blanks: [
          { answer: ["500"], hint: "ms", size: 70 },
          { answer: ["0", "0.0"], hint: "power", size: 70 }
        ]}
    ]
  },

  /* ---------------- 1.2 ---------------- */
  {
    id: "variables",
    title: "Variables & data types",
    sub: "Named boxes that hold your robot's numbers, switches, and text.",
    objectives: [
      "Declaring variables with a type and a name",
      "The types you'll actually use in FTC: double, int, boolean, String",
      "Constants with final, and why magic numbers are bad"
    ],
    blocks: [
      { t: "h2", text: "What's a variable?" },
      { t: "p", html: `A <strong>variable</strong> is a named box in memory that stores a value. You <strong>declare</strong> it once (giving it a <em>type</em> and a <em>name</em>), and you can read or change its contents afterwards:` },
      { t: "code", caption: "Declaring and using variables", code:
`double drivePower = 0.75;     // declare a decimal number, put 0.75 in it
int armTarget = 1200;         // declare a whole number
boolean clawOpen = false;     // declare a true/false switch
String allianceColor = "blue";// declare text

drivePower = 0.5;             // change the value later (no type needed again)
leftDrive.setPower(drivePower); // use it` },

      { t: "h2", text: "The four types you'll use constantly" },
      { t: "table",
        head: ["Type", "Holds", "FTC examples"],
        rows: [
          [`<code>double</code>`, `Decimal numbers`, `Motor power (<code>0.75</code>), servo position (<code>0.5</code>), stick values, headings in degrees`],
          [`<code>int</code>`, `Whole numbers`, `Encoder ticks (<code>1200</code>), loop counters, AprilTag IDs`],
          [`<code>boolean</code>`, `<code>true</code> or <code>false</code>`, `Is the claw open? Is the button pressed? Has the lift reached its target?`],
          [`<code>String</code>`, `Text in quotes`, `Hardware names (<code>"left_drive"</code>), telemetry messages`]
        ]},
      { t: "note", style: "warn", html: `<p><strong>Gotcha:</strong> <code>int</code> division throws away the remainder. <code>7 / 2</code> is <code>3</code>, not <code>3.5</code>! If you want decimals, make at least one side a double: <code>7.0 / 2</code> is <code>3.5</code>. This bug bites FTC teams every year when converting encoder ticks to distances.</p>` },

      { t: "h2", text: "Constants: final variables" },
      { t: "p", html: `Numbers that never change while the program runs — ticks per revolution, servo positions for “open” and “closed” — should be declared <code>final</code> and named in <code>ALL_CAPS</code>. This makes code readable and gives you a single place to tune:` },
      { t: "code", caption: "Constants instead of magic numbers", code:
`final double CLAW_OPEN   = 0.85;
final double CLAW_CLOSED = 0.42;
final int    LIFT_HIGH   = 2150;   // encoder ticks

// Later, the code explains itself:
clawServo.setPosition(CLAW_OPEN);        // ✔ obvious
// versus:
clawServo.setPosition(0.85);             // ✘ what is 0.85? why?` },
      { t: "quiz",
        q: "Which declaration is right for storing a motor power of 65%?",
        opts: [
          `<code>int power = 0.65;</code>`,
          `<code>double power = 0.65;</code>`,
          `<code>boolean power = 0.65;</code>`,
          `<code>String power = "0.65";</code>`
        ],
        a: 1,
        explain: `Motor powers are decimals between -1.0 and 1.0, so they need a <code>double</code>. An <code>int</code> can't store 0.65 (it would be a compile error), and a String would be text, not a number you can do math with.` },
      { t: "quiz",
        q: `What is the value of <code>ticks</code> after this code runs?<br><pre>int wheelTicks = 537;
int quarterTurn = wheelTicks / 4;</pre>`,
        opts: ["134.25", "134", "135", "It doesn't compile"],
        a: 1,
        explain: `Both operands are <code>int</code>s, so Java does integer division: <code>537 / 4 = 134</code> (the .25 is discarded, not rounded). To keep the fraction you'd write <code>537 / 4.0</code> and store it in a <code>double</code>.` },
      { t: "fill",
        intro: `Declare the variables for a lift subsystem: the target is a whole number of encoder ticks, the power is a decimal, and we track whether the lift is homed with a true/false value.`,
        code:
`@@1@@ liftTarget = 1800;
@@2@@ liftPower = 0.9;
@@3@@ isHomed = false;`,
        blanks: [
          { answer: "int", hint: "type", size: 90 },
          { answer: "double", hint: "type", size: 90 },
          { answer: "boolean", hint: "type", size: 90 }
        ]}
    ]
  },

  /* ---------------- 1.3 ---------------- */
  {
    id: "operators",
    title: "Operators & robot math",
    sub: "Scaling stick values, clipping powers, comparing numbers — the math your TeleOp runs 50 times a second.",
    objectives: [
      "Arithmetic and assignment operators",
      "Comparison and logical operators",
      "Real FTC patterns: negating stick Y, scaling, and Range.clip"
    ],
    blocks: [
      { t: "h2", text: "Arithmetic" },
      { t: "p", html: `Java has the operators you'd expect: <code>+</code>, <code>-</code>, <code>*</code> (multiply), <code>/</code> (divide), and <code>%</code> (remainder). Two robot-flavored patterns show up constantly:` },
      { t: "code", caption: "Everyday TeleOp math", code:
`// 1) Gamepad Y sticks are INVERTED: pushing up gives a negative value.
//    Negate them so "up = forward":
double drive = -gamepad1.left_stick_y;

// 2) Scale down for fine control (a "slow mode" at 40% speed):
double slowDrive = drive * 0.4;

// 3) Convert encoder ticks to inches:
double WHEEL_CIRCUMFERENCE = 4.09 * Math.PI;         // 4.09" wheel
double TICKS_PER_INCH = 537.7 / WHEEL_CIRCUMFERENCE; // 537.7 ticks/rev motor
double inchesTraveled = motor.getCurrentPosition() / TICKS_PER_INCH;` },
      { t: "note", style: "tip", html: `<p>Shorthand assignment operators save typing: <code>x += 5</code> means <code>x = x + 5</code>; likewise <code>-=</code>, <code>*=</code>, <code>/=</code>. And <code>x++</code> adds exactly 1 (great for counters).</p>` },

      { t: "h2", text: "Comparisons produce booleans" },
      { t: "p", html: `Comparison operators ask questions and produce <code>true</code>/<code>false</code>: <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>, <code>==</code> (equals), <code>!=</code> (not equals).` },
      { t: "note", style: "warn", html: `<p><code>=</code> assigns, <code>==</code> compares. Writing <code>if (x = 5)</code> when you meant <code>if (x == 5)</code> is a classic bug (luckily it usually won't compile in Java). Also: never compare doubles with <code>==</code> — motors and sensors are noisy, so check a tolerance instead: <code>Math.abs(error) &lt; 10</code>.</p>` },

      { t: "h2", text: "Logical operators: combining conditions" },
      { t: "table",
        head: ["Operator", "Meaning", "FTC example"],
        rows: [
          [`<code>&amp;&amp;</code>`, `AND — both must be true`, `<code>gamepad1.a && liftIsDown</code> — only intake when A is pressed AND the lift is down`],
          [`<code>||</code>`, `OR — at least one true`, `<code>gamepad1.left_bumper || gamepad1.right_bumper</code>`],
          [`<code>!</code>`, `NOT — flips a boolean`, `<code>!touchSensor.isPressed()</code> — true while NOT pressed`]
        ]},

      { t: "h2", text: "Clipping: keeping powers legal" },
      { t: "p", html: `Motor powers must stay within <strong>-1.0 to 1.0</strong>. When you add values together (like drive + turn in arcade drive), the sum can exceed that. The SDK's <code>Range.clip</code> clamps a value into a range:` },
      { t: "code", caption: "Arcade drive with clipping", code:
`double drive = -gamepad1.left_stick_y;
double turn  =  gamepad1.right_stick_x;

// drive + turn could be 2.0 if both are maxed — clip to legal range:
double leftPower  = Range.clip(drive + turn, -1.0, 1.0);
double rightPower = Range.clip(drive - turn, -1.0, 1.0);

leftDrive.setPower(leftPower);
rightDrive.setPower(rightPower);` },
      { t: "quiz",
        q: `The driver pushes the left stick all the way up. What is <code>-gamepad1.left_stick_y</code>?`,
        opts: ["-1.0", "0.0", "1.0", "Depends on the gamepad brand"],
        a: 2,
        explain: `Gamepad Y axes report <strong>-1.0 when pushed up</strong> (a quirk inherited from flight sticks). Negating gives +1.0, so “stick up” means “full power forward” — which is why nearly every FTC TeleOp starts with that minus sign.` },
      { t: "quiz",
        q: `What does <code>Range.clip(1.7, -1.0, 1.0)</code> return?`,
        opts: ["1.7", "1.0", "-1.0", "0.85"],
        a: 1,
        explain: `Clip forces the value into the range: anything above 1.0 becomes 1.0, anything below -1.0 becomes -1.0, and values already inside pass through unchanged. It clamps — it doesn't rescale.` },
      { t: "fill",
        intro: `Build a slow-mode drive: when the right bumper is held, the robot should drive at 30% speed. Fill in the logical operator, the multiplier, and the clip bounds.`,
        code:
`double drive = -gamepad1.left_stick_y;

if (gamepad1.right_bumper) {
    drive = drive @@1@@ 0.3;
}

leftDrive.setPower(Range.clip(drive, @@2@@, @@3@@));`,
        blanks: [
          { answer: "*", hint: "operator", size: 60 },
          { answer: ["-1.0", "-1"], hint: "min", size: 70 },
          { answer: ["1.0", "1"], hint: "max", size: 70 }
        ]}
    ]
  },

  /* ---------------- 1.4 ---------------- */
  {
    id: "conditionals",
    title: "Making decisions: if, else & switch",
    sub: "Buttons that do things, thresholds that trigger actions — teaching your robot to react.",
    objectives: [
      "if / else if / else chains",
      "Reading gamepad buttons and triggers",
      "The rising-edge toggle pattern every TeleOp needs"
    ],
    blocks: [
      { t: "h2", text: "if / else" },
      { t: "p", html: `An <code>if</code> statement runs its block only when its condition is <code>true</code>. Add <code>else</code> for “otherwise,” and <code>else if</code> to chain more cases. Conditions are just boolean expressions — like the gamepad's buttons, which the SDK gives you as booleans:` },
      { t: "code", caption: "Claw control with buttons", code:
`if (gamepad1.a) {
    clawServo.setPosition(CLAW_OPEN);      // A pressed → open
} else if (gamepad1.b) {
    clawServo.setPosition(CLAW_CLOSED);    // B pressed → close
}
// (no else: if neither is pressed, the claw stays where it is)` },
      { t: "p", html: `Analog inputs work too — triggers report <code>0.0</code> to <code>1.0</code>, so compare them against a threshold:` },
      { t: "code", caption: "Trigger as a button", code:
`if (gamepad1.right_trigger > 0.5) {
    intakeMotor.setPower(1.0);    // trigger held: intake in
} else if (gamepad1.left_trigger > 0.5) {
    intakeMotor.setPower(-1.0);   // other trigger: spit out
} else {
    intakeMotor.setPower(0);      // neither: stop  ← don't forget this!
}` },
      { t: "note", style: "warn", html: `<p>The final <code>else</code> that stops the motor is crucial. Without it, the intake keeps running forever after one press, because <em>nothing ever sets the power back to 0</em>. “Motor won't stop” is almost always a missing else.</p>` },

      { t: "h2", text: "The toggle problem (rising edge detection)" },
      { t: "p", html: `Suppose you want the X button to <em>toggle</em> the claw: press once to open, press again to close. The naive version fails, because your TeleOp loop runs ~50 times per second — one human press lasts dozens of loops, so the claw flickers open/closed rapidly. The fix: act only on the <strong>rising edge</strong>, the single loop where the button changed from not-pressed to pressed:` },
      { t: "code", caption: "The toggle pattern — memorize this one", code:
`boolean clawOpen = false;
boolean lastX = false;          // what X was on the PREVIOUS loop

while (opModeIsActive()) {
    boolean currentX = gamepad1.x;

    if (currentX && !lastX) {   // pressed NOW, wasn't pressed BEFORE
        clawOpen = !clawOpen;   // flip the state
    }
    lastX = currentX;           // remember for next loop

    if (clawOpen) {
        clawServo.setPosition(CLAW_OPEN);
    } else {
        clawServo.setPosition(CLAW_CLOSED);
    }
}` },

      { t: "h2", text: "switch: many cases of one value" },
      { t: "p", html: `When you're choosing between many values of a single variable, <code>switch</code> reads better than a long else-if chain. You'll use it heavily for autonomous state machines in Module 7:` },
      { t: "code", caption: "switch preview", code:
`switch (liftLevel) {
    case 0:  liftTarget = 0;    break;
    case 1:  liftTarget = 800;  break;
    case 2:  liftTarget = 1600; break;
    default: liftTarget = 0;    break;
}` },
      { t: "quiz",
        q: `In the toggle pattern, why check <code>currentX && !lastX</code> instead of just <code>gamepad1.x</code>?`,
        opts: [
          "It's faster to compute",
          "The loop runs ~50×/sec, so one press would toggle dozens of times — the edge check fires exactly once per press",
          "gamepad1.x can be null",
          "Java requires two conditions in an if"
        ],
        a: 1,
        explain: `A human press lasts maybe 200 ms ≈ 10+ loop iterations. <code>currentX && !lastX</code> is true only on the first iteration of the press — the “rising edge” — so the toggle flips exactly once.` },
      { t: "quiz",
        q: `With the intake code above, the driver releases both triggers. What does the intake do?`,
        opts: [
          "Keeps its last power",
          "Runs at half speed",
          "Stops, because the else branch sets power to 0",
          "Reverses"
        ],
        a: 2,
        explain: `Both trigger conditions are false, so control falls to the <code>else</code>, which sets power 0 every loop. This “command every output every loop” style is the safest way to write TeleOp.` },
      { t: "fill",
        intro: `Make the D-pad control a lift: up goes to the high position, down to the ground, and it holds position otherwise (no else needed). Fill in the conditions.`,
        code:
`if (gamepad1.@@1@@) {
    liftTarget = LIFT_HIGH;
} else if (gamepad1.@@2@@) {
    liftTarget = @@3@@;
}`,
        blanks: [
          { answer: "dpad_up", hint: "button", size: 110 },
          { answer: "dpad_down", hint: "button", size: 110 },
          { answer: ["0", "LIFT_GROUND"], hint: "ticks", size: 110 }
        ]}
    ]
  },

  /* ---------------- 1.5 ---------------- */
  {
    id: "loops",
    title: "Loops: while & for",
    sub: "The heartbeat of every OpMode — and how to repeat anything.",
    objectives: [
      "while loops and the sacred opModeIsActive() pattern",
      "for loops for counted repetition",
      "Why you must never block the loop with long sleeps"
    ],
    blocks: [
      { t: "h2", text: "while: repeat while something is true" },
      { t: "p", html: `A <code>while</code> loop repeats its block as long as its condition stays <code>true</code>. The single most important loop in FTC is this one:` },
      { t: "code", caption: "The TeleOp heartbeat", code:
`waitForStart();

while (opModeIsActive()) {
    // read gamepads → compute → command motors
    double drive = -gamepad1.left_stick_y;
    leftDrive.setPower(drive);
    rightDrive.setPower(drive);

    telemetry.addData("Drive power", drive);
    telemetry.update();
}` },
      { t: "p", html: `<code>opModeIsActive()</code> returns <code>true</code> from when the driver presses ▶ START until they press STOP (or the 2-minute timer ends). So this loop runs over and over — roughly 50 times per second — reading sticks and updating motors each pass. Every TeleOp you ever write is “stuff inside this loop.”` },
      { t: "note", style: "rule", html: `<p><strong>Golden rule of TeleOp:</strong> each pass through the loop should be <em>fast</em> — read inputs, do a little math, set outputs, done. Never put <code>sleep(2000)</code> inside the driver loop: for those 2 seconds the sticks are dead and the robot is uncontrollable. (We'll fix “wait for things” properly with state machines in Module 7.)</p>` },

      { t: "h2", text: "for: repeat a known number of times" },
      { t: "p", html: `When you know <em>how many</em> repetitions you want, use <code>for</code>. Its header packs three parts: start; keep-going condition; step.` },
      { t: "code", caption: "Blink pattern: 3 flashes on the LED", code:
`for (int i = 0; i < 3; i++) {
    led.setState(true);
    sleep(250);
    led.setState(false);
    sleep(250);
}
// i starts at 0 → runs with i = 0, 1, 2 → stops when i < 3 is false` },
      { t: "p", html: `A more useful FTC example — averaging a noisy sensor:` },
      { t: "code", caption: "Average 10 distance readings", code:
`double total = 0;
for (int i = 0; i < 10; i++) {
    total += distanceSensor.getDistance(DistanceUnit.CM);
}
double average = total / 10.0;   // note: 10.0, not 10 — avoid int division!` },

      { t: "h2", text: "Loops that wait (carefully)" },
      { t: "p", html: `In <em>autonomous</em>, it's normal to wait for a motor to finish moving. The safe pattern always includes <code>opModeIsActive()</code> so STOP still works:` },
      { t: "code", caption: "Waiting for a motor to reach its target", code:
`liftMotor.setTargetPosition(LIFT_HIGH);
liftMotor.setMode(DcMotor.RunMode.RUN_TO_POSITION);
liftMotor.setPower(0.8);

while (opModeIsActive() && liftMotor.isBusy()) {
    telemetry.addData("Lift", liftMotor.getCurrentPosition());
    telemetry.update();
}
liftMotor.setPower(0);` },
      { t: "note", style: "warn", html: `<p>A wait-loop <em>without</em> <code>opModeIsActive()</code> — like <code>while (liftMotor.isBusy()) {}</code> — can keep running after the driver presses STOP. The SDK will force-kill your OpMode and show “stuck in stop()” errors. Always <code>&&</code> your wait conditions with <code>opModeIsActive()</code>.</p>` },
      { t: "quiz",
        q: `How many times does this loop body run?<br><pre>for (int i = 1; i <= 4; i++) { ... }</pre>`,
        opts: ["3", "4", "5", "Forever"],
        a: 1,
        explain: `i takes the values 1, 2, 3, 4 — the condition <code>i <= 4</code> is still true at 4 and false at 5. Four runs. Off-by-one counting is worth practicing until it's automatic.` },
      { t: "quiz",
        q: "Why is sleep(3000) inside the TeleOp while-loop a bad idea?",
        opts: [
          "sleep isn't allowed in Java",
          "It drains the battery",
          "The loop stops reading the gamepads for 3 seconds — the drivers lose control of the robot",
          "It makes the code compile slowly"
        ],
        a: 2,
        explain: `While sleeping, the loop isn't reading sticks or updating motors — the robot barrels on with whatever powers were last set. In a match, 3 uncontrollable seconds can mean a penalty or a crash. Keep the loop fast; use timers/state machines for delays.` },
      { t: "fill",
        intro: `Complete the classic TeleOp skeleton.`,
        code:
`waitForStart();

@@1@@ (@@2@@()) {
    double drive = -gamepad1.left_stick_y;
    leftDrive.setPower(drive);
    rightDrive.setPower(drive);
    telemetry.@@3@@();
}`,
        blanks: [
          { answer: "while", hint: "keyword", size: 90 },
          { answer: "opModeIsActive", hint: "method", size: 150 },
          { answer: "update", hint: "method", size: 90 }
        ]}
    ]
  }
]});
