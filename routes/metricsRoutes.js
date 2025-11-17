import express from "express";
import { protect, verifySeller } from "../middleware/authMiddleware.js";
import { Product } from "../models/ProductModel.js";

const router = express.Router();

// ✅ Seller Metrics Route
router.get("/seller", protect, verifySeller, async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get all products by this seller
    const products = await Product.find({ sellerId });

    const totalProducts = products.length;
    const totalProductsSold = products.reduce((sum, p) => sum + (p.soldCount || 0), 0);
    const totalEarnings = products.reduce((sum, p) => sum + (p.soldCount * p.price), 0);

    // 🔹 Generate fake daily earnings data (for now)
    // later, you can replace it with real `Order` data if available
    const earningsByDay = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formatted = date.toISOString().split("T")[0];

      // just random variation for demo
      const dailyEarning = Math.floor(Math.random() * 5000 + 1000);

      earningsByDay.push({ date: formatted, earnings: dailyEarning });
    }

    // Product-wise sales
    const salesList = products.map((p) => ({
      name: p.title,
      image: p.image,
      quantitySold: p.soldCount,
    }));

    res.json({
      totalProducts,
      totalProductsSold,
      totalEarnings,
      salesList,
      earningsByDay, // for graph
    });
  } catch (err) {
    console.error("Metrics Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
