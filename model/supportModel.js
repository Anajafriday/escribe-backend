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

module.exports = mongoose.model("Support", SupportSchema);
