// const Group = require("../models/Group");
// const User = require("../models/User");

// // Generate unique group code
// const generateGroupCode = () => {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// };
// // exports.createGroup = async (req, res) => {
// //   try {
// //     const { collegeName, department, semester } = req.body;
// //     const user = await User.findById(req.user.id);

// //     if (user.role !== "teacher") {
// //       return res.status(403).json({ message: "Only teachers can create groups" });
// //     }

// //     if (user.groupId) {
// //       return res.status(400).json({ message: "Leave current group first" });
// //     }

// //     const groupCode = generateGroupCode();

// //     const group = await Group.create({
// //       collegeName,
// //       department,
// //       semester,
// //       groupCode,
// //       createdBy: user._id,
// //     });

// //     // 🔴 IMPORTANT FIX
// //     user.groupId = group._id;
// //     user.groupCode = groupCode;
// //     user.department = department;
// //     user.semester = semester;

// //     await user.save();

// //     res.status(201).json({
// //       message: "Group created successfully",
// //       group,
// //     });
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // };
// exports.createGroup = async (req, res) => {
//   try {
//     const { collegeName, departments, totalSemesters } = req.body;

//     const user = await User.findById(req.user.id);

//     if (user.role !== "teacher") {
//       return res.status(403).json({ message: "Only teachers can create groups" });
//     }

//     if (user.groupId) {
//       return res.status(400).json({ message: "Leave current group first" });
//     }

//     const groupCode = generateGroupCode();

//     const group = await Group.create({
//       collegeName,
//       departments,        // ✅ REQUIRED BY SCHEMA
//       totalSemesters,     // ✅ REQUIRED BY SCHEMA
//       groupCode,
//       department,   // ← THIS
//       semester,
//       createdBy: user._id,
//     });

//     user.groupId = group._id;
//     user.groupCode = groupCode;

//     await user.save();

//     res.status(201).json({
//       message: "Group created successfully",
//       group,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// // 🔍 GET GROUP BY CODE (PREVIEW)
// exports.getGroupByCode = async (req, res) => {
//   try {
//     const code = req.params.groupCode.toUpperCase();

//     const group = await Group.findOne({ groupCode: code });

//     if (!group) {
//       return res.status(404).json({
//         message: "No group found with this code",
//       });
//     }

//     res.json({
//       _id: group._id,
//       collegeName: group.collegeName,
//       departments: group.departments,
//       totalSemesters: group.totalSemesters,
//       groupCode: group.groupCode,
     
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// // 🟢 JOIN GROUP (Teacher / Student)
// exports.joinGroup = async (req, res) => {
//   try {
//     const { groupCode, department, semester, rollNo } = req.body;
//     const user = await User.findById(req.user.id);

//     if (user.groupId) {
//       return res.status(400).json({ message: "Already in a group" });
//     }

//     const group = await Group.findOne({ groupCode });
//     if (!group) {
//       return res.status(404).json({ message: "Invalid group code" });
//     }

//     // STUDENT JOIN
//     if (user.role === "student") {
//       if (!department || !semester || rollNo == null) {
//         return res.status(400).json({
//           message: "Department, semester and rollNo required",
//         });
//       }

//       user.department = department;
//       user.semester = semester;
//       user.rollNo = rollNo;
//     }

//     // TEACHER JOIN (OTHER TEACHERS)
//     if (user.role === "teacher") {
//       if (!department || !semester) {
//         return res.status(400).json({
//           message: "Department and semester required",
//         });
//       }

//       user.department = department;
//       user.semester = semester;
//     }

//     user.groupId = group._id;
//     user.groupCode = group.groupCode;

//     await user.save();

//     res.json({
//       message: "Joined group successfully",
//       group,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// // 🟢 LEAVE GROUP
// exports.leaveGroup = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     user.groupId = null;
//     user.groupCode = null;
//     await user.save();

//     res.json({ message: "Left group successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


const Group = require("../models/Group");
const User = require("../models/User");

// Generate unique group code
const generateGroupCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};



// ✅ CREATE GROUP (FIXED)
exports.createGroup = async (req, res) => {
  try {
    const { collegeName, departments, totalSemesters, department, semester } = req.body;

    const user = await User.findById(req.user.id);

    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create groups" });
    }

    if (user.groupId) {
      return res.status(400).json({ message: "Already in a group " });
    }

    const groupCode = generateGroupCode();

    const group = await Group.create({
      collegeName,
      departments,
      totalSemesters,
      groupCode,
      createdBy: user._id,
    });

    // ✅ VERY IMPORTANT FIX
    user.groupId = group._id;
    user.groupCode = groupCode;
    user.department = department;   // ✅ FIXED
    user.semester = semester;       // ✅ FIXED

    await user.save();

    res.status(201).json({
      message: "Group created successfully",
      group,
      user, // ✅ send updated user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 🔍 GET GROUP BY CODE (NO CHANGE)
exports.getGroupByCode = async (req, res) => {
  try {
    const code = req.params.groupCode.toUpperCase();

    const group = await Group.findOne({ groupCode: code });

    if (!group) {
      return res.status(404).json({
        message: "No group found with this code",
      });
    }

    res.json({
      _id: group._id,
      collegeName: group.collegeName,
      departments: group.departments,
      totalSemesters: group.totalSemesters,
      groupCode: group.groupCode,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ JOIN GROUP (MINOR IMPROVEMENT: RETURN USER)
exports.joinGroup = async (req, res) => {
  try {
    const { groupCode, department, semester, rollNo } = req.body;
    const user = await User.findById(req.user.id);

    if (user.groupId) {
      return res.status(400).json({ message: "Already in a group" });
    }

    const group = await Group.findOne({ groupCode });
    if (!group) {
      return res.status(404).json({ message: "Invalid group code" });
    }

    if (user.role === "student") {
      if (!department || !semester || rollNo == null) {
        return res.status(400).json({
          message: "Department, semester and rollNo required",
        });
      }

      user.department = department;
      user.semester = semester;
      user.rollNo = rollNo;
    }

    if (user.role === "teacher") {
      if (!department || !semester) {
        return res.status(400).json({
          message: "Department and semester required",
        });
      }

      user.department = department;
      user.semester = semester;
    }

    user.groupId = group._id;
    user.groupCode = group.groupCode;

    await user.save();

    res.json({
      message: "Joined group successfully",
      group,
      user, // ✅ IMPORTANT
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/* ================= LEAVE GROUP ================= */
exports.leaveGroup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.groupId) {
      return res.status(400).json({ message: "You are not in any group" });
    }

    // Clear everything
    user.groupId = null;
    user.groupCode = null;
    user.department = null;
    user.semester = null;
    user.rollNo = null;

    await user.save();

    res.json({
      message: "Left group successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

