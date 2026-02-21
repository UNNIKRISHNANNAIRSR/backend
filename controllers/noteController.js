// exports.uploadNote = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "File not uploaded" });
//     }

//     const note = await Note.create({
//       title: req.body.title,
//       description: req.body.description,
//       semester: req.body.semester,
//       department: req.body.department,
//       fileUrl: `/uploads/notes/${req.file.filename}`,
//       uploadedBy: req.user.id,
//       groupId: req.user.groupId,
//     });

//     res.status(201).json({
//       message: "Note uploaded successfully",
//       note,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };




exports.uploadNote = async (req, res) => {
  try {
    // only teacher can upload
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can upload notes" });
    }

    // user must be in a group
    if (!req.user.groupId) {
      return res.status(400).json({ message: "Join a group first" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File not uploaded" });
    }

    const note = await Note.create({
      title: req.body.title,
      description: req.body.description,

      // take trusted values from logged-in user
      semester: req.user.semester,
      department: req.user.department,

      fileUrl: `/uploads/notes/${req.file.filename}`,
      uploadedBy: req.user.id,
      groupId: req.user.groupId,
    });

    res.status(201).json({
      message: "Note uploaded successfully",
      note,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
