// const mongoose = require("mongoose");

// const noteSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//     },

//     description: {
//       type: String,
//     },

//     department: {
//       type: String,
//       required: true,
//     },

//     semester: {
//       type: String,
//       required: true, // 🔑 important
//     },

//     fileUrl: {
//       type: String,
//       required: true,
//     },

//     uploadedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     collegeId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "College",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Note", noteSchema);






const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    department: {
      type: String,
      required: true, // 🔑 important
    },

    semester: {
      type: String,
      required: true, // 🔑 important
    },

    fileUrl: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

   collegeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "College",
  required: true,
}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
