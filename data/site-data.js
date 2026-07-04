/* ============================================================
   SKAPHYSICS SITE DATA — edit this file to change the site.
   ============================================================

   HOW TO ADD A LINK (the only thing you'll usually do):

   1. Find the class below, then the unit you want.
   2. Copy an existing line inside its "links" list, e.g.:

        { label: "Guided Notes", url: "https://...", type: "doc" },

   3. Change the label and paste your URL. Save. Done.

   "type" controls the small icon shown next to the link:
      "doc"      – notes, handouts, worksheets
      "video"    – video lessons
      "practice" – problem sets, reviews, tests
      "sim"      – simulations / interactives
      "external" – anything else

   You can also use the Link Builder on the Teacher Tools page —
   it writes these snippets for you so you can copy/paste them here.

   To add a whole new unit, copy an entire { title ... } block
   (from its opening "{" to its closing "}," ) and edit it.
   ============================================================ */

const SITE_DATA = {
  siteName: "SkaPhysics",
  tagline: "Physics resources for Mr. Skapetis's classes — notes, practice, videos, and games in one place.",

  social: [
    { label: "YouTube", url: "https://www.youtube.com/@Skaphysics" },
    { label: "TikTok", url: "https://www.tiktok.com/@skaphysics" },
    { label: "Legacy site", url: "https://www.skaphysics.com" },
  ],

  /* Quick links shown on the home page under the class cards. */
  quickLinks: [
    { label: "AP Physics 1 equation sheet (College Board)", url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-equations-table.pdf", type: "doc" },
    { label: "AP Physics C equation sheet (College Board)", url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-c-equations-table.pdf", type: "doc" },
    { label: "PhET Simulations", url: "https://phet.colorado.edu/en/simulations/filter?subjects=physics", type: "sim" },
    { label: "The Physics Aviary", url: "https://www.thephysicsaviary.com/Physics/Programs/Labs/", type: "sim" },
  ],

  classes: [
    /* ------------------------------------------------------ */
    {
      id: "physics-1-honors",
      name: "Physics 1 Honors",
      blurb: "A hands-on, project-driven introduction to physics built around real-world scenarios — driving, sports, thrill rides, and entertainment.",
      legacyUrl: "https://www.skaphysics.com/physics-1-active-physics",
      units: [
        {
          title: "Chapter 1 · Driving the Roads",
          description: "Motion, speed, reaction time, and road safety.",
          links: [
            { label: "Chapter page on legacy site", url: "https://www.skaphysics.com/physics-1-active-physics", type: "external" },
          ],
        },
        {
          title: "Chapter 2 · Physics in Sports",
          description: "Forces, projectile motion, and momentum on the field.",
          links: [
            { label: "Chapter page on legacy site", url: "https://www.skaphysics.com/physics-1-active-physics", type: "external" },
          ],
        },
        {
          title: "Chapter 3 · Safety",
          description: "Collisions, impulse, and designing for safety.",
          links: [
            { label: "Chapter page on legacy site", url: "https://www.skaphysics.com/physics-1-active-physics", type: "external" },
          ],
        },
        {
          title: "Chapter 4 · Thrills and Chills",
          description: "Energy, roller coasters, and circular motion.",
          links: [
            { label: "Chapter page on legacy site", url: "https://www.skaphysics.com/physics-1-active-physics/chapter-4-thrills-and-chills", type: "external" },
          ],
        },
        {
          title: "Chapter 5 · Let Us Entertain You",
          description: "Sound, light, and the physics of entertainment.",
          links: [
            { label: "Chapter page on legacy site", url: "https://www.skaphysics.com/physics-1-active-physics/chapter-5-let-us-entertain-you", type: "external" },
            { label: "Chapter 5 Test info", url: "https://www.skaphysics.com/physics-1-active-physics/chapter-5-let-us-entertain-you/chapter-5-test", type: "practice" },
          ],
        },
        {
          title: "Magnetism",
          description: "Magnetic fields, forces, and electromagnetism basics.",
          links: [
            { label: "Magnetism page on legacy site", url: "https://www.skaphysics.com/physics-1-active-physics/magnetism", type: "external" },
          ],
        },
      ],
    },

    /* ------------------------------------------------------ */
    {
      id: "ap-physics-1",
      name: "AP Physics 1",
      blurb: "Algebra-based college physics: kinematics, dynamics, energy, momentum, rotation, oscillations, and more — aligned to the AP exam.",
      legacyUrl: "https://www.skaphysics.com/home/ap-physics-1",
      units: [
        {
          title: "Unit 1 · Newton's 1st Law",
          description: "Inertia, equilibrium, and force diagrams.",
          links: [
            { label: "Unit page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1/unit-1", type: "external" },
          ],
        },
        {
          title: "Unit 2 · Kinematics",
          description: "Describing motion in one and two dimensions.",
          links: [
            { label: "Course page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1", type: "external" },
          ],
        },
        {
          title: "Unit 3 · Newton's 2nd Law",
          description: "Net force, acceleration, and applications.",
          links: [
            { label: "Course page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1", type: "external" },
          ],
        },
        {
          title: "Unit 4 · Circular Motion & Gravitation",
          description: "Centripetal force, orbits, and universal gravitation.",
          links: [
            { label: "Course page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1", type: "external" },
          ],
        },
        {
          title: "Unit 5 · Work, Energy & Power",
          description: "Energy transfer, conservation, and power.",
          links: [
            { label: "Course page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1", type: "external" },
          ],
        },
        {
          title: "Unit 6 · Conservation of Momentum",
          description: "Impulse, collisions, and momentum conservation.",
          links: [
            { label: "Unit page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1/unit-6-momentum", type: "external" },
          ],
        },
        {
          title: "Unit 7 · Rotational Kinematics & Dynamics",
          description: "Torque, rotational inertia, and rotational motion.",
          links: [
            { label: "Unit page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1/unit-7", type: "external" },
          ],
        },
        {
          title: "Unit 8 · Simple Harmonic Motion",
          description: "Springs, pendulums, and oscillations.",
          links: [
            { label: "Unit page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1/unit-8", type: "external" },
          ],
        },
        {
          title: "Unit 9 · Astrophysics",
          description: "Stars, orbits, and the physics of the cosmos.",
          links: [
            { label: "Unit page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1/unit-9-astrophysics", type: "external" },
            { label: "Alternate Unit 9 page", url: "https://www.skaphysics.com/home/ap-physics-1/unit-9", type: "external" },
          ],
        },
        {
          title: "Unit 12 · Calculus Preview",
          description: "A bridge to calculus-based physics.",
          links: [
            { label: "Unit page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1/unit-12", type: "external" },
          ],
        },
        {
          title: "Unit 13 · End-of-Year Topics",
          description: "Enrichment, games, and review.",
          links: [
            { label: "Unit page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-1/unit-13", type: "external" },
          ],
        },
        {
          title: "AP Exam Review",
          description: "Everything you need before test day.",
          links: [
            { label: "AP Physics 1 course page (College Board)", url: "https://apstudents.collegeboard.org/courses/ap-physics-1", type: "external" },
            { label: "AP Physics 1 equation sheet", url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-equations-table.pdf", type: "doc" },
          ],
        },
      ],
    },

    /* ------------------------------------------------------ */
    {
      id: "ap-physics-c",
      name: "AP Physics C",
      blurb: "Calculus-based mechanics and electricity & magnetism for future engineers and physicists.",
      legacyUrl: "https://www.skaphysics.com/home/ap-physics-c-em",
      units: [
        {
          title: "Unit 0 · Summer Assignment",
          description: "Get ready before the year starts.",
          links: [
            { label: "Legacy course page", url: "https://www.skaphysics.com/home/ap-physics-c-em", type: "external" },
          ],
        },
        {
          title: "Mechanics · Kinematics & Dynamics",
          description: "Motion and Newton's laws with calculus.",
          links: [
            { label: "Legacy course page", url: "https://www.skaphysics.com/home/ap-physics-c-em", type: "external" },
          ],
        },
        {
          title: "Mechanics · Energy, Momentum & Rotation",
          description: "Conservation laws and rigid-body motion.",
          links: [
            { label: "Legacy course page", url: "https://www.skaphysics.com/home/ap-physics-c-em", type: "external" },
          ],
        },
        {
          title: "E&M · Electrostatics",
          description: "Charge, electric fields, Gauss's law, and potential.",
          links: [
            { label: "E&M page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-c-em", type: "external" },
          ],
        },
        {
          title: "E&M · Circuits",
          description: "Resistors, capacitors, and RC circuits.",
          links: [
            { label: "E&M page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-c-em", type: "external" },
          ],
        },
        {
          title: "E&M · Magnetism & Induction",
          description: "Magnetic fields, Ampère's law, Faraday's law, and inductance.",
          links: [
            { label: "E&M page on legacy site", url: "https://www.skaphysics.com/home/ap-physics-c-em", type: "external" },
          ],
        },
        {
          title: "AP Exam Review",
          description: "Everything you need before test day.",
          links: [
            { label: "AP Physics C: Mechanics (College Board)", url: "https://apstudents.collegeboard.org/courses/ap-physics-c-mechanics", type: "external" },
            { label: "AP Physics C: E&M (College Board)", url: "https://apstudents.collegeboard.org/courses/ap-physics-c-electricity-and-magnetism", type: "external" },
            { label: "AP Physics C equation sheet", url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-c-equations-table.pdf", type: "doc" },
          ],
        },
      ],
    },
  ],

  /* ------------------------------------------------------
     TEACHER TOOLS — hidden page. Not linked from the nav.
     Reach it by clicking the "Σ" in the footer, or going
     directly to teacher-tools.html.
     ------------------------------------------------------ */
  teacherTools: {
    links: [
      { label: "Legacy site editor (Weebly)", url: "https://www.weebly.com/login", type: "external" },
      { label: "Robotics page (legacy)", url: "https://www.skaphysics.com/robotics", type: "external" },
      { label: "Google Drive", url: "https://drive.google.com", type: "doc" },
      { label: "Google Classroom", url: "https://classroom.google.com", type: "external" },
      { label: "AP Classroom", url: "https://myap.collegeboard.org", type: "external" },
    ],
  },
};

/* Do not edit below this line. */
if (typeof module !== "undefined") module.exports = SITE_DATA;
