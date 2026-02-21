const express = require("express");
const router = express.Router();
const Notice = require("../models/Notice");
const { protect } = require("../middleware/auth");
const { uploadNoticeImage } = require("../middleware/upload");
const cloudinary = require("cloudinary").v2;

/* ===========================
   POST – Upload Notice (Teacher)
=========================== */
router.post(
  "/upload",
  protect,
  uploadNoticeImage.single("image"),
  async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
      }

      const notice = await Notice.create({
        title: req.body.title,
        description: req.body.description,
        imageUrl: req.file?.path || null,
        cloudinaryId: req.file?.filename || null,
        uploadedBy: req.user._id,
        groupId: req.user.groupId,
      });

      res.status(201).json(notice);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/* ===========================
   GET – MY NOTICES (Teacher only)
=========================== */
router.get("/my", protect, async (req, res) => {
  try {
    const notices = await Notice.find({
      uploadedBy: req.user._id,
    })
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===========================
   PUT – Update Notice
=========================== */
router.put(
  "/:id",
  protect,
  uploadNoticeImage.single("image"),
  async (req, res) => {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Not found" });

    if (notice.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    notice.title = req.body.title ?? notice.title;
    notice.description = req.body.description ?? notice.description;

    if (req.file) {
      if (notice.cloudinaryId) {
        await cloudinary.uploader.destroy(notice.cloudinaryId);
      }

      notice.imageUrl = req.file.path;
      notice.cloudinaryId = req.file.filename;
    }

    await notice.save();
    res.json(notice);
  }
);

/* ===========================
   DELETE – Notice
=========================== */
router.delete("/:id", protect, async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ message: "Not found" });

  if (notice.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (notice.cloudinaryId) {
    await cloudinary.uploader.destroy(notice.cloudinaryId);
  }

  await notice.deleteOne();
  res.json({ message: "Notice deleted" });
});
/* ===========================
   GET – GROUP NOTICES (Teacher + Student Dashboard)
=========================== */
router.get("/group", protect, async (req, res) => {
  try {
    const notices = await Notice.find({
      groupId: req.user.groupId,
    })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
