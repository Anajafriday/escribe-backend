const mongoose = require("mongoose");

// Max file size (in bytes) for OpenAI Whisper based on plan
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const AudioFileSchema = new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileName: {
    type: String,
    required: [true, "File must have a name"],
    trim: true,
  },
  fileUrl: {
    type: String,
    required: [true, "An audio file must have a URL"],
  }, // URL of the file stored externally
  fileSize: {
    type: Number,
    required: [true, "File size must be specified"],
    validate: {
      validator: function (value) {
        return value <= MAX_FILE_SIZE_BYTES;
      },
      message: `File size must not exceed ${MAX_FILE_SIZE_MB} MB`,
    },
  }, // Size in bytes
  duration: { type: Number, required: true }, // Duration in seconds
  transcriptionStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AudioFileSchema.methods.updateTranscripeStatus = async function (newStatus) {
  if (!["Pending", "Completed", "Failed"].includes(newStatus)) {
    throw new Error('Invalid status value');
  }
  this.transcriptionStatus = newStatus;
  if (this.transcriptionStatus === "Completed") this.updatedAt = new Date()
  await this.save()
}
// Exporting the model
module.exports = mongoose.model("Audio", AudioFileSchema);
