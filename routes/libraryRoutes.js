
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { uploadLibrary } = require("../middleware/upload");
const Library = require("../models/library");
const cloudinary = require("cloudinary").v2;

const multer = require("multer");
const storage = require("../utils/cloudinary");

const upload = multer({ storage });


const {
  uploadLibraryFile,
  addLibraryUrl,
  getLibrary,
} = require("../controllers/libraryController");

/* ===============================
   Upload file (Teacher)
================================ */
//  router.post(
//    "/upload",
//    protect,
//    uploadLibrary.single("file"),
//    uploadLibraryFile
//  );
router.post(
  "/upload",
  protect,
  uploadLibrary.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const book = await Library.create({
        title: req.body.title,
        description: req.body.description,
        type: "file",
        // fileUrl: req.file.path,          // ✅ Cloudinary URL
        // cloudinaryId: req.file.filename, // ✅ public_id
        fileUrl: req.file.path.replace("/image/upload/", "/raw/upload/"),

        cloudinaryId: req.file.public_id,

        uploadedBy: req.user._id,
      });

      res.status(201).json(book);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);


/* ===============================
   Add external URL (Teacher)
================================ */
router.post("/add-url", protect, addLibraryUrl);

/* ===============================
   View ALL books
================================ */
router.get("/", protect, getLibrary);

/* ===============================
   View MY uploads
================================ */
router.get("/my", protect, async (req, res) => {
  const books = await Library.find({
    uploadedBy: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(books);
});

/* ===============================
   Get single book (Owner)
================================ */
router.get("/:id", protect, async (req, res) => {
  const book = await Library.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Not found" });

  if (book.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }

  res.json(book);
});

/* ===============================
   Update book (file or url)
================================ */
router.put(
  "/:id",
  protect,
  uploadLibrary.single("file"),
  async (req, res) => {
    try {
      const item = await Library.findById(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });

      if (item.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not allowed" });
      }

      // 🗑️ DELETE OLD FILE FIRST
      if (req.file && item.cloudinaryId) {
        await cloudinary.uploader.destroy(item.cloudinaryId, {
          resource_type: "raw",
        });
      }

      // text fields
      item.title = req.body.title ?? item.title;
      item.description = req.body.description ?? item.description;
      item.type = req.body.type ?? item.type;

      // ☁️ NEW FILE
      if (req.file) {
        item.type = "file";
        item.fileUrl = req.file.path;
        item.cloudinaryId = req.file.public_id;
        item.externalUrl = null;
      }

      // 🔗 URL MODE
      if (req.body.externalUrl) {
        item.type = "url";
        item.externalUrl = req.body.externalUrl;
        item.fileUrl = null;
        item.cloudinaryId = null;
      }

      await item.save();

      res.json({ message: "Library updated", data: item });
    } catch (error) {
      console.error("UPDATE ERROR:", error);
      res.status(500).json({ message: "Update failed" });
    }
  }
);


/* ===============================
   Delete book
================================ */
router.delete("/:id", protect, async (req, res) => {
  try {
    const item = await Library.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (item.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // ✅ DELETE FROM CLOUDINARY (RAW FILES)
    if (item.cloudinaryId) {
      await cloudinary.uploader.destroy(item.cloudinaryId, {
        resource_type: "raw",
      });
    }

    await item.deleteOne();

    res.json({ message: "Library deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});
module.exports = router;