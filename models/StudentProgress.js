const mongoose = require("mongoose");

const studentProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  notesRead: { type: Number, default: 0 },
  totalNotes: { type: Number, default: 0 },
  booksRead: { type: Number, default: 0 },
});

module.exports = mongoose.model("StudentProgress", studentProgressSchema);
