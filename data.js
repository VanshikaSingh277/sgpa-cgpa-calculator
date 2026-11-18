// ---------------------------------------------------------------------------
// University data: grade scales, percentage formulas and syllabus (subjects).
//
// To add a university: copy one block below and edit it.
// Syllabus format:  syllabus: { common: { semNo: [[subject, credits], ...] },
//                               BRANCH: { semNo: [[subject, credits], ...] } }
// "common" is used for every branch (e.g. first-year subjects); a branch entry
// for the same semester overrides it.
//
// NOTE: Subjects and credits are based on recent B.Tech schemes and can change
// between batches. Always verify against your official syllabus — every
// subject name and credit stays editable in the app.
// ---------------------------------------------------------------------------

const BRANCHES = {
  CSE: "Computer Science (CSE)",
  IT: "Information Technology (IT)",
  ECE: "Electronics & Communication (ECE)",
  EE: "Electrical (EE)",
  ME: "Mechanical (ME)",
  CE: "Civil (CE)",
};

const UNIVERSITIES = [
  {
    id: "aktu",
    short: "AKTU",
    name: "Dr. A.P.J. Abdul Kalam Technical University",
    region: "Uttar Pradesh",
    pct: { mul: 10, sub: 7.5 }, // Percentage = (CGPA − 0.75) × 10
    scale: [
      { g: "A+", marks: "90–100", p: 10 },
      { g: "A",  marks: "80–89",  p: 9 },
      { g: "B+", marks: "70–79",  p: 8 },
      { g: "B",  marks: "60–69",  p: 7 },
      { g: "C",  marks: "50–59",  p: 6 },
      { g: "D",  marks: "45–49",  p: 5 },
      { g: "E",  marks: "40–44",  p: 4 },
      { g: "F",  marks: "< 40",   p: 0 },
    ],
    syllabus: {
      common: {
        1: [
          ["Engineering Physics", 4],
          ["Engineering Mathematics-I", 4],
          ["Basic Electrical Engineering", 3],
          ["Programming for Problem Solving", 3],
          ["Soft Skills", 2],
          ["Engineering Physics Lab", 1],
          ["Basic Electrical Engineering Lab", 1],
          ["Programming for Problem Solving Lab", 1],
          ["Engineering Graphics & Design Lab", 1],
        ],
        2: [
          ["Engineering Chemistry", 4],
          ["Engineering Mathematics-II", 4],
          ["Fundamentals of Electronics Engineering", 3],
          ["Fundamentals of Mechanical Engineering", 3],
          ["Environment & Ecology", 2],
          ["Engineering Chemistry Lab", 1],
          ["Basic Electronics Engineering Lab", 1],
          ["Mechanical Workshop Lab", 1],
        ],
      },
      CSE: {
        3: [
          ["Technical Communication / Mathematics-IV", 3],
          ["Data Structures", 4],
          ["Computer Organization & Architecture", 4],
          ["Discrete Structures & Theory of Logic", 3],
          ["Universal Human Values", 3],
          ["Data Structures Lab", 1],
          ["Computer Organization Lab", 1],
          ["Discrete Structures Lab / Web Designing", 1],
          ["Mini Project / Internship", 2],
        ],
        4: [
          ["Mathematics-IV / Technical Communication", 3],
          ["Operating Systems", 4],
          ["Theory of Automata & Formal Languages", 4],
          ["Object Oriented Programming with Java", 3],
          ["Python Programming", 2],
          ["Operating Systems Lab", 1],
          ["Object Oriented Programming with Java Lab", 1],
          ["Cyber Security Workshop", 1],
        ],
      },
    },
  },
  {
    id: "rtu",
    short: "RTU",
    name: "Rajasthan Technical University",
    region: "Rajasthan",
    pct: { mul: 10, sub: 0 }, // Percentage = CGPA × 10
    scale: [
      { g: "A++", marks: "90–100", p: 10 },
      { g: "A+",  marks: "80–89",  p: 9 },
      { g: "A",   marks: "75–79",  p: 8.5 },
      { g: "B+",  marks: "70–74",  p: 8 },
      { g: "B",   marks: "65–69",  p: 7.5 },
      { g: "C+",  marks: "60–64",  p: 7 },
      { g: "C",   marks: "55–59",  p: 6.5 },
      { g: "D+",  marks: "50–54",  p: 6 },
      { g: "D",   marks: "45–49",  p: 5.5 },
      { g: "E+",  marks: "40–44",  p: 5 },
      { g: "E",   marks: "35–39",  p: 4 },
      { g: "F",   marks: "< 35",   p: 0 },
    ],
    syllabus: {
      common: {
        1: [
          ["Engineering Mathematics-I", 4],
          ["Engineering Physics", 4],
          ["Communication Skills", 2],
          ["Programming for Problem Solving", 2],
          ["Basic Civil Engineering", 2],
          ["Engineering Physics Lab", 1],
          ["Language Lab", 1],
          ["Computer Programming Lab", 1.5],
          ["Manufacturing Practices Workshop", 1.5],
          ["Computer Aided Engineering Graphics", 1.5],
          ["DECA (Extra Curricular Activities)", 0.5],
        ],
        2: [
          ["Engineering Mathematics-II", 4],
          ["Engineering Chemistry", 4],
          ["Human Values", 2],
          ["Basic Electrical Engineering", 2],
          ["Basic Mechanical Engineering", 2],
          ["Engineering Chemistry Lab", 1],
          ["Human Values Activities", 1],
          ["Basic Electrical Engineering Lab", 1],
          ["Basic Civil Engineering Lab", 1],
          ["Computer Aided Machine Drawing", 1.5],
          ["DECA (Extra Curricular Activities)", 0.5],
        ],
      },
      CSE: {
        3: [
          ["Advanced Engineering Mathematics", 3],
          ["Technical Communication", 2],
          ["Managerial Economics & Financial Accounting", 2],
          ["Digital Electronics", 3],
          ["Data Structures and Algorithms", 3],
          ["Object Oriented Programming", 3],
          ["Software Engineering", 3],
          ["Data Structures and Algorithms Lab", 1.5],
          ["Object Oriented Programming Lab", 1.5],
          ["Software Engineering Lab", 1.5],
          ["Digital Electronics Lab", 1.5],
          ["Industrial Training", 1],
          ["SODECA", 0.5],
        ],
        4: [
          ["Discrete Mathematics Structure", 3],
          ["Managerial Economics & Financial Accounting / Technical Communication", 2],
          ["Microprocessor & Interfaces", 3],
          ["Database Management System", 3],
          ["Theory of Computation", 3],
          ["Data Communication and Computer Networks", 3],
          ["Microprocessor & Interfaces Lab", 1],
          ["Database Management System Lab", 1.5],
          ["Network Programming Lab", 1.5],
          ["Linux Shell Programming Lab", 1],
          ["Java Lab", 1],
          ["SODECA", 0.5],
        ],
      },
    },
  },
  {
    id: "rgpv",
    short: "RGPV",
    name: "Rajiv Gandhi Proudyogiki Vishwavidyalaya",
    region: "Madhya Pradesh",
    pct: { mul: 10, sub: 0 },
    scale: [
      { g: "A+", marks: "91–100", p: 10 },
      { g: "A",  marks: "81–90",  p: 9 },
      { g: "B+", marks: "71–80",  p: 8 },
      { g: "B",  marks: "61–70",  p: 7 },
      { g: "C+", marks: "51–60",  p: 6 },
      { g: "C",  marks: "41–50",  p: 5 },
      { g: "D",  marks: "35–40",  p: 4 },
      { g: "F",  marks: "< 35",   p: 0 },
    ],
    syllabus: {},
  },
  {
    id: "vtu",
    short: "VTU",
    name: "Visvesvaraya Technological University",
    region: "Karnataka",
    pct: { mul: 10, sub: 7.5 },
    scale: [
      { g: "O",  marks: "90–100", p: 10 },
      { g: "A+", marks: "80–89",  p: 9 },
      { g: "A",  marks: "70–79",  p: 8 },
      { g: "B+", marks: "60–69",  p: 7 },
      { g: "B",  marks: "55–59",  p: 6 },
      { g: "C",  marks: "50–54",  p: 5 },
      { g: "P",  marks: "40–49",  p: 4 },
      { g: "F",  marks: "< 40",   p: 0 },
    ],
    syllabus: {},
  },
  {
    id: "gtu",
    short: "GTU",
    name: "Gujarat Technological University",
    region: "Gujarat",
    pct: { mul: 10, sub: 5 },
    scale: [
      { g: "AA", marks: "85–100", p: 10 },
      { g: "AB", marks: "75–84",  p: 9 },
      { g: "BB", marks: "65–74",  p: 8 },
      { g: "BC", marks: "55–64",  p: 7 },
      { g: "CC", marks: "45–54",  p: 6 },
      { g: "CD", marks: "40–44",  p: 5 },
      { g: "DD", marks: "35–39",  p: 4 },
      { g: "FF", marks: "< 35",   p: 0 },
    ],
    syllabus: {},
  },
  {
    id: "autonomous",
    short: "Autonomous / Other",
    name: "Self-autonomous college or any other university",
    region: "Custom subjects & UGC 10-point scale",
    pct: { mul: 9.5, sub: 0 },
    scale: [
      { g: "O",  marks: "90–100", p: 10 },
      { g: "A+", marks: "80–89",  p: 9 },
      { g: "A",  marks: "70–79",  p: 8 },
      { g: "B+", marks: "60–69",  p: 7 },
      { g: "B",  marks: "50–59",  p: 6 },
      { g: "C",  marks: "45–49",  p: 5 },
      { g: "P",  marks: "40–44",  p: 4 },
      { g: "F",  marks: "< 40",   p: 0 },
    ],
    syllabus: {},
  },
];

function getUniversity(id) {
  return UNIVERSITIES.find(u => u.id === id) || null;
}

// Subjects for a given university / branch / semester number, or null.
function getSyllabus(uniId, branch, semNo) {
  const u = getUniversity(uniId);
  if (!u) return null;
  const s = u.syllabus || {};
  return (s[branch] && s[branch][semNo]) || (s.common && s.common[semNo]) || null;
}
