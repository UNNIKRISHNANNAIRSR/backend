const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "edu-ai-hub/library", // cloud folder
    resource_type: "auto",        // pdf, ppt, doc, image
    allowed_formats: [
      "pdf",
      "ppt",
      "pptx",
      "doc",
      "docx",
      "jpg",
      "png",
      "jpeg",
    ],
  },
});

const upload = multer({ storage });

module.exports = upload;
