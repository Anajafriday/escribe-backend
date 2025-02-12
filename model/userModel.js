const mongoose = require("mongoose");
const { default: isEmail } = require("validator/lib/isEmail");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, "tell us your name"] },
  email: {
    type: String,
    required: [true, "pls provide your email address"],
    unique: true,
    validator: [isEmail, "pls provide a valid email address"],
  },
  password: {
    type: String,
    required: [true, "pls provide a password"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "pls confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password are not the same",
    },
  },
  //   plans and subscription
  plan: {
    type: String,
    enum: ["Free Trial", "Medium", "Pro"],
    default: "Free Trial",
  },
  isTrialActive: { type: Boolean, default: true }, // Tracks if the free trial is active
  trialStartDate: { type: Date, default: Date.now }, // Start date of the trial
  trialEndDate: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }, // 24 hours from creation
  },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  dailyTranscriptionLimit: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
