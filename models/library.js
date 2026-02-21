const mongoose = require("mongoose");

const librarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // 🔹 file = Cloudinary upload | url = external link
    type: {
      type: String,
      enum: ["file", "url"],
      required: true,
    },

    // ✅ Cloudinary secure URL (preview / open in browser)
    fileUrl: {
      type: String,
      default: null,
    },

    // ✅ Cloudinary public_id (IMPORTANT for update & delete)
    cloudinaryId: {
      type: String,
      default: null,
    },

    // 🔗 External resource (Google Drive, MIT OCW, etc.)
    externalUrl: {
      type: String,
      default: null,
    },

    // 👤 Uploaded user
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔒 Group isolation
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Library", librarySchema);
