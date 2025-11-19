import mongoose from "mongoose";

const premiumSchema = mongoose.Schema({
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
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  startDate: Date,
  endDate: Date,
  status:String,
}, { timestamps: true });

const Premium = mongoose.model("Premium", premiumSchema);
export default Premium;
