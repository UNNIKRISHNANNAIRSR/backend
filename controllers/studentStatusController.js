const User = require("../models/User");

/* ==============================
   📌 BULK PROMOTE STUDENTS
================================ */
exports.promoteStudents = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins allowed" });
    }

    const { studentIds } = req.body;

    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ message: "No students selected" });
    }

    const students = await User.find({
      _id: { $in: studentIds },
      role: "student",
      collegeId: req.user.collegeId,
    });

    for (let student of students) {
      if (!student.semester) continue;

      const currentSem = parseInt(student.semester.replace("S", ""));
      const nextSem = currentSem + 1;

      // ✅ Rule: ONLY update current_semester. No marks touched.
      student.semester = `S${nextSem}`;
      await student.save();
    }

    res.json({ message: "Students promoted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ==============================
   📌 BULK REMOVE FROM GROUP
================================ */
exports.removeStudents = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins allowed" });
    }

    const { studentIds } = req.body;

    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ message: "No students selected" });
    }

    await User.updateMany(
      {
        _id: { $in: studentIds },
        role: "student",
        collegeId: req.user.collegeId,
      },
      {
        $set: {
          semester: null,
          department: null,
          registerNumber: null,
          collegeId: null,
        },
      }
    );

    res.json({ message: "Students removed from group successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
