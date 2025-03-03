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
    select: false,
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
  passwordUpdatedAt: { type: Date },
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

// 
UserSchema.methods.CheckPasswordChanged = function (JWTtimeStamp) {
  if (this.passwordUpdatedAt) {
    const passwordUpdatedAtTimestamp = parseInt(
      this.passwordUpdatedAt.getDate() / 1000,
      10
    );
    return JWTtimeStamp < passwordUpdatedAtTimestamp;
  }
  // return false meaning password is not changed
  return false;
};
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
// 
UserSchema.methods.decreaseTranscriptionLimit = async function () {
  // Check if the user is on a free trial and has remaining transcriptions
  if (this.isTrialActive && new Date() < new Date(this.trialEndDate)) {
    if (this.dailyTranscriptionLimit > 0) {
      this.dailyTranscriptionLimit -= 1; // Reduce the limit by 1
      await this.save(); // Save the updated limit
      return true; // Allow transcription
    } else {
      return false; // No transcriptions left
    }
  }

  return true; // Allow if not on free trial
};

module.exports = mongoose.model("User", UserSchema);
