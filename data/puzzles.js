/* ============================================================
   SKANECTIONS PUZZLES — edit this file to add puzzles.
   ============================================================

   HOW TO ADD A PUZZLE:

   1. Copy an entire puzzle block below (from "{" to "},").
   2. Give it a new unique "id" and a "title".
   3. Fill in exactly 4 groups, each with exactly 4 words.
   4. Order the groups from easiest (top) to hardest (bottom) —
      that order sets the difficulty shading when solved.
   5. Save. The game picks it up automatically and rotates a
      "puzzle of the day" through the list by date.

   Tip: the Puzzle Builder on the Teacher Tools page writes
   this snippet for you — fill in the form and copy the output.

   Rules the game enforces (so you don't have to):
   - every word must be unique within a puzzle
   - exactly 4 groups of 4
   ============================================================ */

const SKANECTIONS_PUZZLES = [
  {
    id: "kinematics-classics",
    title: "Kinematics Classics",
    groups: [
      { name: "Scalar quantities", words: ["Speed", "Distance", "Mass", "Time"] },
      { name: "Vector quantities", words: ["Velocity", "Displacement", "Acceleration", "Force"] },
      { name: "SI base units", words: ["Meter", "Second", "Kilogram", "Ampere"] },
      { name: "Famous physicists", words: ["Newton", "Galileo", "Einstein", "Kepler"] },
    ],
  },
  {
    id: "energy-and-friends",
    title: "Energy & Friends",
    groups: [
      { name: "Forms of energy", words: ["Kinetic", "Potential", "Thermal", "Elastic"] },
      { name: "Measured in joules", words: ["Work", "Heat", "Energy", "Torque"] },
      { name: "Simple machines", words: ["Lever", "Pulley", "Wedge", "Screw"] },
      { name: "___ of conservation", words: ["Momentum", "Charge", "Mass-energy", "Angular momentum"] },
    ],
  },
  {
    id: "circuits-night",
    title: "Circuit Night",
    groups: [
      { name: "Circuit components", words: ["Resistor", "Capacitor", "Battery", "Switch"] },
      { name: "Electrical units", words: ["Volt", "Ohm", "Farad", "Watt"] },
      { name: "Laws & rules", words: ["Ohm's", "Kirchhoff's", "Coulomb's", "Faraday's"] },
      { name: "Things that can be 'in parallel'", words: ["Lines", "Circuits", "Parking", "Universes"] },
    ],
  },
  {
    id: "waves-wordplay",
    title: "Waves & Wordplay",
    groups: [
      { name: "Wave properties", words: ["Amplitude", "Frequency", "Wavelength", "Period"] },
      { name: "Wave behaviors", words: ["Reflection", "Refraction", "Diffraction", "Interference"] },
      { name: "Electromagnetic spectrum", words: ["Radio", "Microwave", "Infrared", "Ultraviolet"] },
      { name: "Types of 'waves'", words: ["Sound", "Heat", "Crime", "Micro"] },
    ],
  },
];

/* Do not edit below this line. */
if (typeof module !== "undefined") module.exports = SKANECTIONS_PUZZLES;
