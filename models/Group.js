const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      required: true,
    },

    departments: {
      type: [String], // array of department names
      required: true,
    },

    totalSemesters: {
      type: Number, // e.g. 8
      required: true,
    },

    groupCode: {
      type: String,
      unique: true,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["teacher", "student"],
        },
        department: String,
        semester: String, // optional
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
