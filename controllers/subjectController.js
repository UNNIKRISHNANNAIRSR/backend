const Subject = require("../models/Subject");
const User = require("../models/User");

// ============================
// 📌 ADMIN: CREATE SUBJECT
// ============================
exports.createSubject = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name, departments, semester, assignedTeacher } = req.body;

        if (!name || !departments || !semester || !Array.isArray(departments) || departments.length === 0) {
            return res.status(400).json({ message: "Name, departments (array), and semester are required." });
        }

        const rawSem = semester.toString().replace(/\D/g, "");
        const normalizedSem = `S${rawSem}`; // Always store as "S1" format

        const newSubject = new Subject({
            name: name.trim(),
            departments,
            semester: normalizedSem,
            assignedTeacher: assignedTeacher || null,
            collegeId: req.user.collegeId
        });

        await newSubject.save();

        // Auto-populate teacher details if assigned
        const populated = await Subject.findById(newSubject._id).populate("assignedTeacher", "name email");

        res.status(201).json({ message: "Subject created successfully", subject: populated });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ============================
// 📌 ADMIN: GET DEPARTMENT SUBJECTS BY SEMESTER
// ============================
exports.getDepartmentSubjects = async (req, res) => {
    try {
        const { department, semester } = req.params;

        const rawSem = semester.toString().replace(/\D/g, "");
        const normalizedSem = `S${rawSem}`; // Match storage format

        const subjects = await Subject.find({
            collegeId: req.user.collegeId,
            departments: { $in: [department] },
            semester: { $in: [semester, normalizedSem, rawSem] }
        }).populate("assignedTeacher", "name email");

        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ============================
// 📌 ADMIN: DELETE SUBJECT
// ============================
exports.deleteSubject = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const subjectId = req.params.id;

        const subject = await Subject.findOneAndDelete({
            _id: subjectId,
            collegeId: req.user.collegeId
        });

        if (!subject) return res.status(404).json({ message: "Subject not found." });

        res.status(200).json({ message: "Subject deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// ============================
// 📌 TEACHER: GET MY ASSIGNED SUBJECTS
// ============================
exports.getMySubjects = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Access denied" });
        }

        const semester = req.params.semester;

        // Handle potential formatting issues (e.g., S1 vs 1)
        const cleanSem = semester.toString().replace(/\D/g, '');

        const subjects = await Subject.find({
            collegeId: req.user.collegeId,
            assignedTeacher: req.user.id,
            semester: { $in: [semester, cleanSem, `S${cleanSem}`] }
        });

        res.status(200).json(subjects.map(s => ({ _id: s._id, name: s.name })));
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

