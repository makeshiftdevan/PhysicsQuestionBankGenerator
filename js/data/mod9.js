/* Module 9 — Limelight Vision */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  title: "Limelight Vision",
  desc: "Give your robot eyes: the Limelight 3A smart camera, AprilTag and color pipelines, and vision-driven aiming and localization.",
  level: "advanced",
  lessons: [

  /* ---------------- 9.1 ---------------- */
  {
    id: "limelight-intro",
    title: "Meet the Limelight 3A",
    sub: "A camera with a brain: what it does, how it connects, and how to configure it.",
    objectives: [
      "What the Limelight 3A is and why teams use it",
      "Wiring, configuration, and the web interface",
      "Pipelines: the core concept"
    ],
    blocks: [
      { t: "h2", text: "What it is" },
      { t: "p", html: `The <strong>Limelight 3A</strong> is a smart camera built for FTC: a camera plus an onboard processor that runs vision algorithms <em>on the camera itself</em>, sending your robot only the digested results (“I see AprilTag 20, it's 4.3° to your left, 31 inches away”). Your Control Hub does no heavy image work — you just read numbers, at up to 90+ frames per second.` },
      { t: "p", html: `That's the key contrast with the SDK's built-in <strong>VisionPortal</strong> (webcam + AprilTagProcessor on the hub): VisionPortal is cheaper (any UVC webcam) and fully supported, but shares the hub's limited CPU. The Limelight offloads everything, has a built-in tuning UI, and swaps between multiple vision programs instantly. Many top teams run one (or both — a Limelight and a webcam serve different mechanisms).` },
      { t: "h2", text: "Hookup" },
      { t: "ul", items: [
        `<strong>Power + data:</strong> the Limelight connects to the Control Hub's USB port (use the supplied cable; a powered hub is recommended since cameras are power-hungry).`,
        `<strong>Configuration:</strong> add it in your robot configuration as a <strong>Limelight 3A</strong> (Ethernet-over-USB device); name it e.g. <code>"limelight"</code>.`,
        `<strong>Tuning UI:</strong> browse to <code>http://limelight.local:5801</code> (from a laptop on the robot's network) for the pipeline editor with a live camera view.`
      ]},

      { t: "h2", text: "Pipelines" },
      { t: "p", html: `A <strong>pipeline</strong> is a saved vision program: a processing type plus all its tuned settings. The Limelight stores <strong>10 pipelines (index 0–9)</strong>, and your Java code switches between them instantly at runtime. Typical FTC loadout:` },
      { t: "table",
        head: ["Slot", "Pipeline type", "Purpose"],
        rows: [
          ["0", "AprilTag (fiducial)", "Localization + aiming at field tags"],
          ["1", "Color threshold", "Detect the season's game piece by color"],
          ["2", "Neural network detector", "ML-based game piece detection (advanced)"],
          ["3–9", "—", "Alliance-specific variants, test configs…"]
        ]},
      { t: "p", html: `You tune each pipeline in the web UI — adjusting exposure, color thresholds, tag families — while watching the live annotated feed. Code then simply selects and reads.` },
      { t: "quiz",
        q: "Where does the image processing happen when using a Limelight?",
        opts: [
          "On the Driver Station phone",
          "On the Control Hub's CPU",
          "On the Limelight's own onboard processor — the hub only receives results",
          "In the cloud"
        ],
        a: 2,
        explain: `That's the Limelight's whole value proposition: dedicated onboard compute. Your OpMode reads compact results (angles, distances, IDs) instead of crunching pixels, leaving the hub's CPU for control loops.` },
      { t: "quiz",
        q: "You want AprilTag aiming in autonomous but color-blob detection in TeleOp. How do you set that up?",
        opts: [
          "Two Limelights",
          "Re-flash the camera between matches",
          "Save each as a separate pipeline (say 0 and 1) and switch from code with a single call",
          "It's impossible"
        ],
        a: 2,
        explain: `Pipelines exist exactly for this: pre-tuned programs selected at runtime. You'll see the call — <code>limelight.pipelineSwitch(n)</code> — in the next lesson.` }
    ]
  },

  /* ---------------- 9.2 ---------------- */
  {
    id: "limelight-java",
    title: "Reading Limelight data in Java",
    sub: "The LLResult API: tx, ty, validity, and per-tag details.",
    objectives: [
      "Initializing and starting the Limelight in an OpMode",
      "The core readings: tx, ty, ta — and checking validity",
      "Reading individual AprilTag (fiducial) results"
    ],
    blocks: [
      { t: "h2", text: "Boilerplate" },
      { t: "code", caption: "Limelight init in an OpMode", code:
`import com.qualcomm.hardware.limelightvision.LLResult;
import com.qualcomm.hardware.limelightvision.LLResultTypes;
import com.qualcomm.hardware.limelightvision.Limelight3A;

public class LimelightTeleOp extends LinearOpMode {

    private Limelight3A limelight;

    @Override
    public void runOpMode() {
        limelight = hardwareMap.get(Limelight3A.class, "limelight");

        limelight.setPollRateHz(100);  // how often to fetch results
        limelight.pipelineSwitch(0);   // select pipeline 0 (AprilTags)
        limelight.start();             // begin polling  ← easy to forget!

        waitForStart();
        // ...
    }
}` },

      { t: "h2", text: "The three numbers that matter" },
      { t: "table",
        head: ["Value", "Meaning", "Range"],
        rows: [
          [`<code>getTx()</code>`, `Horizontal angle from crosshair to target — positive = target is to the right`, `≈ ±27° (3A horizontal FOV)`],
          [`<code>getTy()</code>`, `Vertical angle to target — used for distance estimation`, `≈ ±20°`],
          [`<code>getTa()</code>`, `Target area, % of image — crude proximity measure`, `0–100`]
        ]},
      { t: "code", caption: "The standard read pattern — validity first!", code:
`while (opModeIsActive()) {
    LLResult result = limelight.getLatestResult();

    if (result != null && result.isValid()) {
        double tx = result.getTx();
        double ty = result.getTy();
        double ta = result.getTa();

        telemetry.addData("Target", "tx %.1f°  ty %.1f°  area %.1f%%",
                tx, ty, ta);
    } else {
        telemetry.addData("Target", "not visible");
    }
    telemetry.update();
}` },
      { t: "note", style: "warn", html: `<p>Never skip the <code>null</code> and <code>isValid()</code> checks. When no target is in view, acting on stale or invalid data makes robots spin hunting for ghosts. Decide explicitly what to do when blind: hold position, keep the last command briefly, or fall back to driver control.</p>` },

      { t: "h2", text: "Per-tag details: fiducial results" },
      { t: "p", html: `AprilTag pipelines report every visible tag with its ID and geometry — essential when the field has many tags and you care about a specific one:` },
      { t: "code", caption: "Iterating detected AprilTags", code:
`List<LLResultTypes.FiducialResult> tags = result.getFiducialResults();

for (LLResultTypes.FiducialResult tag : tags) {
    int id = tag.getFiducialId();

    if (id == 20) {   // the tag we care about
        double txToTag = tag.getTargetXDegrees();
        Pose3D robotPose = result.getBotpose();  // field pose from tags!

        telemetry.addData("Tag 20", "tx %.1f°", txToTag);
        telemetry.addData("Botpose", robotPose.toString());
    }
}` },
      { t: "p", html: `That <code>getBotpose()</code> line is quietly enormous: because AprilTags sit at <em>known field positions</em>, seeing one lets the Limelight compute your robot's <strong>absolute field pose</strong> — which can correct your odometry's accumulated drift mid-match (the “+ AprilTags” row from the localization table in Module 8). The <code>for (Type item : list)</code> syntax is Java's <strong>enhanced for loop</strong> — “for each tag in the list.”` },
      { t: "quiz",
        q: "getTx() returns +12.0. Where is the target?",
        opts: [
          "12 inches away",
          "12° to the right of the camera's crosshair",
          "12° above the crosshair",
          "12% of the image"
        ],
        a: 1,
        explain: `tx is a horizontal <em>angle</em>, positive rightward. It's deliberately perfect input for a turning controller: the error “how far off-center is the target” already comes in degrees.` },
      { t: "quiz",
        q: "Why can seeing an AprilTag give the robot its absolute field position?",
        opts: [
          "AprilTags transmit GPS",
          "Each tag's exact field location is known ahead of time; from the tag's apparent size/perspective the camera solves its own pose relative to the tag, hence relative to the field",
          "It can't — tags only give angles",
          "The IMU does this part"
        ],
        a: 1,
        explain: `Tags are precisely surveyed landmarks. Perspective geometry (solvePnP, running on the Limelight) recovers the camera's 3D pose from a known-size square's corners. Landmark + geometry = localization, no accumulation, no drift.` },
      { t: "fill",
        intro: `Complete the safe-read pattern.`,
        code:
`LLResult result = limelight.@@1@@();

if (result != null && result.@@2@@()) {
    double tx = result.@@3@@();
    // ... use tx
}`,
        blanks: [
          { answer: "getLatestResult", hint: "method", size: 160 },
          { answer: "isValid", hint: "method", size: 100 },
          { answer: "getTx", hint: "method", size: 90 }
        ]}
    ]
  },

  /* ---------------- 9.3 ---------------- */
  {
    id: "limelight-aim",
    title: "Project: auto-aim & range with vision",
    sub: "Closing the loop: vision error in, motor power out — with a live lab to tune.",
    objectives: [
      "Turning tx into a turn command with proportional control",
      "Estimating distance from ty and driving to range",
      "Blending driver control with vision assists"
    ],
    blocks: [
      { t: "h2", text: "Auto-aim: vision meets P control" },
      { t: "p", html: `You already own every piece of this. <code>tx</code> is an error signal (degrees off-center). Proportional control (Module 5/7) turns errors into power. Connect them:` },
      { t: "code", caption: "Auto-aim while holding a button", code:
`final double AIM_kP = 0.02;
final double MAX_TURN = 0.5;

while (opModeIsActive()) {
    double drive = -gamepad1.left_stick_y;
    double turn  =  gamepad1.right_stick_x;      // driver's turn...

    LLResult result = limelight.getLatestResult();

    if (gamepad1.left_bumper                      // aim assist held
            && result != null && result.isValid()) {
        double tx = result.getTx();
        turn = Range.clip(tx * AIM_kP, -MAX_TURN, MAX_TURN);
        // vision overrides the turn axis; driver keeps drive axis!
    }

    leftDrive.setPower(drive + turn);
    rightDrive.setPower(drive - turn);
}` },
      { t: "p", html: `Design details worth copying: aim assist is <strong>held, not toggled</strong> (release = instant full control back); it only claims the <em>turn</em> axis so the driver still drives; and the turn power is clipped so a target at the edge of view doesn't whip the robot around. Now tune the real thing:` },
      { t: "sim", name: "limelight" },
      { t: "note", style: "tip", html: `<p>Did you find the trade-off? Low kP crawls onto target; high kP overshoots and rings. If you need it snappier without oscillation, that's exactly what the D term is for — you know where to find it (Module 7).</p>` },

      { t: "h2", text: "Distance from ty" },
      { t: "p", html: `With the camera at a known height and tilt, and the target at a known height, trigonometry converts the vertical angle <code>ty</code> into floor distance:` },
      { t: "code", caption: "Range estimation", code:
`final double CAMERA_HEIGHT_IN = 8.0;    // lens center above floor
final double TARGET_HEIGHT_IN = 29.5;   // tag center above floor
final double CAMERA_TILT_DEG  = 20.0;   // upward tilt of the camera

double angleToTarget = Math.toRadians(CAMERA_TILT_DEG + result.getTy());
double distance = (TARGET_HEIGHT_IN - CAMERA_HEIGHT_IN)
                  / Math.tan(angleToTarget);` },
      { t: "code", caption: "Drive to a set range (P control again!)", code:
`final double DESIRED_DISTANCE = 24.0;   // inches
final double RANGE_kP = 0.04;

double rangeError = distance - DESIRED_DISTANCE;
double drive = Range.clip(rangeError * RANGE_kP, -0.4, 0.4);
// combine with the aim turn from above:
leftDrive.setPower(drive + turn);
rightDrive.setPower(drive - turn);` },
      { t: "p", html: `Aim + range together = a one-button “line up to score” assist: the robot simultaneously centers the tag and closes to exactly 24 inches. In autonomous, the same two controllers replace “hope the odometry was perfect” with “visually verify and correct at the scoring position.”` },

      { t: "h2", text: "Practical vision wisdom" },
      { t: "ul", items: [
        `<strong>Tune exposure low.</strong> Motion blur is the enemy of tag detection; a darker, faster image tracks better than a pretty one.`,
        `<strong>Mount rigidly.</strong> A camera that vibrates or flexes changes its calibration constants — those height/tilt numbers above are trusted implicitly.`,
        `<strong>Filter, then act.</strong> A single-frame false detection shouldn't trigger anything. Require N consecutive valid frames (a counter — or your Module 5 hysteresis) before engaging automation.`,
        `<strong>Always have a manual fallback.</strong> Vision WILL fail at the worst moment (lighting, glare, a bent tag). Every assist should release cleanly to driver control.`
      ]},
      { t: "quiz",
        q: "During aim assist, why clip the turn power (MAX_TURN = 0.5) when tx can be ±27°?",
        opts: [
          "To protect the motors from burning out",
          "27° × 0.02 is only 0.54 anyway, so it does nothing",
          "A target at the view's edge would command a violent spin; clipping keeps the correction controlled and non-scary for the driver — and 27 × 0.02 = 0.54 does exceed 0.5",
          "The SDK requires clipping"
        ],
        a: 2,
        explain: `Uncapped, edge-of-view targets produce the largest, jerkiest commands exactly when tracking is least reliable. The clip bounds the assist's authority. (And yes — check the math: 0.54 > 0.5, so the clip genuinely engages.)` },
      { t: "quiz",
        q: "Your distance estimate is consistently ~15% short after you re-mounted the camera slightly tilted up. Why?",
        opts: [
          "The Limelight needs a firmware update",
          "The CAMERA_TILT_DEG constant no longer matches reality — the trig converts ty into distance using that angle, so a wrong tilt skews every estimate",
          "AprilTags shrank",
          "ty is measured in radians"
        ],
        a: 1,
        explain: `The formula's constants ARE the calibration. Any physical change to camera height or tilt must be re-measured and updated in code. Systematic (consistent-percentage) errors almost always mean a constant is wrong, not the algorithm.` }
    ]
  }
]});
