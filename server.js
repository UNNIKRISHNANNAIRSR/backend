

const dotenv = require("dotenv");
dotenv.config(); // 🔥 MUST BE FIRST — before ANY other import

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

/* ---------- CONNECT DB ---------- */
connectDB();

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- STATIC FILES (OPTIONAL) ---------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------- ROUTES ---------- */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/group", require("./routes/group"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/notices", require("./routes/noticeRoutes")); // ✅ ONLY ONCE
app.use("/api/timetable", require("./routes/timetableRoutes"));
app.use("/api/library", require("./routes/libraryRoutes"));
app.use("/api/marks", require("./routes/markRoutes"));
app.use("/api/teacher/stats", require("./routes/teacherstatus"));
app.use("/api/student", require("./routes/studentStatus"));

/* ---------- ERROR HANDLER ---------- */
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
