import express from "express";
import { User } from "../models/UserModel.js";
import { protect, verifySeller } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});


router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, address, password } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    user.address = address || user.address;
    if (password) user.password = password; // hash if needed later

    const updatedUser = await user.save();
    res.json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;