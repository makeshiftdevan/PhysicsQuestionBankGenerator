"""All tunable constants live here so the behaviour can be retuned without
touching any logic.

The difficulty scale is intentionally data-driven: change SCALE_TOKENS and
SCALE_THRESHOLDS together and the rest of the code adapts. ExamView lets the
teacher remap or edit difficulty codes after import, so any consistent token
set works (the default is the 1/2/3 = Easy/Moderate/Hard scale ExamView ships
with).
"""

# ---------------------------------------------------------------------------
# Hard limits from the ExamView import spec
# ---------------------------------------------------------------------------

MAX_QUESTIONS_PER_BANK = 250   # ExamView hard limit; we split beyond this
MAX_TITLE_CHARS = 79           # Title / subtitle line length limit
MIN_MC_OPTIONS = 2             # An MC item with fewer real options is flagged

# ---------------------------------------------------------------------------
# ExamView RTF metadata tags (exact strings, including the colon)
# ---------------------------------------------------------------------------

TAG_ANS = "ANS:"
TAG_DIF = "DIF:"
TAG_PTS = "PTS:"
TAG_REF = "REF:"
TAG_OBJ = "OBJ:"
TAG_TOP = "TOP:"
TAG_NOT = "NOT:"
TAG_NAR = "NAR:"

# Section headers (must be on their own line, all caps, no instructions)
HEADER_MULTIPLE_CHOICE = "MULTIPLE CHOICE"
HEADER_PROBLEM = "PROBLEM"  # physics free response; ESSAY is an accepted alt.

# Default placeholder written when an answer genuinely cannot be found.
# Kept obvious so it is easy to find-and-fix in ExamView.
ANSWER_PLACEHOLDER = "[ANSWER NEEDED - not found in source]"

# Default points if the source gives none.
DEFAULT_POINTS = "1"

# ---------------------------------------------------------------------------
# Difficulty scale
# ---------------------------------------------------------------------------
# To switch to, e.g., a 1-5 scale: set SCALE_TOKENS = ("1","2","3","4","5")
# and provide one fewer threshold than there are tokens (see bucketing below).

