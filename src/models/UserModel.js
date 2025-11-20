import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, "First Name is Required"],
    },
    lastName: {
      type: String,
      required: [true, "Last Name Is Required"],
    },
    password: String,
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    name: String,
    image: String,
    location: String,

    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpireDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual to check if premium is currently active
userSchema.virtual("activePremium").get(function () {
  if (!this.isPremium) return false;
  if (!this.premiumExpireDate) return false;
  return this.premiumExpireDate > new Date();
});

// Pre-save hook to auto-disable expired premium
userSchema.pre("save", function (next) {
  if (this.isPremium && this.premiumExpireDate && this.premiumExpireDate < new Date()) {
    this.isPremium = false;
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
