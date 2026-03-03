const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        departments: {
            type: [String],
            required: true,
            default: [],
        },
        totalSemesters: {
            type: Number,
            required: true,
        },
        joinCode: {
            type: String,
            required: true,
            unique: true,
            length: 6,
        },
        teacherAuthCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        isTeacherRegistrationEnabled: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("College", collegeSchema);
