const College = require("../models/College");
const User = require("../models/User");

exports.createCollege = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const { name, departments, totalSemesters } = req.body;

        if (!name || !departments || !totalSemesters) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Generate college-specific join code
        const safeName = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const joinCode = `${safeName}_${randomStr}`;

        // Generate teacher auth code
        const teacherCodeStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const teacherAuthCode = `TCH_${teacherCodeStr}`;

        const college = await College.create({
            name,
            departments,
            totalSemesters,
            joinCode,
            teacherAuthCode,
            createdBy: req.user.id,
        });

        // Automatically set the admin's collegeId
        await User.findByIdAndUpdate(req.user.id, { collegeId: college._id });

        res.status(201).json(college);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.joinCollege = async (req, res) => {
    try {
        const { joinCode, department, semester, registerNumber } = req.body;

        if (!joinCode) {
            return res.status(400).json({ message: "Join code is required" });
        }

        const college = await College.findOne({ joinCode });
        if (!college) {
            return res.status(404).json({ message: "Invalid join code" });
        }

        const updateData = { collegeId: college._id };

        if (req.user.role === "student") {
            if (!department || !semester || !registerNumber) {
                return res.status(400).json({ message: "Department, semester, and register number are required for students" });
            }

            // Check if register number is already taken in this college
            const existingStudent = await User.findOne({
                collegeId: college._id,
                registerNumber: registerNumber
            });

            if (existingStudent && existingStudent._id.toString() !== req.user.id.toString()) {
                return res.status(400).json({ message: "This Register Number is already in use by another student." });
            }

            updateData.department = department;
            updateData.semester = semester;
            updateData.registerNumber = registerNumber;
        } else if (req.user.role === "teacher") {
            if (!department || !semester || (Array.isArray(semester) && semester.length === 0)) {
                return res.status(400).json({ message: "Department and teaching semester are required for teachers" });
            }
            updateData.department = department;
            const semestersArray = Array.isArray(semester) ? semester : [semester];
            updateData.teachingSemester = semestersArray
                .map(s => parseInt(s.toString().replace(/\D/g, ''), 10))
                .filter(n => !isNaN(n));
        }

        updateData.isProfileComplete = true;

        const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");

        res.json({ message: "Joined college successfully", user, college });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyCollege = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.collegeId) {
            return res.status(404).json({ message: "User is not part of a college" });
        }

        const college = await College.findById(user.collegeId);
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }

        // Aggregate teachers and students per department
        const members = await User.find({ collegeId: college._id }).select("-password");

        // Optional: Structure the members logic for the dashboard
        // Currently we will just return raw members, and let frontend group them
        // or group them here if required. 

        res.json({ college, members });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDepartmentDetails = async (req, res) => {
    try {
        const { dept } = req.params;

        // Security check: Must have collegeId (implying valid membership)
        if (!req.user.collegeId) {
            return res.status(404).json({ message: "User is not part of a college" });
        }

        // Security check: Must be an admin to view detailed department breakdowns this way
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        // Fetch college to get total semesters
        const college = await College.findById(req.user.collegeId);
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }
        const totalSemesters = college.totalSemesters || 8; // fallback to 8 if not defined

        // Fetch ALL members strictly belonging to this admin's college AND the requested department
        const members = await User.find({
            collegeId: req.user.collegeId,
            department: dept
        }).select("_id name email role rollNo registerNumber semester teachingSemester department designation"); // Exclude password and heavy fields

        // Filter by strict roles
        const teachers = members
            .filter(m => m.role === "teacher")
            .map(t => ({
                _id: t._id,
                name: t.name,
                designation: t.designation || "Lecturer",
                teachingSemester: Array.isArray(t.teachingSemester) && t.teachingSemester.length > 0
                    ? `S${t.teachingSemester.sort((a, b) => a - b).join(", S")}`
                    : "N/A",
                rawTeachingSemester: t.teachingSemester || [],
                email: t.email
            }))
            .sort((a, b) => {
                const isHodA = a.designation?.toLowerCase() === "hod";
                const isHodB = b.designation?.toLowerCase() === "hod";
                if (isHodA && !isHodB) return -1;
                if (!isHodA && isHodB) return 1;
                return a.name.localeCompare(b.name);
            });

        const students = members.filter(m => m.role === "student");

        // Group students by their semester based on totalSemesters
        const studentsBySemester = {};
        for (let i = 1; i <= totalSemesters; i++) {
            studentsBySemester[`S${i}`] = [];
        }

        students.forEach(student => {
            let semNum = NaN;
            if (student.semester) {
                semNum = parseInt(student.semester.toString().replace(/\D/g, ''));
            }
            if (!isNaN(semNum) && semNum >= 1 && semNum <= totalSemesters) {
                studentsBySemester[`S${semNum}`].push({
                    _id: student._id,
                    name: student.name,
                    rollNo: student.rollNo || "N/A",
                    registerNumber: student.registerNumber || "N/A",
                    department: student.department || dept,
                    semester: student.semester
                });
            }
        });

        // Optional: sort students within each semester by rollNo
        for (const sem in studentsBySemester) {
            studentsBySemester[sem].sort((a, b) => {
                const rollA = a.rollNo ? a.rollNo.toString() : "";
                const rollB = b.rollNo ? b.rollNo.toString() : "";
                return rollA.localeCompare(rollB, undefined, { numeric: true });
            });
        }

        // Return strictly formatted response
        res.status(200).json({
            department: dept,
            totalTeachers: teachers.length,
            totalStudents: students.length,
            teachers: teachers,
            studentsBySemester: studentsBySemester
        });

    } catch (error) {
        console.error("Error in getDepartmentDetails:", error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------------------
// NEW ENDPOINT: Dedicated Department Details Page
// GET /college/department/:departmentName/details
// ---------------------------------------------------------------------
exports.getDepartmentDetailsPage = async (req, res) => {
    try {
        const { departmentName } = req.params;

        // Security check: Must have collegeId
        if (!req.user.collegeId) {
            return res.status(404).json({ message: "User is not part of a college" });
        }

        // Security check: Must be an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        // Fetch college to get total semesters
        const college = await College.findById(req.user.collegeId);
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }
        const totalSemesters = college.totalSemesters || 8; // fallback to 8 if not defined

        // Fetch ALL members strictly belonging to this admin's college AND the requested department
        const members = await User.find({
            collegeId: req.user.collegeId,
            department: departmentName
        }).select("_id name email role rollNo registerNumber semester teachingSemester department designation"); // Exclude password and heavy fields

        // Filter by strict roles
        const teachers = members
            .filter(m => m.role === "teacher")
            .map(t => ({
                _id: t._id,
                name: t.name,
                designation: t.designation || "Lecturer",
                teachingSemester: Array.isArray(t.teachingSemester) && t.teachingSemester.length > 0
                    ? `S${t.teachingSemester.sort((a, b) => a - b).join(", S")}`
                    : "N/A",
                rawTeachingSemester: t.teachingSemester || [],
                email: t.email
            }))
            .sort((a, b) => {
                const isHodA = a.designation?.toLowerCase() === "hod";
                const isHodB = b.designation?.toLowerCase() === "hod";
                if (isHodA && !isHodB) return -1;
                if (!isHodA && isHodB) return 1;
                return a.name.localeCompare(b.name);
            });

        const students = members.filter(m => m.role === "student");

        // Group students by their semester based on totalSemesters
        const studentsBySemester = {};
        for (let i = 1; i <= totalSemesters; i++) {
            studentsBySemester[`S${i}`] = [];
        }

        students.forEach(student => {
            let semNum = NaN;
            if (student.semester) {
                semNum = parseInt(student.semester.toString().replace(/\D/g, ''));
            }
            // Strictly check for numbers and place in corresponding S array
            if (!isNaN(semNum) && semNum >= 1 && semNum <= totalSemesters) {
                studentsBySemester[`S${semNum}`].push({
                    _id: student._id,
                    name: student.name,
                    rollNo: student.rollNo || "N/A",
                    registerNumber: student.registerNumber || "N/A",
                    department: student.department || departmentName,
                    semester: student.semester
                });
            }
        });

        // Sort students within each semester by rollNo
        for (const sem in studentsBySemester) {
            studentsBySemester[sem].sort((a, b) => {
                const rollA = a.rollNo ? a.rollNo.toString() : "";
                const rollB = b.rollNo ? b.rollNo.toString() : "";
                return rollA.localeCompare(rollB, undefined, { numeric: true });
            });
        }

        // Dynamic Student Count (Active students only)
        const totalStudentsCount = await User.countDocuments({
            collegeId: req.user.collegeId,
            department: departmentName,
            role: "student"
        });

        // Return precisely formatted response for Details Page
        res.status(200).json({
            department: departmentName,
            totalSemesters: totalSemesters,
            totalStudents: totalStudentsCount,
            teachers: teachers,
            studentsBySemester: studentsBySemester
        });

    } catch (error) {
        console.error("Error in getDepartmentDetailsPage:", error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------------------
// NEW ENDPOINT: Department Summary (Phase 7)
// GET /college/department/:dept/summary
// ---------------------------------------------------------------------
exports.getDepartmentSummary = async (req, res) => {
    try {
        const { dept } = req.params;

        // Security check: Must have collegeId
        if (!req.user.collegeId) {
            return res.status(404).json({ message: "User is not part of a college" });
        }

        // Security check: Must be an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        // Efficiently count teachers and students
        const [totalTeachers, totalStudents] = await Promise.all([
            User.countDocuments({
                collegeId: req.user.collegeId,
                department: dept,
                role: "teacher"
            }),
            User.countDocuments({
                collegeId: req.user.collegeId,
                department: dept,
                role: "student"
            })
        ]);

        res.status(200).json({
            department: dept,
            totalTeachers,
            totalStudents
        });

    } catch (error) {
        console.error("Error in getDepartmentSummary:", error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------------------
// NEW ENDPOINT: Department Students By Semester (Phase 7)
// GET /college/department/:dept/students/:semester
// ---------------------------------------------------------------------
exports.getDepartmentStudentsBySemester = async (req, res) => {
    try {
        const { dept, semester } = req.params;

        // Security check: Must have collegeId
        if (!req.user.collegeId) {
            return res.status(404).json({ message: "User is not part of a college" });
        }

        // Security check: Must be an admin or a teacher belonging to this department
        if (req.user.role !== "admin") {
            if (req.user.role !== "teacher" || req.user.department !== dept) {
                return res.status(403).json({ message: "Access denied. You can only view students in your own department." });
            }
        }

        // Fetch students directly matching criteria
        const cleanSem = semester.toString().replace(/\D/g, '');
        const students = await User.find({
            collegeId: req.user.collegeId,
            department: dept,
            role: "student",
            semester: { $in: [semester, cleanSem, `S${cleanSem}`] }
        }).select("_id name rollNo registerNumber department semester");

        // Sort students logically by rollNo
        students.sort((a, b) => {
            const rollA = a.rollNo ? a.rollNo.toString() : "";
            const rollB = b.rollNo ? b.rollNo.toString() : "";
            return rollA.localeCompare(rollB, undefined, { numeric: true });
        });

        res.status(200).json(students);

    } catch (error) {
        console.error("Error in getDepartmentStudentsBySemester:", error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------------------
// NEW ENDPOINT: Verify Join Code (Phase 8)
// GET /college/verify/:code
// ---------------------------------------------------------------------
exports.verifyJoinCode = async (req, res) => {
    try {
        const { code } = req.params;

        const college = await College.findOne({ joinCode: code });
        if (!college) {
            return res.status(404).json({ message: "Invalid join code" });
        }

        res.status(200).json({
            name: college.name,
            departments: college.departments,
            totalSemesters: college.totalSemesters
        });

    } catch (error) {
        console.error("Error in verifyJoinCode:", error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------------------
// NEW ENDPOINT: Remove Member (Phase 9)
// DELETE /college/department/member/:userId
// ---------------------------------------------------------------------
exports.removeMember = async (req, res) => {
    try {
        const { userId } = req.params;

        // Security check: Must have collegeId
        if (!req.user.collegeId) {
            return res.status(404).json({ message: "User is not part of a college" });
        }

        // Security check: Must be an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        // Find target user
        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Strict validation: Admin can ONLY remove users strictly inside their existing college
        if (targetUser.collegeId.toString() !== req.user.collegeId.toString()) {
            return res.status(403).json({ message: "You don't have permission to remove members outside your college" });
        }

        // Detach the user from the College and wipe context metadata
        targetUser.collegeId = null;
        targetUser.department = null;
        targetUser.semester = null;
        targetUser.teachingSemester = [];
        targetUser.rollNo = null;
        targetUser.registerNumber = null;
        await targetUser.save();

        res.status(200).json({ message: "Member successfully removed" });
    } catch (error) {
        console.error("Error in removeMember:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.addDepartment = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { departmentName } = req.body;
        if (!departmentName || departmentName.trim() === "") {
            return res.status(400).json({ message: "Department name is required" });
        }

        const college = await College.findById(req.user.collegeId);
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }

        // Prevent exact duplicates
        if (college.departments.includes(departmentName.trim())) {
            return res.status(400).json({ message: "Department already exists" });
        }

        college.departments.push(departmentName.trim());
        await college.save();

        res.status(200).json({ message: "Department added successfully", college });
    } catch (error) {
        console.error("Error in addDepartment:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.editDepartment = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { oldDept } = req.params;
        const { newDept } = req.body;

        if (!newDept || newDept.trim() === "") {
            return res.status(400).json({ message: "New department name is required" });
        }

        const college = await College.findById(req.user.collegeId);
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }

        const deptIndex = college.departments.indexOf(oldDept);
        if (deptIndex === -1) {
            return res.status(404).json({ message: "Original department not found" });
        }

        // Check if the new name already exists elsewhere
        if (college.departments.includes(newDept.trim())) {
            return res.status(400).json({ message: "Department name already exists in this college" });
        }

        // 1. Update College Array
        college.departments[deptIndex] = newDept.trim();
        await college.save();

        // 2. Cascade update to all Users inside this college
        const User = require("../models/User");
        await User.updateMany(
            { collegeId: college._id, department: oldDept },
            { $set: { department: newDept.trim() } }
        );

        // 3. Cascade update to all Marks inside this college
        const Mark = require("../models/Mark");
        await Mark.updateMany(
            { collegeId: college._id, department: oldDept },
            { $set: { department: newDept.trim() } }
        );

        // 4. Cascade update to all Notes inside this college
        const Note = require("../models/Note");
        await Note.updateMany(
            { collegeId: college._id, department: oldDept },
            { $set: { department: newDept.trim() } }
        );

        res.status(200).json({ message: "Department renamed and all records updated successfully", college });

    } catch (error) {
        console.error("Error in editDepartment:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.regenerateTeacherAuthCode = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const college = await College.findOne({ createdBy: req.user.id });
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }

        const teacherCodeStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        college.teacherAuthCode = `TCH_${teacherCodeStr}`;
        await college.save();

        res.json({ message: "Teacher Authorization Code regenerated successfully", college });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.toggleTeacherRegistration = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const college = await College.findOne({ createdBy: req.user.id });
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }

        college.isTeacherRegistrationEnabled = !college.isTeacherRegistrationEnabled;
        await college.save();

        const statusStr = college.isTeacherRegistrationEnabled ? "enabled" : "disabled";
        res.json({ message: `Teacher registration is now ${statusStr}`, college });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------------------
// NEW ENDPOINT: Promote Students (Bulk)
// PATCH /college/students/promote
// ---------------------------------------------------------------------
exports.promoteStudents = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const { studentIds, departmentId } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: "No students selected for promotion" });
        }

        // Fetch students to check their current semesters
        const students = await User.find({ _id: { $in: studentIds }, collegeId: req.user.collegeId });

        if (students.length === 0) {
            return res.status(404).json({ message: "No valid students found" });
        }

        // Logic to increment semester
        const bulkOps = students.map(student => {
            let currentSem = student.semester;
            if (!currentSem) return null;

            let semNum = parseInt(currentSem.toString().replace(/\D/g, ''));
            if (isNaN(semNum)) return null;

            let nextSem = `S${semNum + 1}`;

            return {
                updateOne: {
                    filter: { _id: student._id },
                    update: { $set: { semester: nextSem } }
                }
            };
        }).filter(op => op !== null);

        if (bulkOps.length === 0) {
            return res.status(400).json({ message: "No students could be promoted (invalid semester or already passed out)" });
        }

        await User.bulkWrite(bulkOps);

        res.status(200).json({ message: "Students promoted successfully" });

    } catch (error) {
        console.error("Error in promoteStudents:", error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------------------------
// NEW ENDPOINT: Pass Out Students (Bulk)
// PATCH /college/students/passout
// ---------------------------------------------------------------------
exports.passOutStudents = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const { studentIds } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: "No students selected for pass out" });
        }

        // Detach students from college (nullify college-related fields)
        // This removes them from the department count but preserves their marks in the DB
        await User.updateMany(
            { _id: { $in: studentIds }, collegeId: req.user.collegeId },
            {
                $set: {
                    collegeId: null,
                    department: null,
                    semester: null,
                    rollNo: null,
                    registerNumber: null,
                    teachingSemester: []
                }
            }
        );

        res.status(200).json({ message: "Students marked as passed out (graduated) and removed from college successfully" });

    } catch (error) {
        console.error("Error in passOutStudents:", error);
        res.status(500).json({ message: error.message });
    }
};
