/* Module 6 — Mecanum Drive */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Mecanum Drive",
  desc: "The omnidirectional drivetrain most competitive teams use: the math, the code, and field-centric control.",
  level: "intermediate",
  lessons: [

  /* ---------------- 6.1 ---------------- */
  {
    id: "mecanum-kinematics",
    title: "How mecanum wheels work",
    sub: "Four wheels, 45° rollers, and a little vector math = a robot that moves in any direction.",
    objectives: [
      "Why mecanum wheels allow sideways (strafing) motion",
      "The mecanum power equations and where they come from",
      "Why and how to normalize wheel powers"
    ],
    blocks: [
      { t: "h2", text: "The trick: 45° rollers" },
      { t: "p", html: `A mecanum wheel has free-spinning rollers mounted at 45° around its rim. When the wheel is driven, it pushes the floor <em>diagonally</em> — part forward, part sideways. Mount four of them with the rollers forming an <strong>X pattern (viewed from above)</strong>, and the sideways components can either cancel (driving straight) or add up (strafing). Spin the wheels in the right combinations and the robot can move in <em>any</em> direction while independently rotating.` },
      { t: "table",
        head: ["Motion", "frontLeft", "backLeft", "frontRight", "backRight"],
        rows: [
          ["Forward", "+", "+", "+", "+"],
          ["Strafe right", "+", "−", "−", "+"],
          ["Rotate clockwise", "+", "+", "−", "−"]
        ]},
      { t: "p", html: `Each basic motion is a pattern of wheel signs. The magic: motions <strong>superpose</strong> — to drive forward <em>while</em> strafing, just add the two patterns wheel-by-wheel. That gives the famous four equations:` },
      { t: "code", caption: "The mecanum equations", code:
`// axial   = forward/back   (-gamepad1.left_stick_y)
// lateral = strafe          ( gamepad1.left_stick_x)
// yaw     = rotate          ( gamepad1.right_stick_x)

double frontLeft  = axial + lateral + yaw;
double backLeft   = axial - lateral + yaw;
double frontRight = axial - lateral - yaw;
double backRight  = axial + lateral - yaw;` },
      { t: "note", style: "info", html: `<p>Reading the signs: <code>axial</code> appears with + everywhere (all wheels drive forward together). <code>lateral</code> flips sign in the X pattern of the rollers. <code>yaw</code> is + on the left side and − on the right (left forward + right backward = clockwise spin).</p>` },

      { t: "h2", text: "Normalization: dividing by the max" },
      { t: "p", html: `Push forward and strafe at once and a wheel might be commanded <code>1 + 1 + 0 = 2.0</code>. Clipping each wheel to 1.0 separately would <em>distort the direction</em> (the ratios between wheels are what create the motion!). Instead, if any magnitude exceeds 1, divide <strong>all four</strong> by the largest magnitude — same direction, legal powers:` },
      { t: "code", caption: "Normalize, don't clip", code:
`double max = Math.max(Math.abs(frontLeft), Math.abs(backLeft));
max = Math.max(max, Math.abs(frontRight));
max = Math.max(max, Math.abs(backRight));

if (max > 1.0) {
    frontLeft  /= max;
    backLeft   /= max;
    frontRight /= max;
    backRight  /= max;
}` },
      { t: "sim", name: "mecanum" },
      { t: "quiz",
        q: "The driver commands axial = 0, lateral = 1 (pure right strafe). Per the equations, what does backLeft get?",
        opts: ["+1", "−1", "0", "+0.5"],
        a: 1,
        explain: `backLeft = axial − lateral + yaw = 0 − 1 + 0 = −1. Check the strafe row of the table: front-left and back-right spin forward while back-left and front-right spin backward — the diagonal pairs work together.` },
      { t: "quiz",
        q: "Why divide all four powers by the max instead of clipping each wheel to ±1 individually?",
        opts: [
          "Division is faster than clipping",
          "Clipping each wheel separately changes the ratios between wheels, which changes the direction the robot actually moves — scaling all four preserves the direction",
          "Range.clip doesn't work on four values",
          "It doesn't matter"
        ],
        a: 1,
        explain: `The robot's motion direction is encoded in the <em>ratios</em> of the four wheel powers. Uniform scaling keeps the ratios (same direction, slightly slower); per-wheel clipping distorts them (the robot veers). Try maxing drive + strafe in the sim above and watch the normalized values.` }
    ]
  },

  /* ---------------- 6.2 ---------------- */
  {
    id: "mecanum-teleop",
    title: "The complete mecanum TeleOp",
    sub: "Everything so far, assembled into the program most FTC teams actually run.",
    objectives: [
      "Motor configuration and directions for mecanum",
      "The full drive loop with normalization",
      "Slow mode and squared inputs for driver feel"
    ],
    blocks: [
      { t: "h2", text: "Setup: directions first" },
      { t: "p", html: `Mecanum needs all four motors to agree that positive = forward. With typical mounting, the left side is reversed (or right — depends on your gearing). <strong>Test one wheel at a time</strong> with a simple OpMode before trusting the math:` },
      { t: "code", caption: "Init for a mecanum drivetrain", code:
`DcMotor frontLeft  = hardwareMap.get(DcMotor.class, "front_left");
DcMotor backLeft   = hardwareMap.get(DcMotor.class, "back_left");
DcMotor frontRight = hardwareMap.get(DcMotor.class, "front_right");
DcMotor backRight  = hardwareMap.get(DcMotor.class, "back_right");

frontLeft.setDirection(DcMotor.Direction.REVERSE);
backLeft.setDirection(DcMotor.Direction.REVERSE);
frontRight.setDirection(DcMotor.Direction.FORWARD);
backRight.setDirection(DcMotor.Direction.FORWARD);` },
      { t: "note", style: "warn", html: `<p>Symptom guide: robot drives forward but <em>turns instead of strafing</em> → one wheel's direction is wrong. Strafes backwards → the two diagonal pairs are swapped. Verify with the one-wheel-at-a-time test; five minutes here saves hours.</p>` },

      { t: "h2", text: "The full program" },
      { t: "code", caption: "MecanumTeleOp.java — competition-ready core", code:
`@TeleOp(name = "Mecanum TeleOp")
public class MecanumTeleOp extends LinearOpMode {

    @Override
    public void runOpMode() {
        DcMotor frontLeft  = hardwareMap.get(DcMotor.class, "front_left");
        DcMotor backLeft   = hardwareMap.get(DcMotor.class, "back_left");
        DcMotor frontRight = hardwareMap.get(DcMotor.class, "front_right");
        DcMotor backRight  = hardwareMap.get(DcMotor.class, "back_right");
        frontLeft.setDirection(DcMotor.Direction.REVERSE);
        backLeft.setDirection(DcMotor.Direction.REVERSE);

        waitForStart();

        while (opModeIsActive()) {
            double axial   = -gamepad1.left_stick_y;
            double lateral =  gamepad1.left_stick_x;
            double yaw     =  gamepad1.right_stick_x;

            double fl = axial + lateral + yaw;
            double bl = axial - lateral + yaw;
            double fr = axial - lateral - yaw;
            double br = axial + lateral - yaw;

            double max = Math.max(1.0, Math.max(Math.abs(fl),
                    Math.max(Math.abs(bl),
                    Math.max(Math.abs(fr), Math.abs(br)))));

            frontLeft.setPower(fl / max);
            backLeft.setPower(bl / max);
            frontRight.setPower(fr / max);
            backRight.setPower(br / max);
        }
    }
}` },
      { t: "p", html: `Neat trick in the normalization: seeding the max with <code>1.0</code> means “divide by 1 (no change)” whenever all powers are already legal — no if statement needed.` },

      { t: "h2", text: "Driver feel: two upgrades worth having" },
      { t: "code", caption: "Slow mode + squared inputs", code:
`// 1) Slow mode while holding right bumper — for lining up scoring
double multiplier = gamepad1.right_bumper ? 0.35 : 1.0;

// 2) Squared inputs: fine control near center, full power at the edges
//    (multiply by signum to keep the sign)
axial   = axial   * Math.abs(axial);
lateral = lateral * Math.abs(lateral);
yaw     = yaw     * Math.abs(yaw);

frontLeft.setPower(fl / max * multiplier);
// ... same for the other three` },
      { t: "p", html: `<code>x * Math.abs(x)</code> squares the magnitude while preserving sign: half-stick gives 25% power instead of 50%, so small corrections are gentle, yet full-stick still gives 100%. Most drivers prefer it within one practice session. (The <code>? :</code> in slow mode is the <strong>ternary operator</strong> — a one-line if/else that produces a value.)` },
      { t: "quiz",
        q: "Your new mecanum robot strafes left when you push the stick right, but forward/back is fine. Most likely cause?",
        opts: [
          "The lateral term needs a minus sign — or your stick x is inverted / wheel pattern is mirrored; either way, flip the sign of lateral",
          "The battery is low",
          "kP is too high",
          "You forgot to normalize"
        ],
        a: 0,
        explain: `Forward/back fine + strafe mirrored = the lateral component enters with the wrong sign somewhere (stick direction, wheel directions, or roller orientation). The pragmatic fix is flipping the sign of <code>lateral</code> — after verifying wheel directions are right.` },
      { t: "fill",
        intro: `Complete the mecanum power math.`,
        code:
`double fl = axial @@1@@ lateral + yaw;
double bl = axial - lateral @@2@@ yaw;
double fr = axial - lateral - yaw;
double br = axial + lateral - yaw;

double max = Math.max(1.0, ...);
frontLeft.setPower(fl @@3@@ max);`,
        blanks: [
          { answer: "+", hint: "op", size: 45 },
          { answer: "+", hint: "op", size: 45 },
          { answer: "/", hint: "op", size: 45 }
        ]}
    ]
  },

  /* ---------------- 6.3 ---------------- */
  {
    id: "field-centric",
    title: "Field-centric drive",
    sub: "Push the stick away from you and the robot goes that way — regardless of which way it's facing.",
    objectives: [
      "Robot-centric vs field-centric control",
      "Rotating the stick vector by the IMU heading",
      "The full field-centric loop with a heading reset"
    ],
    blocks: [
      { t: "h2", text: "The problem with robot-centric" },
      { t: "p", html: `In everything so far, “forward” means <em>the robot's</em> forward. Once the robot rotates, the driver has to mentally rotate every stick input — push up, and a robot facing left drives left. Under match pressure that costs seconds and causes crashes. <strong>Field-centric</strong> drive fixes it: the stick vector is interpreted in <em>field</em> coordinates, and code translates it into robot coordinates using the IMU heading.` },

      { t: "h2", text: "The math: rotating a vector" },
      { t: "p", html: `The driver's stick gives a desired motion vector (x, y) on the field. The robot is rotated by heading θ relative to the field. To convert field-desired motion into robot-relative motion, rotate the vector by <strong>−θ</strong>:` },
      { t: "code", caption: "The rotation (standard 2D rotation formula)", code:
`double heading = imu.getRobotYawPitchRollAngles()
                    .getYaw(AngleUnit.RADIANS);

// field-frame stick input
double x = gamepad1.left_stick_x;
double y = -gamepad1.left_stick_y;

// rotate into robot frame
double rotX = x * Math.cos(-heading) - y * Math.sin(-heading);
double rotY = x * Math.sin(-heading) + y * Math.cos(-heading);

// then feed rotX / rotY into the normal mecanum math
double fl = rotY + rotX + yaw;
double bl = rotY - rotX + yaw;
double fr = rotY - rotX - yaw;
double br = rotY + rotX - yaw;` },
      { t: "p", html: `Sanity check: robot facing “north” (θ = 0) → cos = 1, sin = 0 → rotX = x, rotY = y, identical to robot-centric. Robot rotated 90° CCW and driver pushes up (y = 1) → rotX/rotY come out so the robot strafes <em>its</em> right — which is “up” on the field. The math quietly does the driver's mental rotation.` },
      { t: "note", style: "tip", html: `<p>Many teams also multiply <code>rotX</code> by ~1.1 to counteract mecanum wheels' natural strafing inefficiency — strafing loses some speed to roller friction, and this evens out the feel.</p>` },

      { t: "h2", text: "Heading reset: essential quality of life" },
      { t: "p", html: `Field-centric depends on “heading 0” matching the driver's idea of “away from me.” After collisions or drift the IMU can be off. Give the driver a reset button:` },
      { t: "code", caption: "Reset field-forward mid-match", code:
`if (gamepad1.options) {   // small center button
    imu.resetYaw();       // current facing becomes the new field-forward
}` },
      { t: "note", style: "warn", html: `<p>Start-of-match detail: the robot usually <em>doesn't</em> start facing the driver's “forward.” Either place the robot consistently and reset yaw during init, or store a known offset. Teams forget this and the robot drives “sideways” for the first confused seconds.</p>` },
      { t: "quiz",
        q: "In field-centric drive, the robot is facing 90° CCW from field-forward. The driver pushes the stick straight up. What does the robot physically do?",
        opts: [
          "Drives toward its own front (which is field-left)",
          "Strafes to its right side, moving field-forward — exactly where the stick pointed",
          "Spins in place",
          "Nothing"
        ],
        a: 1,
        explain: `That's the whole point: the rotation converts “field-forward, please” into whatever robot-relative motion achieves it — here, a right strafe. The driver never thinks about robot orientation again.` },
      { t: "quiz",
        q: "Why does the code rotate the stick vector by −heading rather than +heading?",
        opts: [
          "Convention, either works",
          "We're converting FROM field coordinates TO robot coordinates — the inverse of the robot's rotation, hence the negative angle",
          "The IMU reports angles backwards",
          "To match the gamepad's inverted Y axis"
        ],
        a: 1,
        explain: `The robot is rotated +θ relative to the field, so field→robot conversion is a rotation by −θ (the inverse). Mixing this up gives a robot that's field-centric but mirrored — a fun bug to watch, less fun to debug.` },
      { t: "fill",
        intro: `Complete the field-centric rotation.`,
        code:
`double rotX = x * Math.cos(-heading) @@1@@ y * Math.sin(-heading);
double rotY = x * Math.@@2@@(-heading) + y * Math.@@3@@(-heading);`,
        blanks: [
          { answer: "-", hint: "op", size: 45 },
          { answer: "sin", hint: "fn", size: 60 },
          { answer: "cos", hint: "fn", size: 60 }
        ]}
    ]
  }
]});
