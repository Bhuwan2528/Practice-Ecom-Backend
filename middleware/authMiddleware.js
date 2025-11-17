import jwt from "jsonwebtoken";
import { User } from "../models/UserModel.js";

// ✅ Only verify token from cookies (no header check)
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token; // token directly from cookie

    if (!token) {
      return res.status(401).json({ message: "Please login first!" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user from DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Allow only sellers
export const verifySeller = (req, res, next) => {
  if (req.user && req.user.role === "seller") {
    next();
  } else {
    res.status(403).json({ message: "Access denied! Only sellers allowed." });
  }
};
