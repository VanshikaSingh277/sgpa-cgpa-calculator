# SGPA & CGPA Calculator

Calculate SGPA, CGPA and percentage for AKTU, RTU, RGPV, VTU, GTU and autonomous college students.

- **Pick your university first:** each one has its own grade scale and percentage formula
- **Pick your branch:** subjects and credits fill in from the syllabus where it's available (AKTU & RTU: 1st year for all branches, 2nd year for CSE)
- **Autonomous / Other:** uses the UGC 10-point scale; you enter your own subjects
- Subject-wise mode: subjects, credits and grades for each semester
- Quick mode: enter SGPA + credits per semester to get CGPA
- You can edit the grade scale, percentage formula and every subject; your data is saved in the browser
- Works on mobile, light and dark mode

**Add or fix a syllabus:** edit `data.js`. Each university has a `scale`, a `pct` formula and a `syllabus` object.

**Tech:** HTML, CSS, JavaScript (no frameworks)

**Live demo:** https://YOUR-USERNAME.github.io/sgpa-cgpa-calculator/
