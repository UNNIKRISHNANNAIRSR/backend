const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load Environment Variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI not found in .env file");
    process.exit(1);
}

// Import Models
const Announcement = require("../models/Announcement");
const College = require("../models/College");
const Mark = require("../models/Mark");
const Note = require("../models/Note");
const Notice = require("../models/Notice");
const StudentProgress = require("../models/StudentProgress");
const Subject = require("../models/Subject");
const Timetable = require("../models/Timetable");
const User = require("../models/User");
const Library = require("../models/library");

const models = [
    { name: "Announcements", model: Announcement },
    { name: "Colleges", model: College },
    { name: "Marks", model: Mark },
    { name: "Notes", model: Note },
    { name: "Notices", model: Notice },
    { name: "StudentProgress", model: StudentProgress },
    { name: "Subjects", model: Subject },
    { name: "Timetables", model: Timetable },
    { name: "Users", model: User },
    { name: "Library Items", model: Library },
];

async function resetDatabase() {
    try {
        console.log("🔄 Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected successfully.\n");

        console.log("🚀 Starting Database Reset...\n");

        for (const item of models) {
            try {
                const result = await item.model.deleteMany({});
                console.log(`🧹 Cleared ${item.name}: ${result.deletedCount} documents removed.`);
            } catch (err) {
                console.error(`❌ Failed to clear ${item.name}:`, err.message);
            }
        }

        console.log("\n✨ DATABASE RESET COMPLETE! All specified collections are now empty.");
        console.log("⚠️  Note: Database structure remains intactly mapped.");

    } catch (error) {
        console.error("❌ CRITICAL ERROR during reset:", error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

resetDatabase();
