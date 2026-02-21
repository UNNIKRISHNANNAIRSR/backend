const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
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
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
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

    const user = await User.findOne({ email });
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

    // 🔐 Generate 6-digit OTP as STRING
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.resetOTPExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"EduAI Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset OTP",
      html: resetOTPTemplate(user.name, otp),
    });

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
