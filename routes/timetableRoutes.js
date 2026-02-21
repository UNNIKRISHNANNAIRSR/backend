const express = require("express");
const router = express.Router();
const Timetable = require("../models/Timetable");
const { protect } = require("../middleware/auth");
const { uploadTimetable } = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

/* ===========================
   UPLOAD / UPDATE TIMETABLE
=========================== */
router.post(
  "/upload",
  protect,
  uploadTimetable.single("file"),
  async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers allowed" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "File required" });
      }

      const { semester, description } = req.body;

      // Check if timetable already exists
      const existing = await Timetable.findOne({
        semester,
        groupId: req.user.groupId,
      });

      // If exists → delete old file
      if (existing) {
        const oldPath = path.join(__dirname, "..", existing.fileUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        await existing.deleteOne();
      }

      const timetable = new Timetable({
        semester,
        description,
        fileUrl: `/uploads/timetable/${req.file.filename}`,
        uploadedBy: req.user._id,
        groupId: req.user.groupId,
      });

      await timetable.save();

      res.status(201).json({
        message: "Timetable uploaded",
        timetable,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/* ===========================
   GET TIMETABLE (Student + Teacher)
=========================== */
router.get("/", protect, async (req, res) => {
  try {
    const { semester } = req.query;

    if (!semester) {
      return res.status(400).json({ message: "Semester required" });
    }

    const timetable = await Timetable.findOne({
      semester,
      groupId: req.user.groupId,
    }).populate("uploadedBy", "name email");

    if (!timetable) {
      return res.json({ message: "No timetable found" });
    }

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===========================
   DELETE TIMETABLE
=========================== */
router.delete("/:id", protect, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ message: "Not found" });
    }

    if (timetable.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const filePath = path.join(__dirname, "..", timetable.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await timetable.deleteOne();

    res.json({ message: "Timetable deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
