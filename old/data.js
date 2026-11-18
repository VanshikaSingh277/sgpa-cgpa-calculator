// ---------------------------------------------------------------------------
// University data: grade scales, percentage formulas and syllabus (subjects).
//
// To add a university: copy one block below and edit it.
// Syllabus format:  syllabus: { common: { semNo: [[subject, credits], ...] },
//                               BRANCH: { semNo: [[subject, credits], ...] } }
// "common" is used for every branch (e.g. first-year subjects); a branch entry
// for the same semester overrides it.
// A semester can also be { "Group name": [...], "Other group": [...] } when
// students are split into groups (e.g. RTU 1st year); the first one is default.
// Add  syllabusNote: "..."  to a university to say where its subjects come from.
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

// RTU 1st year (common to all branches). Codes start with 1FY in sem 1, 2FY in sem 2.
function rtuFirstYear(sem, group) {
  const p = sem + "FY";
  const math = sem === 1 ? "Engineering Mathematics-I" : "Engineering Mathematics-II";
  if (group === "physics") return [
    [p + "2-01 " + math, 4],
    [p + "2-02 Engineering Physics", 4],
    [p + "1-04 Communication Skills", 2],
    [p + "3-06 Programming for Problem Solving", 2],
    [p + "3-08 Basic Electrical Engineering", 2],
    [p + "2-20 Engineering Physics Lab", 1],
    [p + "1-22 Language Lab", 1],
    [p + "3-24 Computer Programming Lab", 1.5],
    [p + "3-26 Basic Electrical Engineering Lab", 1],
    [p + "3-28 Computer Aided Engineering Graphics", 1.5],
    ["1FY8-00 Social Outreach, Discipline & Extra Curricular Activities", 0.5],
  ];
  return [
    [p + "2-01 " + math, 4],
    [p + "2-03 Engineering Chemistry", 4],
    [p + "1-05 Human Values", 2],
    [p + "3-07 Basic Mechanical Engineering", 2],
    [p + "3-09 Basic Civil Engineering", 2],
    [p + "2-21 Engineering Chemistry Lab", 1],
    [p + "1-23 Human Values Activities", 1],
    [p + "3-25 Manufacturing Practices Workshop", 1.5],
    [p + "3-27 Basic Civil Engineering Lab", 1],
    [p + "3-29 Computer Aided Machine Drawing", 1.5],
    ["1FY8-00 Social Outreach, Discipline & Extra Curricular Activities", 0.5],
  ];
}

