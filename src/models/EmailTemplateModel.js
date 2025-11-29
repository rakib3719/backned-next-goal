import mongoose, { Schema } from "mongoose";
import User from "./UserModel.js";

export const EmailTemplateSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId
      ref:  User,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name:{
      type:String,
      required: true
    },

    // Formatted template storage
    template: {
      subject: {
        type: String,
        required: true,
        trim: true,
      },
      body: {
        type: String,
        required: true,
      },
      raw: {
        type: String, // optional full raw text version
        default: "",
      },
    }
  },
  { timestamps: true }
);

const EmailTemplate = mongoose.model("EmailTemplate", EmailTemplateSchema);

export default EmailTemplate;
