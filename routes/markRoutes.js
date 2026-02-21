const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

const {
  uploadMarks,
  getTeacherMarks,
  getStudentMarks,
  deleteMark
} = require("../controllers/markController");

// Teacher uploads / updates marks
router.post("/upload", protect, uploadMarks);

// Teacher views marks by semester
router.get("/semester/:semester", protect, getTeacherMarks);

// Student views own marks
router.get("/my", protect, getStudentMarks);

router.delete("/:id", protect, deleteMark);


// Teacher: get marks of one student for a semester
router.get("/student/:studentId/:semester", protect, async (req, res) => {
  try {
    const marks = await require("../models/Mark").find({
      student: req.params.studentId,
      semester: req.params.semester,
      groupId: req.user.groupId,
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
