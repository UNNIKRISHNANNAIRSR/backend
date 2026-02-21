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
      enum: ["teacher", "student"],
      required: true,
    },

    // 🔹 SET LATER (NOT AT SIGNUP)
    department: {
      type: String,
      default: null,
    },

    semester: {
      type: String,
      default: null,
    },

    rollNo: {
      type: Number,
      default: null,
    },

    // 🔹 GROUP / COLLEGE ISOLATION
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    groupCode: {
      type: String,
      default: null,
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
