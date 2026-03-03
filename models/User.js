const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["teacher", "student", "admin"],
      required: true,
    },

    // 🔹 SET LATER (NOT AT SIGNUP)
    department: {
      type: String,
      default: null,
    },

    designation: {
      type: String,
      default: null,
    },

    semester: {
      type: String,
      default: null,
    },

    teachingSemester: {
      type: [Number],
      default: [],
    },

    rollNo: {
      type: String,
      default: null,
    },

    registerNumber: {
      type: String,
      default: null,
    },

    // 🔹 COLLEGE ISOLATION
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
    },

    // 🔹 PROFILE SETUP TRACKER
    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    // ✅ OTP PASSWORD RESET (ADDED ONLY)
    resetOTP: {
      type: String,
      default: null,
    },

    resetOTPExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
