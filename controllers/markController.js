const Mark = require("../models/Mark");
const User = require("../models/User");

const getSemNum = (sem) => {
  if (!sem) return 0;
  return parseInt(sem.toString().replace(/\D/g, ""), 10) || 0;
};

const validateMarkLimit = (examType, marks) => {
  const m = Number(marks);
  if (isNaN(m) || m < 0) return { valid: false, message: "Invalid mark value" };

  const type = String(examType || "");
  if (type.includes("Assignment")) {
    if (m > 10) return { valid: false, message: "Assignment marks cannot exceed 10" };
  } else if (type.includes("Series")) {
    if (m > 20) return { valid: false, message: "Series marks cannot exceed 20" };
  }
  return { valid: true };
};

// ============================
// 📌 UPLOAD / UPDATE MARKS
// ============================
exports.uploadMarks = async (req, res) => {
  try {
    const { studentId, semester, examType, subject, marks, cgpa, grade } = req.body;

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins allowed" });
    }

    // Validate student
    const student = await User.findOne({
      _id: studentId,
      collegeId: req.user.collegeId,
    });

    if (!student) {
      return res.status(400).json({ message: "Invalid student" });
    }

    if (req.user.role === "teacher" && student.department !== req.user.department) {
      return res.status(403).json({ message: "Department mismatch" });
    }

    // 🔒 PERMISSION LOGIC (Phase 20)
    const reqSemNum = getSemNum(semester);
    const stuSemNum = getSemNum(student.semester);

    if (req.user.role === "teacher") {
      if (reqSemNum !== stuSemNum) {
        return res.status(403).json({ message: `Teachers can only upload marks for the current semester (S${stuSemNum})` });
      }
    } else if (req.user.role === "admin") {
      if (reqSemNum >= stuSemNum) {
        return res.status(403).json({ message: `Admins can only upload marks for previous semesters (Backlog). Student is already in S${stuSemNum}` });
      }
    }

    // 🔒 MARK LIMIT VALIDATION
    const validation = validateMarkLimit(examType, marks);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    let record = await Mark.findOne({
      student: student._id,
      semester: semester,
      collegeId: req.user.collegeId,
    });

    if (!record) {
      record = new Mark({
        student: student._id,
        semester: semester,
        department: student.department,
        examType,
        collegeId: req.user.collegeId,
      });
    }

    // Subject handling: Allow admins to overwrite anyone, teachers overwrite their own
    const existing = record.subjects.find(
      (s) => s.subject === subject && (req.user.role === "admin" || s.uploadedBy.toString() === req.user.id.toString())
    );

    if (existing) {
      existing.marks = marks;
      existing.uploadedBy = req.user.id;
    } else {
      record.subjects.push({
        subject,
        marks,
        uploadedBy: req.user.id,
      });
    }

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
// 📌 TEACHER / ADMIN VIEW MARKS
// ============================
exports.getTeacherMarks = async (req, res) => {
  try {
    const semester = req.params.semester;

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const marks = await Mark.find({
      semester,
      collegeId: req.user.collegeId,
    }).populate("student", "name email registerNumber");

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
      student: req.user.id,
      collegeId: req.user.collegeId,
    });

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMark = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins allowed" });
    }

    const filter = {
      collegeId: req.user.collegeId,
    };
    if (req.user.role === "teacher") filter.department = req.user.department;

    const mark = await Mark.findOne(filter);

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
exports.deleteSubject = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins allowed" });
    }

    const { examId, subjectId } = req.params;

    const record = await Mark.findOne({
      _id: examId,
      collegeId: req.user.collegeId,
    });

    if (!record) {
      return res.status(404).json({ message: "Exam record not found" });
    }

    const subject = record.subjects.id(subjectId);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (req.user.role === "teacher" && subject.uploadedBy.toString() !== req.user.id.toString()) {
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
exports.updateSubject = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins allowed" });
    }

    const { examId, subjectId } = req.params;
    const { marks } = req.body;

    const record = await Mark.findOne({
      _id: examId,
      collegeId: req.user.collegeId,
    });

    if (!record) {
      return res.status(404).json({ message: "Exam record not found" });
    }

    const subject = record.subjects.id(subjectId);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (req.user.role === "teacher" && subject.uploadedBy.toString() !== req.user.id.toString()) {
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

exports.bulkUpsert = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") return res.status(403).json({ message: "Only teachers or admins allowed" });
    const operations = Array.isArray(req.body) ? req.body : req.body.records;
    if (!operations || !Array.isArray(operations)) return res.status(400).json({ message: "Expected array of records" });

    for (let op of operations) {
      const { studentId, subject, examType, marks, cgpa, grade, semester } = op;
      if (!studentId || marks === undefined) continue;

      const student = await User.findOne({ _id: studentId, role: "student", collegeId: req.user.collegeId });
      if (!student) continue;
      if (req.user.role === "teacher" && student.department !== req.user.department) continue;

      // 🔒 PERMISSION LOGIC (Phase 20)
      const reqSemNum = getSemNum(semester);
      const stuSemNum = getSemNum(student.semester);

      if (req.user.role === "teacher") {
        if (reqSemNum !== stuSemNum) continue;
      } else if (req.user.role === "admin") {
        if (reqSemNum >= stuSemNum) continue;
      }

      // 🔒 MARK LIMIT VALIDATION
      const validation = validateMarkLimit(examType, marks);
      if (!validation.valid) continue;

      let record = await Mark.findOne({
        student: student._id,
        semester,
        examType,
        collegeId: req.user.collegeId
      });

      if (!record) {
        record = new Mark({
          student: student._id, semester, department: student.department,
          examType, subjects: [], collegeId: req.user.collegeId
        });
      }

      const existing = (record.subjects || []).find(s => s.subject === subject && (req.user.role === "admin" || (s.uploadedBy && s.uploadedBy.toString() === req.user.id.toString())));
      if (existing) {
        existing.marks = marks;
        existing.uploadedBy = req.user.id;
      } else {
        record.subjects.push({ subject, marks, uploadedBy: req.user.id });
      }

      if (examType === "Main Exam") {
        if (cgpa !== undefined) record.cgpa = cgpa;
        if (grade !== undefined) record.grade = grade;
      }
      await record.save();
    }
    res.json({ message: "Bulk records saved successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bulkDelete = async (req, res) => {
  res.json({ message: "Bulk delete not fully implemented yet" });
};

exports.getMarksTable = async (req, res) => {
  try {
    const { semester } = req.params;
    const { subject, includeHigher, department, targetStudentId } = req.query; // optional filters
    const cleanSem = semester.toString().replace(/\D/g, '');
    const targetSemNum = parseInt(cleanSem, 10);
    if (req.user.role !== "teacher" && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    let studentFilter = {
      role: "student",
      department: department || req.user.department,
      collegeId: req.user.collegeId
    };

    // SECURITY: Only admins can use includeHigher for backlog entry
    const canIncludeHigher = includeHigher === "true" && req.user.role === "admin";

    let students;
    if (targetStudentId) {
      students = await User.find({ _id: targetStudentId, collegeId: req.user.collegeId });
    } else if (canIncludeHigher) {
      const allStudents = await User.find(studentFilter);
      students = allStudents.filter(st => {
        const stSem = getSemNum(st.semester);
        return stSem >= targetSemNum;
      });
    } else {
      students = await User.find({
        ...studentFilter,
        semester: { $in: [semester, cleanSem, `S${cleanSem}`] }
      });
    }

    const marks = await Mark.find({
      student: { $in: students.map(s => s._id) },
      semester: { $in: [semester, cleanSem, `S${cleanSem}`] },
      collegeId: req.user.collegeId
    });

    const typesMap = {
      "Assignment 1": "A1",
      "Assignment 2": "A2",
      "Series 1": "S1",
      "Series 2": "S2",
      "Main Exam": "ME"
    };

    const formatted = students.map(st => {
      const stMarks = marks.filter(m => m.student.toString() === st._id.toString());
      const row = {
        studentId: st._id,
        name: st.name,
        registerNumber: st.registerNumber,
      };

      stMarks.forEach(record => {
        const typeKey = typesMap[record.examType] || record.examType;

        // If subject is provided, only return marks for THAT subject
        // If NO subject is provided (targetStudentId mode), we need to return all marks for the row.
        // Wait, the row only has ONE student. But it has MANY subjects.
        // We'll return an array of subject marks instead of flattening if no subject is provided.

        if (subject) {
          const subRecord = (record.subjects || []).find(s => s.subject === subject);
          if (subRecord) row[typeKey] = subRecord.marks;
        } else {
          // Flatten into row as { subjectName_examType: marks } or just keep it simple for now
          // For the Admin screen, we actually need to pre-fill marks per subject.
          // Let's add a "marksData" object to the row
          if (!row.marksData) row.marksData = {};
          (record.subjects || []).forEach(sub => {
            if (!row.marksData[sub.subject]) row.marksData[sub.subject] = {};
            row.marksData[sub.subject][typeKey] = sub.marks;
          });
        }

        if (record.examType === "Main Exam" && record.grade) {
          row.grade = record.grade;
        }
      });

      const stSemNum = getSemNum(st.semester);
      if (stSemNum > targetSemNum) {
        row.isHistorical = true;
        row.currentSemester = st.semester;
      }

      return row;
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================
// 📌 BULK UPLOAD INTERNAL MARKS
// ============================
exports.uploadClassInternals = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins allowed" });
    }

    const { semester, subject, internals } = req.body;

    if (!semester || !subject || !Array.isArray(internals)) {
      return res.status(400).json({ message: "Invalid payload format" });
    }

    const examTypesArr = [
      { key: "A1", dbName: "Assignment 1" },
      { key: "A2", dbName: "Assignment 2" },
      { key: "SER1", dbName: "Series 1" },
      { key: "SER2", dbName: "Series 2" },
    ];

    const bulkWrites = [];

    for (const studentRow of internals) {
      for (const examData of examTypesArr) {
        const markVal = studentRow[examData.key];
        if (markVal === undefined || markVal === null || markVal === "") continue;

        const valParsed = parseFloat(markVal);
        if (isNaN(valParsed)) continue;

        const student = await User.findById(studentRow.studentId);
        if (!student) continue;

        // 🔒 PERMISSION LOGIC (Phase 20)
        const reqSemNum = getSemNum(semester);
        const stuSemNum = getSemNum(student.semester);

        if (req.user.role === "teacher") {
          if (reqSemNum !== stuSemNum) continue;
        } else if (req.user.role === "admin") {
          if (reqSemNum >= stuSemNum) continue;
        }

        // 🔒 MARK LIMIT VALIDATION
        const validation = validateMarkLimit(examData.dbName, valParsed);
        if (!validation.valid) continue;

        const filter = {
          student: studentRow.studentId,
          semester: semester,
          examType: examData.dbName,
          collegeId: req.user.collegeId,
        };

        const updateData = {
          $set: {
            department: student.department || req.user.department,
          }
        };

        bulkWrites.push({
          updateOne: {
            filter,
            update: updateData,
            upsert: true,
          }
        });

        bulkWrites.push({
          updateOne: {
            filter,
            update: {
              $pull: { subjects: { subject: subject } }
            }
          }
        });

        bulkWrites.push({
          updateOne: {
            filter,
            update: {
              $push: {
                subjects: {
                  subject: subject,
                  marks: valParsed,
                  uploadedBy: req.user.id,
                }
              }
            }
          }
        });
      }
    }

    if (bulkWrites.length > 0) {
      await Mark.bulkWrite(bulkWrites);
    }

    res.json({ message: "Bulk internal marks successfully updated" });
  } catch (error) {
    console.error("Bulk Internals Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================
// 📌 GET DISTINCT TEACHER / ADMIN SUBJECTS
// ============================
exports.getTeacherSubjects = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    const { semester } = req.params;
    const cleanSem = semester.toString().replace(/\D/g, '');

    const marks = await Mark.find({
      collegeId: req.user.collegeId,
      semester: { $in: [semester, cleanSem, `S${cleanSem}`] },
      "subjects.uploadedBy": req.user.id
    });

    const uniqueSubjects = new Set();
    marks.forEach(m => {
      m.subjects.forEach(s => {
        if (s.uploadedBy.toString() === req.user.id.toString()) {
          uniqueSubjects.add(s.subject);
        }
      });
    });

    res.status(200).json(Array.from(uniqueSubjects));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
