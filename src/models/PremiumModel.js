import mongoose from "mongoose";

const premiumSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ["Starter", "Plus", "Max"],
      required: true,
    },
    price: Number,
    stripeSessionId: String,
    stripeCustomerId: String,
    stripeSubscriptionId: String, // ✅ Ei field ache
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "canceled"], // ✅ canceled add koro
      default: "pending",
    },
    startDate: Date,
    endDate: Date,
    nextBillingDate: Date,
    subscriptionId: String, // ✅ Eta redundant, stripeSubscriptionId ei use koro
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "canceled", "past_due"], // ✅ status update koro
      default: "pending",
    },
    isSubscription: { // ✅ EI FIELD ADD KORO - must important!
      type: Boolean,
      default: false
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 🔹 Virtual field: computed status based on endDate
premiumSchema.virtual("computedStatus").get(function () {
  if (this.status === "pending") return "pending";
  return this.endDate && this.endDate > new Date() ? "active" : "inactive";
});

const Premium = mongoose.model("Premium", premiumSchema);
export default Premium;