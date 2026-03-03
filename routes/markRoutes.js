const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

const {
  uploadMarks,
  getTeacherMarks,
  getStudentMarks,
  deleteMark,
  uploadClassInternals
} = require("../controllers/markController");

// Teacher uploads / updates marks
router.post("/upload", protect, uploadMarks);

// Teacher views marks by semester
router.get("/semester/:semester", protect, getTeacherMarks);

// Student views own marks
router.get("/my", protect, getStudentMarks);

router.delete("/:id", protect, deleteMark);

// 📌 NEW: Fetch previously used subjects for a teacher
router.get("/subjects/:semester", protect, require("../controllers/markController").getTeacherSubjects);

// 📌 NEW: Teacher bulk uploads continuous evaluation grid
router.post("/bulk-internals", protect, uploadClassInternals);

router.post("/bulk", protect, require("../controllers/markController").bulkUpsert);
router.put("/bulk", protect, require("../controllers/markController").bulkUpsert);
router.delete("/bulk", protect, require("../controllers/markController").bulkDelete);
router.get("/table/:semester", protect, require("../controllers/markController").getMarksTable);// Teacher: get marks of one student for a semester
router.get("/student/:studentId/:semester", protect, async (req, res) => {
  try {
    const marks = await require("../models/Mark").find({
      student: req.params.studentId,
      semester: req.params.semester,
      collegeId: req.user.collegeId,
      department: req.user.department,
    });

    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});





router.delete(
  "/subject/:examId/:subjectId",
  protect,
  require("../controllers/markController").deleteSubject
);


router.put(
  "/subject/:examId/:subjectId",
  protect,
  require("../controllers/markController").updateSubject
);


module.exports = router;
