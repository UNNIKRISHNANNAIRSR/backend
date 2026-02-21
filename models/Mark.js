const mongoose = require("mongoose");

const subjectMarkSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },

  marks: {
    type: Number,
    required: true,
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // teacher
    required: true,
  },
});

const markSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    semester: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    examType: {
      type: String,
      enum: ["Series 1", "Series 2", "Internal", "Assignment 1","Assignment 2","Main Exam"],
      required: true,
    },

    subjects: [subjectMarkSchema],

    // 🔽 ONLY FOR MAIN EXAM
    cgpa: {
      type: Number,
      default: null,
    },

    grade: {
      type: String,
      default: null,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mark", markSchema);
