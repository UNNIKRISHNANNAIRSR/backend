const Library = require("../models/library");
const cloudinary = require("cloudinary").v2;

/* ===============================
   UPLOAD FILE
================================ */
exports.uploadLibraryFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const book = await Library.create({
      title: req.body.title,
      description: req.body.description,
      type: "file",
      fileUrl: req.file.path,          // ✅ PREVIEW URL
      cloudinaryId: req.file.public_id, // ✅ CORRECT ID
      uploadedBy: req.user._id,
    });

    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   ADD URL
================================ */
exports.addLibraryUrl = async (req, res) => {
  try {
    const { title, description, externalUrl } = req.body;

    if (!externalUrl) {
      return res.status(400).json({ message: "URL required" });
    }

    const book = await Library.create({
      title,
      description,
      type: "url",
      externalUrl,
      uploadedBy: req.user._id,
    });

    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET ALL
================================ */
exports.getLibrary = async (req, res) => {
  const books = await Library.find()
    .populate("uploadedBy", "name role")
    .sort({ createdAt: -1 });

  res.json(books);
};

/* ===============================
   DELETE
================================ */
exports.deleteLibrary = async (req, res) => {
  try {
    const book = await Library.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Not found" });

    if (book.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (book.cloudinaryId) {
      await cloudinary.uploader.destroy(book.cloudinaryId, {
        resource_type: "raw",
      });
    }

    await book.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   UPDATE (FILE + URL SAFE)
================================ */
exports.updateLibrary = async (req, res) => {
  try {
    const book = await Library.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Not found" });

    if (book.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Text update
    if (req.body.title) book.title = req.body.title;
    if (req.body.description) book.description = req.body.description;

    /* 🔁 FILE REPLACEMENT */
    if (req.file) {
      if (book.cloudinaryId) {
        await cloudinary.uploader.destroy(book.cloudinaryId, {
          resource_type: "raw",
        });
      }

      book.type = "file";
      book.fileUrl = req.file.path;
      book.cloudinaryId = req.file.public_id;
      book.externalUrl = null;
    }

    /* 🔁 URL REPLACEMENT */
    if (req.body.externalUrl && !req.file) {
      if (book.cloudinaryId) {
        await cloudinary.uploader.destroy(book.cloudinaryId, {
          resource_type: "raw",
        });
      }

      book.type = "url";
      book.externalUrl = req.body.externalUrl;
      book.fileUrl = null;
      book.cloudinaryId = null;
    }

    await book.save();
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
