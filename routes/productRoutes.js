import express from "express";
import { protect, verifySeller } from "../middleware/authMiddleware.js";
import { Product } from "../models/ProductModel.js";

const router = express.Router();

/* ============================================================
   🛍️ 1️⃣ Add Product (Only for Sellers)
   ------------------------------------------------------------
   - First, 'protect' ensures the user is logged in (JWT verified)
   - Then, 'verifySeller' ensures that the logged-in user is a seller
   ============================================================ */
router.post("/add", protect, verifySeller, async (req, res) => {
  try {
    const { name, price, description, image, tags } = req.body;

    const newProduct = new Product({
      title: name,
      price,
      description,
      image,
      tags: tags ? tags.split(",").map(tag => tag.trim()) : [], // 👈 convert "tag1, tag2" → ["tag1", "tag2"]
      sellerId: req.user._id,
    });

    await newProduct.save();
    res.status(201).json({ message: "✅ Product added successfully!", product: newProduct });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Seller’s own products
router.get("/seller", protect, verifySeller, async (req, res) => {
  try {
    const sellerId = req.user._id;
    const products = await Product.find({ sellerId });
    res.json(products);
  } catch (err) {
    console.error("Error fetching seller products:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Delete product (seller only)
router.delete("/:id", protect, verifySeller, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.sellerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Update product (Edit)
router.put("/:id", protect, verifySeller, async (req, res) => {
  try {
    const { title, description, price, image, tags } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    // ✅ Allow only product’s own seller to update
    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ✅ Update fields
    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.image = image || product.image;
    product.tags = tags || product.tags;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================================
   🛒 2️⃣ Get All Products (For Buyers / Everyone)
   ------------------------------------------------------------
   - Anyone can view this route
   - Populates seller details (name + email)
   ============================================================ */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("sellerId", "name email");
    res.status(200).json(products);
  } catch (err) {
    console.error("Get Products Error:", err.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* ============================================================
   💳 3️⃣ Buy Product (Only Logged-in Users)
   ------------------------------------------------------------
   - 'protect' ensures user is logged in (buyer or seller)
   - Increments sold count to simulate purchase
   ============================================================ */
router.post("/buy/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "❌ Product not found" });
    }

    // Simulating a purchase (in real app, you'd also store order info)
    product.soldCount = (product.soldCount || 0) + 1;
    await product.save();

    res.status(200).json({ message: "🎉 Product purchased successfully!" });
  } catch (err) {
    console.error("Buy Product Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q; // user ka search text

    if (!query) return res.json([]);

    const words = query.split(" "); // "denim jackets" → ["denim", "jackets"]

    // 1) EXACT TAG MATCH — sabse upar dikhna chahiye
    const exactMatches = await Product.find({
      tags: { $in: [query.toLowerCase()] }
    });

    // 2) PARTIAL TAG MATCH — similar tags
    const partialMatches = await Product.find({
      tags: {
        $in: words.map((w) => new RegExp(w, "i"))
      }
    });

    // 3) TITLE/DESCRIPTION MATCH — last priority
    const textMatches = await Product.find({
      $or: [
        { title: new RegExp(query, "i") },
        { description: new RegExp(query, "i") }
      ]
    });

    // Combine all results
    let combined = [...exactMatches, ...partialMatches, ...textMatches];

    // Remove duplicates
    const unique = Array.from(new Set(combined.map(p => p._id.toString())))
      .map(id => combined.find(p => p._id.toString() === id));

    res.json(unique);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
});


export default router;
