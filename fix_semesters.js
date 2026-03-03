require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const teachers = await User.find({ role: "teacher" });
        let updatedCount = 0;
        for (let t of teachers) {
            if (!t.teachingSemester || t.teachingSemester.length === 0 || t.teachingSemester.some(s => s === null)) {
                t.teachingSemester = [1, 3, 6];
                await t.save();
                updatedCount++;
            }
        }
        console.log(`✅ Fixed ${updatedCount} teachers with missing or null teaching semesters.`);
    } catch (err) {
        console.error("Error updating teachers:", err);
    } finally {
        process.exit();
    }
});
