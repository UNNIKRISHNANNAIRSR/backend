const Mark = require("../models/Mark");
const User = require("../models/User");


// ============================
// 📌 UPLOAD / UPDATE MARKS
// ============================
exports.uploadMarks = async (req, res) => {
  try {
    const { studentId, semester, examType, subject, marks, cgpa, grade } = req.body;


    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    // Validate student
    const student = await User.findOne({
      _id: studentId,
      role: "student",
      groupId: req.user.groupId,
    });

    if (!student) {
      return res.status(400).json({ message: "Invalid student" });
    }

    if (student.department !== req.user.department) {
      return res.status(403).json({ message: "Department mismatch" });
    }

  let record = await Mark.findOne({
  student: student._id,
  semester: semester,   // ✅ use selected semester
  examType,
  groupId: req.user.groupId,
});


    if (!record) {
    record = new Mark({
  student: student._id,
  semester: semester,   // ✅ use selected semester
  department: student.department,
  examType,
  subjects: [],
  groupId: req.user.groupId,
});

    }

    // Subject handling
    const existing = record.subjects.find(
      (s) =>
        s.subject === subject &&
        s.uploadedBy.toString() === req.user._id.toString()
    );

    if (existing) {
      existing.marks = marks;
    } else {
      record.subjects.push({
        subject,
        marks,
        uploadedBy: req.user._id,
      });
    }

    // ✅ CGPA & Grade ONLY for Main Exam
    if (examType === "Main Exam") {
      if (cgpa !== undefined) record.cgpa = cgpa;
      if (grade !== undefined) record.grade = grade;
    }

    await record.save();

    res.json({
      message: "Marks uploaded successfully",
      data: record,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ============================
// 📌 TEACHER VIEW MARKS
// ============================
exports.getTeacherMarks = async (req, res) => {
  try {
    const semester = req.params.semester;

    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const marks = await Mark.find({
      semester,
      department: req.user.department,
      groupId: req.user.groupId,
    }).populate("student", "name email rollNo");

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ============================
// 📌 STUDENT VIEW OWN MARKS
// ============================
exports.getStudentMarks = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const marks = await Mark.find({
      student: req.user._id,
      groupId: req.user.groupId,
    });

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMark = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    const mark = await Mark.findOne({
      _id: req.params.id,
      groupId: req.user.groupId,
      department: req.user.department,
    });

    if (!mark) {
      return res.status(404).json({ message: "Mark record not found" });
    }

    await mark.deleteOne();

    res.json({ message: "Mark record deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ============================
// 📌 DELETE SINGLE SUBJECT
// ============================
// exports.deleteSubject = async (req, res) => {
//   try {
//     if (req.user.role !== "teacher") {
//       return res.status(403).json({ message: "Only teachers allowed" });
//     }

//     const { examId, subjectId } = req.params;

//     const record = await Mark.findOne({
//       _id: examId,
//       groupId: req.user.groupId,
//       department: req.user.department,
//     });

//     if (!record) {
//       return res.status(404).json({ message: "Exam record not found" });
//     }

//     record.subjects = record.subjects.filter(
//       (sub) => sub._id.toString() !== subjectId
//     );

//     await record.save();

//     res.json({ message: "Subject deleted successfully" });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



exports.deleteSubject = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    const { examId, subjectId } = req.params;

    const record = await Mark.findOne({
      _id: examId,
      groupId: req.user.groupId,
      department: req.user.department,
    });

    if (!record) {
      return res.status(404).json({ message: "Exam record not found" });
    }

    const subject = record.subjects.id(subjectId);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // 🔐 CRITICAL SECURITY CHECK
    if (subject.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can delete only your own uploaded subjects",
      });
    }

    subject.deleteOne();

    await record.save();

    res.json({ message: "Subject deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ============================
// 📌 UPDATE SINGLE SUBJECT MARK
// ============================
// exports.updateSubject = async (req, res) => {
//   try {
//     if (req.user.role !== "teacher") {
//       return res.status(403).json({ message: "Only teachers allowed" });
//     }

//     const { examId, subjectId } = req.params;
//     const { marks } = req.body;

//     const record = await Mark.findOne({
//       _id: examId,
//       groupId: req.user.groupId,
//       department: req.user.department,
//     });

//     if (!record) {
//       return res.status(404).json({ message: "Exam record not found" });
//     }

//     const subject = record.subjects.id(subjectId);

//     if (!subject) {
//       return res.status(404).json({ message: "Subject not found" });
//     }

//     subject.marks = Number(marks);

//     await record.save();

//     res.json({ message: "Subject updated successfully" });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };




exports.updateSubject = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers allowed" });
    }

    const { examId, subjectId } = req.params;
    const { marks } = req.body;

    const record = await Mark.findOne({
      _id: examId,
      groupId: req.user.groupId,
      department: req.user.department,
    });

    if (!record) {
      return res.status(404).json({ message: "Exam record not found" });
    }

    const subject = record.subjects.id(subjectId);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // 🔐 CRITICAL SECURITY CHECK
    if (subject.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can update only your own uploaded subjects",
      });
    }

    subject.marks = Number(marks);

    await record.save();

    res.json({ message: "Subject updated successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};