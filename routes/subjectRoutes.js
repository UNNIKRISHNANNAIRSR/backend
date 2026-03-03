const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
    createSubject,
    getDepartmentSubjects,
    deleteSubject,
    getMySubjects
} = require("../controllers/subjectController");

// Admin creates a Subject (assigns Teacher ID)
router.post("/create", protect, createSubject);

// Admin fetches all Subjects assigned to a specific Department & Semester
router.get("/department/:department/semester/:semester", protect, getDepartmentSubjects);

// Admin deletes a Subject
router.delete("/:id", protect, deleteSubject);

// Teacher fetches ONLY Subjects distinctly assigned to their User ID for a Semester
router.get("/my/:semester", protect, getMySubjects);

module.exports = router;
