const Notice = require("../models/Notice");
const cloudinary = require("cloudinary").v2;

/* ===============================
   CREATE NOTICE (TEACHER)
================================ */
exports.createNotice = async (req, res) => {
  try {
    const { title, description, group } = req.body;

    if (!title || !description || !group) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const notice = new Notice({
      title,
      description,
      group,
      sentBy: req.user._id,
    });

    if (req.file) {
      notice.imageUrl = req.file.path;
      notice.cloudinaryId = req.file.public_id;
    }

    await notice.save();

    res.status(201).json(notice);
  } catch (err) {
    console.error("NOTICE ERROR:", err);
    res.status(500).json({ message: "Failed to create notice" });
  }
};

/* ===============================
   GET NOTICES (GROUP)
================================ */
exports.getGroupNotices = async (req, res) => {
  try {
    const { group } = req.query;

    const notices = await Notice.find({ group })
      .populate("sentBy", "name role")
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notices" });
  }
};

/* ===============================
   DELETE NOTICE (OWNER)
================================ */
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) return res.status(404).json({ message: "Not found" });

    if (notice.sentBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (notice.cloudinaryId) {
      await cloudinary.uploader.destroy(notice.cloudinaryId);
    }

    await notice.deleteOne();

    res.json({ message: "Notice deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};
