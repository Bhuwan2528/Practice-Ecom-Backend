import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  image: String,
  tags: [String],
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  soldCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);