SCALE_TOKENS = ("1", "2", "3")             # written verbatim into DIF:
SCALE_LABELS = ("Easy", "Moderate", "Hard")  # for the human-readable report
MIDDLE_TOKEN = SCALE_TOKENS[len(SCALE_TOKENS) // 2]  # used when score is unreliable

# A normalized score in [0, 1] is bucketed by these ascending cut points.
# There must be exactly len(SCALE_TOKENS) - 1 thresholds.
# score < 0.34 -> token[0]; < 0.62 -> token[1]; else token[2]
SCALE_THRESHOLDS = (0.34, 0.62)

# ---------------------------------------------------------------------------
# Difficulty signal weights (points added to the raw score)
# ---------------------------------------------------------------------------
# Stem length is only a weak tiebreaker and is never a primary driver.

W_VERB_LOW = 0.0       # recall verbs (identify, state, define, which is)
W_VERB_MED = 1.5       # computation verbs (calculate, determine, find)
W_VERB_HIGH = 3.0      # higher-order verbs (derive, explain, justify, prove)

W_SYMBOLIC = 3.0       # "in terms of", "derive an expression", variable answers
W_PER_GIVEN = 0.5      # each numeric quantity with a unit in the stem
W_GIVENS_CAP = 3.0     # cap the contribution from givens

W_PER_MATH = 0.4       # each math token (operator, fraction, exponent, root...)
W_MATH_CAP = 2.5       # cap the math-load contribution

W_PER_PART = 0.8       # each labelled part (a)(b)(c) in free response
W_PARTS_CAP = 3.0

W_SYNTHESIS = 1.5      # two or more distinct physics domains present
W_REPRESENTATION = 0.5  # "the graph shows", "the figure", "as shown"
W_NEGATIVE_PHRASING = 0.5  # NOT / LEAST / EXCEPT in the stem

W_LENGTH_TIEBREAK = 0.3   # tiny nudge for very long, multi-clause stems

# The raw score is divided by this to land roughly in [0, 1] before bucketing.
# Chosen so a hard, multi-signal question saturates near 1.0.
SCORE_NORMALIZER = 9.0

# Confidence: if fewer than this fraction of the stem's characters are
# recognizable, the extraction is treated as garbled -> middle level + flag.
GARBLED_READABLE_RATIO = 0.55
MIN_STEM_CHARS_FOR_SCORING = 12  # below this we cannot score reliably

# ---------------------------------------------------------------------------
# Difficulty signal vocabularies (lowercase; matched as whole words)
# ---------------------------------------------------------------------------

VERBS_RECALL = (
    "identify", "state", "define", "name", "list", "label", "recall",
    "which is", "what is the name", "select", "choose",
)
VERBS_COMPUTE = (
    "calculate", "determine", "find", "compute", "solve", "evaluate the value",
    "how much", "how far", "how fast", "how long", "what is the value",
)
VERBS_HIGH = (
    "derive", "explain", "justify", "prove", "rank", "compare", "design",
    "evaluate", "analyze", "analyse", "predict", "estimate and justify",
    "describe how", "show that",
)

SYMBOLIC_CUES = (
    "in terms of", "express", "derive an expression", "derive a formula",
    "starting from newton", "symbolic", "as a function of",
)

REPRESENTATION_CUES = (
    "the graph shows", "the graph", "the figure", "the diagram",
    "as shown", "shown above", "shown below", "the plot", "the picture",
)

NEGATIVE_PHRASING = ("not", "least", "except", "never", "incorrect")

# Distinct physics domains for the synthesis signal. Each tuple is a domain;
# keywords are matched as substrings (lowercased).
PHYSICS_DOMAINS = {
    "kinematics": ("velocity", "acceleration", "displacement", "projectile",
                   "kinematic", "free fall", "speed"),
    "forces": ("force", "newton", "friction", "tension", "normal force",
               "free-body", "free body"),
    "energy": ("energy", "work", "power", "joule", "kinetic", "potential"),
    "momentum": ("momentum", "impulse", "collision", "recoil"),
    "rotation": ("torque", "angular", "moment of inertia", "rotational",
                 "rolling"),
    "gravitation": ("gravitation", "orbit", "kepler", "gravitational field"),
    "circular_motion": ("centripetal", "circular motion", "uniform circular"),
    "center_of_mass": ("center of mass", "centre of mass", "centroid"),
    "circuits": ("resistor", "capacitor", "circuit", "ohm", "voltage",
                 "current", "emf"),
    "fields": ("electric field", "magnetic field", "charge", "coulomb",
               "flux"),
    "induction": ("induction", "inductor", "faraday", "lenz", "induced emf"),
    "thermo": ("temperature", "heat", "thermal", "entropy", "ideal gas"),
    "waves": ("wavelength", "frequency", "amplitude", "interference",
              "harmonic", "oscillation", "pendulum"),
    "optics": ("refraction", "reflection", "lens", "mirror", "diffraction"),
}

# Math tokens / characters that indicate math load.
MATH_SYMBOLS = ("=", "+", "/", "^", "×", "·", "∫", "∂", "√", "≈", "≤", "≥",
                "Δ", "∑", "π", "θ", "ω", "α", "β", "<", ">")
MATH_FUNCTIONS = ("sin", "cos", "tan", "log", "ln", "sqrt", "exp")

# ---------------------------------------------------------------------------
# Boilerplate / non-question patterns (used by the cleaner)
# ---------------------------------------------------------------------------
# These are regular-expression source strings, compiled in cleaner.py.

BOILERPLATE_PATTERNS = (
    r"^\s*page\s+\d+\s+of\s+\d+\s*$",            # Page X of Y
    r"^\s*page\s+\d+\s*$",                          # Page X
    r"^\s*\d+\s*$",                                  # a lone page number line
    r"^\s*\d+\s*point[s]?\s*:?\s*$",               # "1 point:" / "4 points"
    r"^\s*part\s+[a-z]\.?\s*\[\s*\d+\s*-\s*\d+\s*\]\s*$",  # Part a. [0-4]
    r"^\s*(?:\d+\s+){1,}\d+\s*$",                  # scoring row "0 1 2 3 4 5"
    r"^\s*the student response earns all of the following points.*$",
    r"^\s*copyright\b.*$",
    r"^\s*©.*$",
    r"^\s*all rights reserved.*$",
)

# A line is a candidate repeating header/footer if it shows up on at least
# this fraction of pages.
REPEAT_HEADER_FRACTION = 0.5

# ---------------------------------------------------------------------------
# Output locations
# ---------------------------------------------------------------------------

APP_DIR_NAME = "PhysicsQuestionBankGenerator"  # under APPDATA / ~/.config
OUTPUT_SUBDIR = "output"
