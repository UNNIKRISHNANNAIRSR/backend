const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
    createCollege,
    joinCollege,
    getMyCollege,
} = require("../controllers/collegeController");

// Admin creates college
router.post("/create", protect, createCollege);

// Any authenticated user can join
router.post("/join", protect, joinCollege);

// Admin (and others) can get college details
router.get("/my", protect, getMyCollege);

// Get specific department details
router.get("/department/:dept", protect, require("../controllers/collegeController").getDepartmentDetails);

// Get dedicated page details
router.get("/department/:departmentName/details", protect, require("../controllers/collegeController").getDepartmentDetailsPage);

// Get explicitly formatted department summary counts
router.get("/department/:dept/summary", protect, require("../controllers/collegeController").getDepartmentSummary);

// Get strictly bounded list of semester students
router.get("/department/:dept/students/:semester", protect, require("../controllers/collegeController").getDepartmentStudentsBySemester);

// Verify college join code dynamically
router.get("/verify/:code", protect, require("../controllers/collegeController").verifyJoinCode);

// Phase 9: Remove Member securely from college
router.delete("/department/member/:userId", protect, require("../controllers/collegeController").removeMember);

// Phase 11: Department Management (Add & Edit)
router.post("/department", protect, require("../controllers/collegeController").addDepartment);
router.put("/department/:oldDept", protect, require("../controllers/collegeController").editDepartment);

// Teacher Auth Management
router.post("/teacher-auth/regenerate", protect, require("../controllers/collegeController").regenerateTeacherAuthCode);
router.post("/teacher-auth/toggle", protect, require("../controllers/collegeController").toggleTeacherRegistration);

// Semester Promotion & Pass Out
router.patch("/students/promote", protect, require("../controllers/collegeController").promoteStudents);
router.patch("/students/passout", protect, require("../controllers/collegeController").passOutStudents);

module.exports = router;
