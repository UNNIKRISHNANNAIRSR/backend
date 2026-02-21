// const multer = require("multer");
// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// /* ===============================
//    CLOUDINARY CONFIG
// ================================ */
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// /* ===============================
//    🔥 STORAGE FACTORY (FIXED)
// ================================ */
// const createStorage = (folder, resourceType = "raw") => {
//   return new CloudinaryStorage({
//     cloudinary,
//     params: async (req, file) => ({
//       folder: `edu-ai-hub/${folder}`,
//       resource_type: resourceType, // 🔥 RAW for PDF/DOC/PPT preview

//       // public_id: `${Date.now()}-${file.originalname
//       //   .replace(/\s+/g, "_")
//       //   .replace(/\.[^/.]+$/, "")}`,

//     public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,

//     }),
//   });
// };

// /* ===============================
//    UPLOAD MIDDLEWARES
// ================================ */
// exports.uploadNotes = multer({
//   storage: createStorage("notes", "raw"),
// });

// exports.uploadTimetable = multer({
//   storage: createStorage("timetable", "raw"),
// });

// const noticeStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "edu-ai-hub/notices",
//     resource_type: "image", // 🔥 IMAGE ONLY
//     format: async () => "png",
//     public_id: () => `notice-${Date.now()}`,
//   },
// });

// /* 🔥 LIBRARY — RAW REQUIRED */
// exports.uploadLibrary = multer({
//   storage: createStorage("library", "raw"),
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
// });

// exports.uploadNoticeImage = multer({
//   storage: noticeStorage,
//   fileFilter: (req, file, cb) => {
//     if (!file.mimetype.startsWith("image/")) {
//       cb(new Error("Only images allowed"), false);
//     }
//     cb(null, true);
//   },
// });




const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/* ===============================
   CLOUDINARY CONFIG
================================ */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ✅ DEBUG — MUST BE HERE, NOT INSIDE config */
console.log(
  "Cloudinary:",
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET ? "SECRET_OK" : "SECRET_MISSING"
);

/* ===============================
   STORAGE FACTORY
================================ */
const createStorage = (folder, resourceType = "raw") =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `edu-ai-hub/${folder}`,
      resource_type: resourceType,
      // public_id: (req, file) =>
      //   `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,


      public_id: (req, file) => {
  const name = file.originalname
    .replace(/\.[^/.]+$/, "")   // 🔥 remove extension
    .replace(/\s+/g, "_");

  return `${Date.now()}-${name}`;
},


    },
  });

/* ===============================
   UPLOAD MIDDLEWARES
================================ */
exports.uploadLibrary = multer({
  storage: createStorage("library", "raw"),
  limits: { fileSize: 10 * 1024 * 1024 },
});

exports.uploadNoticeImage = multer({
  storage: createStorage("notices", "image"),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only images allowed"), false);
    }
    cb(null, true);
  },
});

exports.uploadNotes = multer({
  storage: createStorage("notes", "raw"),
});

exports.uploadTimetable = multer({
  storage: createStorage("timetable", "raw"),
});