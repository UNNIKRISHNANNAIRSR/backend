const User = require("../models/User");
const College = require("../models/College");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { resetOTPTemplate } = require("../utils/emailTemplate");
const {
  studentSignupTemplate,
  studentLoginTemplate,
  teacherSignupTemplate,
  teacherLoginTemplate,
} = require("../utils/emailTemplate");

// ================= SIGNUP =================
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, adminSecret, teacherAuthCode, designation } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (role === "admin" && adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Invalid Admin Secret Code" });
    }

    if (role === "teacher") {
      if (!teacherAuthCode) {
        return res.status(400).json({ message: "Teacher Authorization Code is required" });
      }

      const college = await College.findOne({ teacherAuthCode: teacherAuthCode.trim() });
      if (!college) {
        return res.status(404).json({ message: "Invalid Teacher Authorization Code" });
      }

      if (!college.isTeacherRegistrationEnabled) {
        return res.status(403).json({ message: "Teacher registration is currently disabled by the college admin" });
      }
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      designation: role === "teacher" ? designation : null,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ========= EMAIL (SIGNUP) =========
    if (role === "teacher") {
      sendEmail(
        email,
        "Welcome to EduAI – Teacher Account Created",
        teacherSignupTemplate(name)
      ).catch(console.error);
    } else {
      sendEmail(
        email,
        "Welcome to EduAI – Student Account Created",
        studentSignupTemplate(name)
      ).catch(console.error);
    }

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        department: user.department,
        semester: user.semester,
        teachingSemester: user.teachingSemester || [],
        registerNumber: user.registerNumber,
        designation: user.designation,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  console.log("LOGIN BODY RECEIVED:", req.body); // 🔥 debug
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ========= EMAIL (LOGIN) =========
    if (user.role === "teacher") {
      sendEmail(
        user.email,
        "EduAI Teacher Login Alert",
        teacherLoginTemplate(user.name)
      ).catch(console.error);
    } else {
      sendEmail(
        user.email,
        "EduAI Student Login Alert",
        studentLoginTemplate(user.name)
      ).catch(console.error);
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        department: user.department,
        semester: user.semester,
        teachingSemester: user.teachingSemester || [],
        registerNumber: user.registerNumber,
        rollNo: user.rollNo,
        designation: user.designation,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ msg: "User not found" });

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.resetOTPExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // ✅ USE sendEmail FUNCTION (NOT nodemailer)
    await sendEmail(
      user.email,
      "Password Reset OTP",
      resetOTPTemplate(user.name, otp)
    );

    res.json({ msg: "OTP sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({
      email,
      resetOTP: otp, // STRING compare
      resetOTPExpire: { $gt: Date.now() }, // not expired
    });

    if (!user)
      return res.status(400).json({ msg: "Invalid OTP" });

    // 🔐 Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 🧹 Clear OTP
    user.resetOTP = null;
    user.resetOTPExpire = null;

    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
