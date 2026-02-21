const express = require("express");
const router = express.Router();
const StudentProgress = require("../models/StudentProgress");
const { protect } = require("../middleware/auth");


const {
  promoteStudents,
  removeStudents
} = require("../controllers/studentStatusController");


/* 🔥 BULK PROMOTE */
router.put("/promote", protect, promoteStudents);

/* 🔥 BULK REMOVE */
router.put("/remove", protect, removeStudents);


// Get progress
router.get("/stats/:id", async (req, res) => {
  try {
    let progress = await StudentProgress.findOne({ studentId: req.params.id });

    if (!progress) {
      progress = await StudentProgress.create({
        studentId: req.params.id,
        notesRead: 0,
        totalNotes: 0,
        booksRead: 0,
      });
    }

    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});



// 🔥 INCREMENT NOTE READ
router.put("/notes/read", protect, async (req, res) => {
  try {
    const studentId = req.user.id;

    const progress = await StudentProgress.findOneAndUpdate(
      { studentId },
      { $inc: { notesRead: 1 } },
      { new: true, upsert: true }
    );

    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: "Failed to update notes read" });
  }
});


// 🔥 INCREMENT BOOK READ
router.put("/books/read", protect, async (req, res) => {
  try {
    const studentId = req.user.id;

    const progress = await StudentProgress.findOneAndUpdate(
      { studentId },
      { $inc: { booksRead: 1 } },
      { new: true, upsert: true }
    );

    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: "Failed to update books read" });
  }
});

module.exports = router;
