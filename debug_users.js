require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const students = await User.find({ role: "student" });
        console.log("Students:", students.map(s => ({
            name: s.name,
            collegeId: s.collegeId?.toString(),
            department: s.department,
            semester: s.semester
        })));

        const teachers = await User.find({ role: "teacher" });
        console.log("Teachers:", teachers.map(t => ({
            name: t.name,
            collegeId: t.collegeId?.toString(),
            department: t.department,
            teachingSemester: t.teachingSemester
        })));
    } catch (e) {
        console.log(e);
    } finally {
        process.exit();
    }
});
