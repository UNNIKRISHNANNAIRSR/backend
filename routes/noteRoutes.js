const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const { protect } = require("../middleware/auth");
const { uploadNotes } = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const Group = require("../models/Group");





router.post(
  "/upload",
  protect,
  uploadNotes.single("file"),
  async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({
          message: "Only teachers can upload notes",
        });
      }

      if (!req.user.groupId) {
        return res.status(400).json({
          message: "Teacher not assigned to group",
        });
      }

      const { title, description, semester } = req.body;

      if (!title || !semester) {
        return res.status(400).json({
          message: "Title and semester are required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded",
        });
      }

      const note = await Note.create({
        title,
        description,
        department: req.user.department, // 🔥 force teacher department
        semester,
        fileUrl: req.file.path, // Cloudinary URL
        uploadedBy: req.user._id,
        groupId: req.user.groupId,
      });

      res.status(201).json({
        message: "Note uploaded successfully",
        note,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);









router.get("/", protect, async (req, res) => {
  try {
    const { department, semester, mine } = req.query;

    // user must belong to group
    if (!req.user.groupId) {
      return res.status(400).json({
        message: "User not assigned to group",
      });
    }

    let filter = {
      groupId: req.user.groupId,
    };

    if (department) filter.department = department;
    if (semester) filter.semester = semester;

    if (mine === "true") {
      filter.uploadedBy = req.user._id;
    }

    const notes = await Note.find(filter)
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});







// ✏️ UPDATE NOTE (replace PDF)
router.put(
  "/:id",
  protect,
  uploadNotes.single("file"),
  async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);

      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // 🔐 Only uploader can update
      if (note.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // 🧹 If new file uploaded → delete old file
      if (req.file) {
        const oldFilePath = path.join(__dirname, "..", note.fileUrl);

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        note.fileUrl = `/uploads/notes/${req.file.filename}`;
      }

      // 📝 Update text fields
      note.title = req.body.title || note.title;
      note.description = req.body.description || note.description;
      note.department = req.body.department || note.department;
      note.semester = req.body.semester || note.semester;

      await note.save();

      res.json({
        message: "Note updated successfully",
        note,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);




router.delete("/:id", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // 🔐 Only uploader can delete
    if (note.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🧹 DELETE FILE FROM FOLDER
    const filePath = path.join(__dirname, "..", note.fileUrl);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 🗑️ DELETE FROM DB
    await note.deleteOne();

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
