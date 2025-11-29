// models/EmailModel.js
import mongoose, { Schema } from "mongoose";
import Coach from "./CoachModel.js";

const EmailSchema = new Schema(
  {
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coach",
      required: true,
    },
    engagementScore: {
      type: Number,
      default: 0,
    },
    // Additional fields for better tracking
    subject: {
      type: String,
      default: ""
    },
    recipient: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      default: ""
    },
    messageId: {
      type: String, // Nodemailer message ID
      default: ""
    },
    attachmentsCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'delivered'],
      default: 'sent'
    }
  },
  {
    timestamps: true,
  }
);

// Optional: Add index for better query performance
EmailSchema.index({ coach: 1, date: 1 });
EmailSchema.index({ createdAt: -1 });

const Email = mongoose.model("Email", EmailSchema);
export default Email;