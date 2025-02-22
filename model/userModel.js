const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { default: isEmail } = require("validator/lib/isEmail");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Tell us your name"] },
  email: {
    type: String,
    required: [true, "Please provide your email address"],
    unique: true,
    validate: [isEmail, "Please provide a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: 8,
    select: false, // Exclude from queries
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  // Subscription & Plan
  plan: { type: String, enum: ["Free Trial", "Medium", "Pro"], default: "Free Trial" },
  isTrialActive: { type: Boolean, default: true },
  trialStartDate: { type: Date, default: Date.now },
  trialEndDate: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24 hrs
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  dailyTranscriptionLimit: { type: Number, default: 10 },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // Remove confirm field
  next();
});

// Method to check password
UserSchema.methods.checkCorrectPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};



// Generate Password Reset Token
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
