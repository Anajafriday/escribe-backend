const mongoose = require("mongoose");

const TranscriptionSchema = new mongoose.Schema({
  audio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Audio",
    required: true,
  },
  // user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transcript: {
    type: mongoose.Schema.Types.Mixed, // Can be either a string or an array of objects
    required: [true, "Transcript is required."]
  },
  format: { type: String, enum: ["TXT", "PDF", "SRT"], default: "TXT" },
  language: { type: String, default: "eng" },
  translationAvailable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transcription", TranscriptionSchema);
