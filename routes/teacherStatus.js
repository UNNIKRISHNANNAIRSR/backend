const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const LibraryBook = require("../models/library");

// GET teacher dashboard stats
router.get("/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;

    const notesCount = await Note.countDocuments({ uploadedBy: teacherId });
    const booksCount = await LibraryBook.countDocuments({ uploadedBy: teacherId });
    

    res.json({
      notesUploaded: notesCount,
      booksUploaded: booksCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
