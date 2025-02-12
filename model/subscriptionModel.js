const mongoose = require("mongoose");
const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, enum: ["Medium", "Pro"], required: true },
  amount: { type: Number, required: true, enum: [15, 35] },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  transactionId: { type: String },
  subscriptionStartDate: { type: Date, required: true },
  subscriptionEndDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Support", SubscriptionSchema);
