import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  address: String,
  role: { type: String, enum: ["buyer", "seller"], default: "buyer" }
});

export const User = mongoose.model("User", userSchema);