const UNIVERSITIES = [
  {
    id: "aktu",
    short: "AKTU",
    name: "Dr. A.P.J. Abdul Kalam Technical University",
    region: "Uttar Pradesh",
    pct: { mul: 10, sub: 7.5 }, // Percentage = (CGPA − 0.75) × 10
    syllabusNote: "AKTU subjects are approximate and not yet verified against the official AKTU scheme.",
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
    syllabusNote: "RTU scheme for students admitted 2018-19 onwards (CSE semesters 3–8 and the common 1st year), taken from the RTU scheme PDF published by SKIT Jaipur, an RTU-affiliated college.",
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
      // 1st year: students are split into two groups that swap subjects in sem 2.
      common: {
        1: { "Physics group": rtuFirstYear(1, "physics"), "Chemistry group": rtuFirstYear(1, "chemistry") },
        2: { "Chemistry group": rtuFirstYear(2, "chemistry"), "Physics group": rtuFirstYear(2, "physics") },
      },
      CSE: {
        3: [
          ["3CS2-01 Advanced Engineering Mathematics", 3],
          ["3CS1-02/03 Technical Communication / Managerial Economics & Financial Accounting", 2],
          ["3CS3-04 Digital Electronics", 3],
          ["3CS4-05 Data Structures and Algorithms", 3],
          ["3CS4-06 Object Oriented Programming", 3],
          ["3CS4-07 Software Engineering", 3],
          ["3CS4-21 Data Structures and Algorithms Lab", 1.5],
          ["3CS4-22 Object Oriented Programming Lab", 1.5],
          ["3CS4-23 Software Engineering Lab", 1.5],
          ["3CS4-24 Digital Electronics Lab", 1.5],
          ["3CS7-30 Industrial Training", 1],
          ["3CS8-00 Social Outreach, Discipline & Extra Curricular Activities", 0.5],
        ],
        4: [
          ["4CS2-01 Discrete Mathematics Structure", 3],
          ["4CS1-03/02 Managerial Economics & Financial Accounting / Technical Communication", 2],
          ["4CS3-04 Microprocessor & Interfaces", 3],
          ["4CS4-05 Database Management System", 3],
          ["4CS4-06 Theory of Computation", 3],
          ["4CS4-07 Data Communication and Computer Networks", 3],
          ["4CS4-21 Microprocessor & Interfaces Lab", 1],
          ["4CS4-22 Database Management System Lab", 1.5],
          ["4CS4-23 Network Programming Lab", 1.5],
          ["4CS4-24 Linux Shell Programming Lab", 1],
          ["4CS4-25 Java Lab", 1],
          ["4CS8-00 Social Outreach, Discipline & Extra Curricular Activities", 0.5],
        ],
        5: [
          ["5CS3-01 Information Theory & Coding", 2],
          ["5CS4-02 Compiler Design", 3],
          ["5CS4-03 Operating System", 3],
          ["5CS4-04 Computer Graphics & Multimedia", 3],
          ["5CS4-05 Analysis of Algorithms", 3],
          ["5CS5-1x Professional Elective 1 (Wireless Communication / Human-Computer Interaction / Bioinformatics)", 2],
          ["5CS4-21 Computer Graphics & Multimedia Lab", 1],
          ["5CS4-22 Compiler Design Lab", 1],
          ["5CS4-23 Analysis of Algorithms Lab", 1],
          ["5CS4-24 Advance Java Lab", 1],
          ["5CS7-30 Industrial Training", 2.5],
          ["5CS8-00 Social Outreach, Discipline & Extra Curricular Activities", 0.5],
        ],
        6: [
          ["6CS3-01 Digital Image Processing", 2],
          ["6CS4-02 Machine Learning", 3],
          ["6CS4-03 Information Security System", 2],
          ["6CS4-04 Computer Architecture and Organization", 3],
          ["6CS4-05 Artificial Intelligence", 2],
          ["6CS4-06 Cloud Computing", 3],
          ["6CS5-1x Professional Elective (Distributed System / Software Defined Network / Ecommerce and ERP)", 2],
          ["6CS4-21 Digital Image Processing Lab", 1.5],
          ["6CS4-22 Machine Learning Lab", 1.5],
          ["6CS4-23 Python Lab", 1.5],
          ["6CS4-24 Mobile Application Development Lab", 1.5],
          ["6CS8-00 Social Outreach, Discipline & Extra Curricular Activities", 0.5],
        ],
        7: [
          ["7CS4-01 Internet of Things", 3],
          ["Open Elective - I", 3],
          ["7CS4-21 Internet of Things Lab", 2],
          ["7CS4-22 Cyber Security Lab", 2],
          ["7CS7-30 Industrial Training", 2.5],
          ["7CS7-40 Seminar", 2],
          ["7CS8-00 Social Outreach, Discipline & Extra Curricular Activities", 0.5],
        ],
        8: [
          ["8CS4-01 Big Data Analytics", 3],
          ["Open Elective - II", 3],
          ["8CS4-21 Big Data Analytics Lab", 1],
          ["8CS4-22 Software Testing and Validation Lab", 1],
          ["8CS7 Project", 7],
          ["8CS8-00 Social Outreach, Discipline & Extra Curricular Activities", 0.5],
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

// Raw syllabus entry for a semester: an array, a { group: array } object, or null.
function getSyllabusEntry(uniId, branch, semNo) {
  const u = getUniversity(uniId);
  if (!u) return null;
  const s = u.syllabus || {};
  return (s[branch] && s[branch][semNo]) || (s.common && s.common[semNo]) || null;
}

// Group names for a semester (empty if it has no groups).
function getSyllabusGroups(uniId, branch, semNo) {
  const e = getSyllabusEntry(uniId, branch, semNo);
  return e && !Array.isArray(e) ? Object.keys(e) : [];
}

// Subjects for a semester ([[name, credits], ...]) or null. Picks the given group, else the first.
function getSyllabus(uniId, branch, semNo, group) {
  const e = getSyllabusEntry(uniId, branch, semNo);
  if (!e || Array.isArray(e)) return e;
  return e[group] || e[Object.keys(e)[0]];
}
