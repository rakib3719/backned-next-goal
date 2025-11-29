import mongoose, { Schema, model } from "mongoose";

const CoachSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    school: {
      type: String,
      required: true,
      trim: true,
    },
    conference: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    gender:String,
     division:String
  },
  {
    timestamps: true,
  }
);

const Coach = model("Coach", CoachSchema);

export default Coach;
