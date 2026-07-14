# 🤖 FTC Java Academy

An interactive website for learning **Java programming for FIRST Tech Challenge robotics** — from absolute beginner ("what is code?") through advanced topics like trajectory-based path following (Road Runner / Pedro Pathing) and Limelight vision.

## Features

- **11 modules, 33 lessons** — a complete curriculum with FTC-specific examples in every lesson
- **Interactive labs** (pure canvas/JS, no dependencies):
  - 🕹 **Mecanum drive simulator** — move virtual gamepad sticks, watch wheel powers and the robot respond
  - 📈 **PID tuning lab** — tune kP/kI/kD against a simulated gravity-loaded lift
  - 🗺 **Path builder** — click waypoints on an FTC field, watch a spline-following robot, and read the generated Road Runner code
  - 🎯 **Limelight auto-aim lab** — tune a P controller to center an AprilTag
- **Quizzes with explanations** and **fill-in-the-blank code exercises** in every lesson
- **Progress tracking** (localStorage) with per-module and course-wide progress bars
- Fully static site — no build step, no dependencies, works offline

## Curriculum

| # | Module | Level |
|---|--------|-------|
| 0 | Start Here: Robots & Code | Beginner |
| 1 | Java Fundamentals | Beginner |
| 2 | Methods, Classes & Objects | Beginner |
| 3 | Your First OpMode | Beginner |
| 4 | Motors, Servos & Encoders | Beginner |
| 5 | Sensors & the IMU | Intermediate |
| 6 | Mecanum Drive | Intermediate |
| 7 | Autonomous & Control Theory (state machines, PID) | Intermediate |
| 8 | Advanced Pathing (Road Runner, Pedro, pure pursuit) | Advanced |
| 9 | Limelight Vision (AprilTags, auto-aim) | Advanced |
| 10 | Level Up: Architecture & Beyond | Advanced |

## Running locally

It's a static site — any web server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` in a browser.

## Deploying to GitHub Pages

Settings → Pages → deploy from branch → select the branch and `/ (root)`. No build step needed.

## Project structure

```
index.html          app shell
css/style.css       all styling
js/highlight.js     tiny Java syntax highlighter
js/render.js        lesson block renderer (code, quizzes, fill-ins, notes)
js/sims.js          the four interactive canvas labs
js/app.js           router, sidebar, progress tracking
js/data/mod*.js     lesson content (one file per module)
```
