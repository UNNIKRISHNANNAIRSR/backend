const express = require("express");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  
} = require("../controllers/authController");

const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMe } = require("../controllers/authController");
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", forgotPassword);
router.get("/me", protect, getMe);
module.exports = router;
