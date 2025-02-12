const mongoose = require("mongoose");

const TranslationSchema = new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transcriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transcription",
    required: true,
  },
  sourceLanguage: {
    type: String,
    required: [true, "pls provide the language you want to translate from"],
    default: "English",
  },
  targetLanguage: {
    type: String,
    required: [true, "pls provide the language you want to translate to"],
  },
  translatedText: {
    type: String,
    required: [true, "pls provide the text you have  translated"],
  },
  translationTool: { type: String, default: "Google Translate" }, // Or provide the tool used
  translationStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TranslationSchema.methods.updateTranslationStatus = async function (newStatus) {
  if (!["Pending", "Completed", "Failed"].includes(newStatus)) {
    throw new Error('Invalid status value');
  }
  this.translationStatus = newStatus;
  if (this.translationStatus === "Completed") this.updatedAt = new Date()
}
module.exports = mongoose.model("Translation", TranslationSchema);
