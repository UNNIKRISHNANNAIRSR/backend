// const express = require("express");
// const router = express.Router();
// const Note = require("../models/Note");
// const Subject = require("../models/Subject");
// const { protect } = require("../middleware/auth");
// const { uploadNotes } = require("../middleware/upload");
// const path = require("path");
// const fs = require("fs");

// // 📤 UPLOAD NOTE
// router.post(
//   "/upload",
//   protect,
//   uploadNotes.single("file"),
//   async (req, res) => {
//     try {
//       if (req.user.role !== "teacher") {
//         return res.status(403).json({ message: "Only teachers can upload notes" });
//       }

//       if (!req.user.collegeId) {
//         return res.status(400).json({ message: "Teacher not assigned to a college" });
//       }

//       const { title, description, semester } = req.body;

//       if (!title || !semester) {
//         return res.status(400).json({ message: "Title and Semester are required" });
//       }

//       if (!req.file) {
//         return res.status(400).json({ message: "No file uploaded" });
//       }

//       const note = await Note.create({
//         title,
//         description,
//         department: req.user.department,
//         semester,
//         fileUrl: req.file.path,
//         uploadedBy: req.user.id,
//         collegeId: req.user.collegeId,
//       });

//       res.status(201).json({
//         message: "Note uploaded successfully",
//         note,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// // 🔍 GET NOTES (Simple Dept + Sem Visibility)
// router.get("/", protect, async (req, res) => {
//   try {
//     const { semester, department, mine } = req.query;

//     if (!req.user.collegeId) {
//       return res.status(400).json({ message: "User not assigned to a college" });
//     }

//     let filter = {
//       collegeId: req.user.collegeId,
//     };

//     // Strict Visibility Filtering
//     if (req.user.role === "student") {
//       // Students strictly see only their department
//       const deptRegex = new RegExp(`^${req.user.department}$`, "i");
//       filter.department = { $regex: deptRegex };

//       // Helper to clean semester strings
//       const getSemInfo = (s) => {
//         if (!s) return null;
//         const num = parseInt(s.toString().replace(/\D/g, ""), 10);
//         return { original: s, clean: num.toString(), prefixed: `S${num}`, num };
//       };

//       if (semester) {
//         // 🎯 EXACT SEMESTER FILTER (from bubble click)
//         const info = getSemInfo(semester);
//         filter.semester = { $in: [info.original, info.clean, info.prefixed] };
//       } else {
//         // 📚 PROGRESSIVE VISIBILITY (Default view)
//         // Show everything from S1 up to the student's current semester
//         const studentSemInfo = getSemInfo(req.user.semester || "S1");
//         const allowedSemesters = [];
//         for (let i = 1; i <= studentSemInfo.num; i++) {
//           allowedSemesters.push(i.toString(), `S${i}`);
//         }
//         filter.semester = { $in: allowedSemesters };
//       }

//       console.log(`📚 Student Profile: ${req.user.department} (${req.user.semester})`);
//       console.log(`🔍 Filter applied:`, JSON.stringify(filter));

//     } else if (req.user.role === "teacher") {
//       if (mine === "true") {
//         filter.uploadedBy = req.user.id;
//       } else {
//         // Teachers see notes for their department by default
//         const deptRegex = new RegExp(`^${req.user.department}$`, "i");
//         filter.department = { $regex: deptRegex };
//       }
//     }

//     // Optional override filters (for non-students)
//     if (semester && req.user.role !== "student") filter.semester = semester;
//     if (department && req.user.role !== "student") {
//       const deptRegex = new RegExp(`^${department}$`, "i");
//       filter.department = { $regex: deptRegex };
//     }

//     const notes = await Note.find(filter)
//       .sort({ createdAt: -1 });

//     res.json(notes);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ✏️ UPDATE NOTE
// router.put(
//   "/:id",
//   protect,
//   uploadNotes.single("file"),
//   async (req, res) => {
//     try {
//       const note = await Note.findById(req.params.id);

//       if (!note) {
//         return res.status(404).json({ message: "Note not found" });
//       }

//       if (note.uploadedBy.toString() !== req.user.id.toString()) {
//         return res.status(403).json({ message: "Not authorized" });
//       }

//       if (req.file) {
//         // Delete old file if updating (handle both local and Cloudinary logic if needed)
//         // For simplicity, we just update the path here
//         note.fileUrl = req.file.path;
//       }

//       note.title = req.body.title || note.title;
//       note.description = req.body.description || note.description;
//       note.department = req.body.department || note.department;
//       note.semester = req.body.semester || note.semester;

//       await note.save();

//       res.json({
//         message: "Note updated successfully",
//         note,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// // 🗑️ DELETE NOTE
// router.delete("/:id", protect, async (req, res) => {
//   try {
//     const note = await Note.findById(req.params.id);

//     if (!note) {
//       return res.status(404).json({ message: "Note not found" });
//     }

//     if (note.uploadedBy.toString() !== req.user.id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     await note.deleteOne();
//     res.json({ message: "Note deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// });

// module.exports = router;





const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const { protect } = require("../middleware/auth");
const { uploadNotes } = require("../middleware/upload");
const fs = require("fs");
const path = require("path");


// ===============================
// 📤 UPLOAD NOTE
// ===============================
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

      // ✅ FIXED: check college instead of group
      if (!req.user.collegeId) {
        return res.status(400).json({
          message: "Teacher not assigned to college",
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
        department: req.user.department, // auto from teacher
        semester,
        fileUrl: req.file.path,
        uploadedBy: req.user._id,
        collegeId: req.user.collegeId, // ✅ FIXED
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


// ===============================
// 📥 GET NOTES
// ===============================
router.get("/", protect, async (req, res) => {
  try {
    const { department, semester, mine } = req.query;

    if (!req.user.collegeId) {
      return res.status(400).json({
        message: "User not assigned to college",
      });
    }

    let filter = {
      collegeId: req.user.collegeId, // ✅ FIXED
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


// ===============================
// ✏️ UPDATE NOTE
// ===============================
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

      if (note.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // If new file uploaded
      if (req.file) {
        const oldFilePath = path.join(__dirname, "..", note.fileUrl);

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        note.fileUrl = req.file.path;
      }

      note.title = req.body.title || note.title;
      note.description = req.body.description || note.description;
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


// ===============================
// 🗑 DELETE NOTE
// ===============================
router.delete("/:id", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const filePath = path.join(__dirname, "..", note.fileUrl);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await note.deleteOne();

    res.json({ message: "Note deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;