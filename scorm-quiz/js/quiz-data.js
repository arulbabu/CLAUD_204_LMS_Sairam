// Construction Safety Quiz — 5 questions with real photos (source: L&T Sairam Quiz Images)
var QUIZ_QUESTIONS = [
  {
    category: "PPE",
    question: "What is the primary purpose of a hard hat on a construction site?",
    image: "assets/images/q1.png",
    imageCaption: "",
    options: {
      A: "To protect the head from falling or flying objects",
      B: "To keep the sun off the worker's face",
      C: "To identify the worker's department",
      D: "To improve ventilation while working"
    },
    correct: "A"
  },
  {
    category: "Work at Height",
    question: "When placing an extension ladder against a wall, what is the safe angle (the 4:1 rule)?",
    image: "assets/images/q10.png",
    imageCaption: "",
    options: {
      A: "About 45 degrees",
      B: "About 75 degrees (1 foot out for every 4 feet of height)",
      C: "Completely vertical (90 degrees)",
      D: "Any angle is fine as long as it touches the wall"
    },
    correct: "B"
  },
  {
    category: "Work at Height",
    question: "How many points of contact should a worker maintain while climbing a ladder?",
    image: "assets/images/q13.png",
    imageCaption: "",
    options: {
      A: "One hand, one foot",
      B: "Three points of contact at all times (two hands + one foot, or two feet + one hand)",
      C: "It doesn't matter as long as you climb fast",
      D: "Zero — you can carry tools in both hands while climbing"
    },
    correct: "B"
  },
  {
    category: "Scaffolding",
    question: "What must a scaffold's base rest on?",
    image: "assets/images/q33.png",
    imageCaption: "",
    options: {
      A: "Loose soil with no support",
      B: "A level, sound footing such as base plates or mud sills",
      C: "Stacked bricks that are not fixed",
      D: "Anything available, stability doesn't matter"
    },
    correct: "B"
  },
  {
    category: "Electrical",
    question: "What is the minimum safe clearance distance for equipment working near overhead power lines (up to 50kV)?",
    image: "assets/images/q26.png",
    imageCaption: "",
    options: {
      A: "About 3 m / 10 feet",
      B: "30 cm / 1 foot",
      C: "No clearance is required if the operator is careful",
      D: "Only 1 m is enough for any voltage"
    },
    correct: "A"
  }
];

var TIME_PER_QUESTION = 30;
