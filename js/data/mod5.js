/* Module 5 — Sensors & the IMU */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Sensors & the IMU",
  desc: "Give the robot senses: heading from the IMU, distance, touch, and color — and the patterns for using noisy data well.",
  level: "intermediate",
  lessons: [

  /* ---------------- 5.1 ---------------- */
  {
    id: "imu",
    title: "The IMU: knowing which way you're facing",
    sub: "The Control Hub's built-in orientation sensor — the key to accurate turns and field-centric drive.",
    objectives: [
      "Initializing the universal IMU class with hub orientation",
      "Reading yaw and understanding its conventions",
      "Turning to an angle with proportional control"
    ],
    blocks: [
      { t: "h2", text: "What the IMU gives you" },
      { t: "p", html: `The <strong>IMU</strong> (Inertial Measurement Unit) inside the Control Hub tracks the robot's rotation. The value you'll use constantly is <strong>yaw</strong>: rotation around the vertical axis, i.e. which way the robot is facing. Convention: counterclockwise is positive, and yaw is 0 wherever the robot faced at initialization (or the last reset).` },
      { t: "h2", text: "Initializing (the part everyone gets wrong once)" },
      { t: "p", html: `The IMU needs to know how the hub is mounted on your robot — otherwise “yaw” might actually be your robot tipping over. You describe the mounting with two facts: which way the REV logo faces, and which way the USB ports point:` },
      { t: "code", caption: "IMU init with the universal IMU interface", code:
`IMU imu = hardwareMap.get(IMU.class, "imu");

imu.initialize(new IMU.Parameters(new RevHubOrientationOnRobot(
        RevHubOrientationOnRobot.LogoFacingDirection.UP,
        RevHubOrientationOnRobot.UsbFacingDirection.FORWARD)));

imu.resetYaw();   // current heading becomes 0` },
      { t: "code", caption: "Reading the heading", code:
`double headingDeg = imu.getRobotYawPitchRollAngles()
                       .getYaw(AngleUnit.DEGREES);
telemetry.addData("Heading", "%.1f°", headingDeg);` },
      { t: "note", style: "warn", html: `<p>If your headings look insane (jumping, wrong axis), the orientation parameters don't match your actual mounting. Fix the two enum values — don't try to “correct” bad data downstream in math.</p>` },

      { t: "h2", text: "Turning to an angle — the smart way" },
      { t: "p", html: `Naive turning (“spin at 0.5 until heading ≥ 90”) always overshoots: the robot has momentum, and by the time the loop notices, you're at 97°. The fix is <strong>proportional control</strong> — your first taste of the PID ideas in Module 7. Power shrinks as you approach the target:` },
      { t: "code", caption: "Turn-to-angle with P control", code:
`public void turnToAngle(double targetDeg) {
    final double kP = 0.02;          // tuning constant
    final double TOLERANCE = 1.5;    // acceptable error, degrees

    double error = angleDifference(targetDeg, currentYaw());

    while (opModeIsActive() && Math.abs(error) > TOLERANCE) {
        error = angleDifference(targetDeg, currentYaw());

        double power = Range.clip(error * kP, -0.5, 0.5);
        // minimum power so friction doesn't stall the final approach
        if (Math.abs(power) < 0.08) power = Math.signum(power) * 0.08;

        leftDrive.setPower(-power);   // CCW positive: left back,
        rightDrive.setPower(power);   //               right forward
    }
    leftDrive.setPower(0);
    rightDrive.setPower(0);
}` },
      { t: "h3", text: "The angle-wrap trap" },
      { t: "p", html: `Heading is reported from -180° to +180°. Turning from +170° to -170° is only 20° through the “back” — but naive subtraction says -340°! Always normalize angle differences:` },
      { t: "code", caption: "Normalize any angle difference into -180..180", code:
`public double angleDifference(double target, double current) {
    double diff = target - current;
    while (diff > 180)  diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
}` },
      { t: "quiz",
        q: "The robot faces +170° and you want -170°. What should a correct turn do?",
        opts: [
          "Turn 340° clockwise... er, counterclockwise?",
          "Turn 20° counterclockwise (through +180/-180)",
          "It's impossible",
          "Reset the IMU first"
        ],
        a: 1,
        explain: `+170° and -170° are only 20° apart across the wrap-around point. Normalizing the difference into -180..180 makes the robot take the short way — every heading-based controller needs this.` },
      { t: "quiz",
        q: "In the P-controlled turn, why does power shrink as the robot approaches the target?",
        opts: [
          "To save battery",
          "power = error × kP, so less error means less power — the robot slows down and doesn't blow past the target",
          "The SDK limits turn speed automatically",
          "It doesn't — power is constant"
        ],
        a: 1,
        explain: `That's the essence of proportional control: correction proportional to error. Far away → fast; close → gentle. It's the single biggest accuracy upgrade over bang-bang (“full power until we're there”) control.` }
    ]
  },

  /* ---------------- 5.2 ---------------- */
  {
    id: "sensors",
    title: "Distance, touch & color sensors",
    sub: "The supporting cast — small sensors that make autonomous consistent.",
    objectives: [
      "Reading each common sensor type",
      "Choosing thresholds robustly",
      "Combining sensors with driving"
    ],
    blocks: [
      { t: "h2", text: "Distance sensors" },
      { t: "p", html: `The REV 2m Distance Sensor measures range with a tiny laser (time-of-flight). Great for “stop N cm from the wall” or detecting whether a game piece is in your intake:` },
      { t: "code", caption: "Distance sensor", code:
`DistanceSensor frontRange =
        hardwareMap.get(DistanceSensor.class, "front_range");

double cm = frontRange.getDistance(DistanceUnit.CM);
telemetry.addData("front", "%.1f cm", cm);

// creep toward the wall, stop at 10 cm
while (opModeIsActive() &&
       frontRange.getDistance(DistanceUnit.CM) > 10) {
    setDrivePower(0.25);
}
setDrivePower(0);` },
      { t: "note", style: "info", html: `<p>Out-of-range readings come back as a huge value (≈ 819 cm / <code>DistanceUnit.infinity</code>), not an error. Guard your logic: <code>if (cm < 100)</code> before trusting a reading.</p>` },

      { t: "h2", text: "Touch sensors: the humble hero" },
      { t: "code", caption: "Touch sensor as a limit switch", code:
`TouchSensor bottomLimit = hardwareMap.get(TouchSensor.class, "bottom_limit");

if (bottomLimit.isPressed()) {
    liftPower = Math.max(0, liftPower);  // block further downward motion
}` },
      { t: "p", html: `One boolean, endless value: homing lifts, detecting game pieces mechanically, protecting mechanisms from over-travel. When a $10 switch can replace a fragile assumption, use the switch.` },

      { t: "h2", text: "Color sensors" },
      { t: "p", html: `Color sensors report red/green/blue light levels (and usually distance to the surface, a few cm). Two classic uses: detecting colored game pieces, and finding lines on the field:` },
      { t: "code", caption: "Detecting a colored game piece", code:
`ColorSensor color = hardwareMap.get(ColorSensor.class, "color");

int r = color.red(), g = color.green(), b = color.blue();
telemetry.addData("RGB", "%d / %d / %d", r, g, b);

boolean seesRed  = r > g * 1.5 && r > b * 1.5;
boolean seesBlue = b > r * 1.5 && b > g * 1.5;` },
      { t: "note", style: "tip", html: `<p>Compare channels <em>to each other</em> (ratios), not to fixed numbers. Absolute readings change with lighting and distance; “red is 1.5× green” survives moving from your build room to the competition field. Always print raw values first and pick thresholds from data.</p>` },
      { t: "quiz",
        q: "Your color-detection worked at home but fails at the venue. Most likely reason?",
        opts: [
          "The sensor broke in transit",
          "You used absolute thresholds (e.g. red > 500) that depend on lighting — venue lighting differs. Ratio-based checks are robust",
          "Color sensors don't work at competitions",
          "The field is a different color"
        ],
        a: 1,
        explain: `Lighting changes every raw channel together; ratios between channels stay roughly stable. This is the classic “worked in the lab” sensor bug — and the fix is choosing relative thresholds.` },
      { t: "quiz",
        q: "Which sensor is the most reliable way to know a lift is at its true bottom?",
        opts: [
          "The encoder reading 0",
          "A timer",
          "A touch sensor physically pressed by the lift",
          "The motor current"
        ],
        a: 2,
        explain: `Encoders measure relative motion and drift from belt skips or bad zeroes; a limit switch measures physical reality. Best practice: use the switch to re-zero the encoder (as in Module 4).` }
    ]
  },

  /* ---------------- 5.3 ---------------- */
  {
    id: "sensor-patterns",
    title: "Patterns for noisy reality",
    sub: "Deadzones, thresholds with hysteresis, and averaging — the difference between demo code and competition code.",
    objectives: [
      "Why sensor data is noisy and what that does to naive code",
      "Hysteresis: two thresholds instead of one",
      "Simple filtering: averaging and rate limiting"
    ],
    blocks: [
      { t: "h2", text: "Noise: the enemy of ==" },
      { t: "p", html: `Real sensors jitter. A distance sensor 20 cm from a wall might read 19.7, 20.4, 19.9, 20.2… If your code asks <code>if (distance == 20)</code>, it may <em>never</em> fire. If it toggles behavior at exactly one threshold, it can chatter on/off many times per second as readings dance across the line. Competition code needs noise-tolerant patterns.` },

      { t: "h2", text: "Pattern 1: tolerance bands" },
      { t: "code", caption: "Never == for measurements", code:
`// BAD: may never be true
if (lift.getCurrentPosition() == 1500) { ... }

// GOOD: within a tolerance
if (Math.abs(lift.getCurrentPosition() - 1500) < 20) { ... }` },

      { t: "h2", text: "Pattern 2: hysteresis (two thresholds)" },
      { t: "p", html: `A single threshold chatters. Use two: switch ON below 10 cm, but only switch OFF above 14 cm. Between them, keep the previous state — the 4 cm gap absorbs the noise:` },
      { t: "code", caption: "Hysteresis for an intake auto-close", code:
`boolean pieceDetected = false;   // remembered between loops

double cm = intakeRange.getDistance(DistanceUnit.CM);
if (cm < 10)  pieceDetected = true;    // clearly close → ON
if (cm > 14)  pieceDetected = false;   // clearly far  → OFF
// between 10 and 14: no change — noise can't flicker the state

if (pieceDetected) claw.setPosition(CLAW_CLOSED);` },

      { t: "h2", text: "Pattern 3: averaging (low-pass filtering)" },
      { t: "code", caption: "Exponential moving average — 3 lines, big payoff", code:
`double filtered = 0;
final double ALPHA = 0.2;   // 0..1 — smaller = smoother but laggier

// each loop:
double raw = sensor.getDistance(DistanceUnit.CM);
filtered = ALPHA * raw + (1 - ALPHA) * filtered;` },
      { t: "p", html: `The filtered value trails the raw one slightly but shrugs off single-reading spikes. Use it for anything driving a decision or a controller; display both on telemetry while tuning <code>ALPHA</code>.` },

      { t: "h2", text: "Pattern 4: slew rate limiting (for outputs)" },
      { t: "p", html: `Noise isn't only on inputs — instant power jumps make robots jerk, tip, and skid (ruining encoder accuracy). Limit how fast a command can <em>change</em>:` },
      { t: "code", caption: "Smooth power changes", code:
`double lastPower = 0;
final double MAX_STEP = 0.08;   // max change per loop

double requested = -gamepad1.left_stick_y;
double delta = Range.clip(requested - lastPower, -MAX_STEP, MAX_STEP);
lastPower += delta;
setDrivePower(lastPower);` },
      { t: "quiz",
        q: "An LED should light when a game piece is within 12 cm. With code `led.setState(cm < 12)`, the LED flickers rapidly when the piece is near 12 cm. Best fix?",
        opts: [
          "Use a better LED",
          "Poll the sensor less often",
          "Hysteresis: turn on below 10 cm, off above 14 cm, hold state in between",
          "Multiply the distance by 2"
        ],
        a: 2,
        explain: `Flicker at a boundary is the signature of a single-threshold decision on noisy data. Two thresholds with a gap (hysteresis) is the standard cure — the state can't flip until the reading crosses the whole band.` },
      { t: "quiz",
        q: "In the moving-average filter, what does making ALPHA smaller (e.g. 0.05) do?",
        opts: [
          "More smoothing, but the filtered value reacts more slowly to real changes",
          "Less smoothing and faster reaction",
          "Nothing — ALPHA is cosmetic",
          "It inverts the sensor"
        ],
        a: 0,
        explain: `ALPHA is the weight of the newest reading. Small ALPHA = mostly keep the old estimate = smooth but laggy. It's always a trade-off; tune it while watching raw vs filtered on telemetry.` }
    ]
  }
]});
