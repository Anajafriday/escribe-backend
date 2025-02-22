const mongoose = require("mongoose");
const { default: isEmail } = require("validator/lib/isEmail");
const SupportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  email: {
    type: String,
    required: [true, "pls provide your email address"],
    validator: [isEmail, "pls provide a valid email address"],
  },
  subject: { type: String, required: [true, "subject is required"] },
  message: { type: String, required: [true, "pls specify your message"] },
  status: { type: String, enum: ["Open", "Resolved"], default: "Open" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SupportSchema.methods.updateSupportStatus = async function (newStatus) {
  if (!["Open", "Resolved"].includes(newStatus)) {
    throw new Error('Invalid status value');
  }
  this.status = newStatus;
  if (this.status === "Resolved") this.updatedAt = new Date()
}
module.exports = mongoose.model("Support", SupportSchema);
