// const express = require("express");
// const router = express.Router();
// const {
//   createGroup,
//   joinGroup,
//   leaveGroup,
//   getGroupByCode,
// } = require("../controllers/groupController");
// const authMiddleware = require("../middleware/authMiddleware");
// const Group = require("../models/Group");
// const User = require("../models/User");

// // // 🔍 GET GROUP BY CODE (PREVIEW ONLY)
// // GET current user's group
// router.get("/my", authMiddleware, async (req, res) => {
//   try {
//     const group = await Group.findOne({
//       $or: [
//         { createdBy: req.user.id },
//         { members: req.user.id }
//       ]
//     });

//     if (!group) {
//       return res.status(404).json({ message: "No group found" });
//     }

//     res.json(group);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });


// router.post("/create", authMiddleware, createGroup);
// router.post("/join", authMiddleware, joinGroup);
// // router.post("/leave", authMiddleware, leaveGroup);

// router.post("/leave", authMiddleware, async (req, res) => {
//   const user = await User.findById(req.user.id);

//   if (!user) return res.status(404).json({ message: "User not found" });

//   user.groupId = null;
//   user.groupCode = null;

//   await user.save();

//   res.json({ message: "Left group successfully" });
// });


// router.get("/code/:groupCode", authMiddleware, getGroupByCode);







// module.exports = router;














const express = require("express");
const router = express.Router();
const {
  createGroup,
  joinGroup,
  leaveGroup,
  getGroupByCode,
} = require("../controllers/groupController");
const authMiddleware = require("../middleware/authMiddleware");
const Group = require("../models/Group");
const User = require("../models/User");

/* ---------- GET CURRENT USER'S GROUP ---------- */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let group = null;

    // 1️⃣ If user has groupId (most reliable)
    if (user.groupId) {
      group = await Group.findById(user.groupId);
    }

    // 2️⃣ Fallback: check createdBy or members
    if (!group) {
      group = await Group.findOne({
        $or: [
          { createdBy: req.user.id },
          { members: req.user.id }
        ]
      });
    }

    if (!group) {
      return res.status(404).json({ message: "No group found" });
    }

    res.json(group);

  } catch (err) {
    console.error("GROUP /my ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------- CREATE GROUP ---------- */
router.post("/create", authMiddleware, createGroup);

/* ---------- JOIN GROUP ---------- */
router.post("/join", authMiddleware, joinGroup);

/* ---------- LEAVE GROUP ---------- */
router.post("/leave", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  user.groupId = null;
  user.groupCode = null;

  await user.save();

  res.json({ message: "Left group successfully" });
});

/* ---------- GET GROUP BY CODE ---------- */
router.get("/code/:groupCode", authMiddleware, getGroupByCode);



/* ---------- GET STUDENTS BY SEMESTER (OF CURRENT TEACHER GROUP) ---------- */
router.get("/students/:semester", authMiddleware, async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!teacher.groupId) {
      return res.status(400).json({ message: "Teacher has no group" });
    }

    const students = await User.find({
      role: "student",
      groupId: teacher.groupId,
      semester: req.params.semester,
    }).select("-password");

    res.json(students);

  } catch (err) {
    console.error("GET STUDENTS ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});






module.exports = router;
