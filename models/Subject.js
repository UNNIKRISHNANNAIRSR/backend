const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        departments: [{
            type: String,
            required: true,
        }],
        semester: {
            type: String,
            required: true,
        },
        assignedTeacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
