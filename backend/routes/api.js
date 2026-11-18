const express = require("express");
const c = require("../controllers/dataController");

const router = express.Router();

// Every :param is validated before any file is touched (see validateParams).
router.param("uni", c.validateParam("uni"));
router.param("course", c.validateParam("course"));
router.param("branch", c.validateParam("branch"));
router.param("scheme", c.validateParam("scheme"));
router.param("sem", c.validateParam("sem"));

const BRANCH = "/universities/:uni/courses/:course/branches/:branch";

router.get("/health", c.health);
router.get("/universities", c.getUniversities);
router.get("/universities/:uni/grading", c.getGrading);
router.get("/universities/:uni/courses", c.getCourses);
router.get("/universities/:uni/courses/:course/branches", c.getBranches);
router.get(`${BRANCH}/schemes`, c.getSchemes);
router.get(`${BRANCH}/schemes/:scheme/semesters`, c.getSemesters);
router.get(`${BRANCH}/schemes/:scheme/semesters/:sem/subjects`, c.getSubjects);

module.exports = router;
