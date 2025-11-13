import jwt from "jsonwebtoken";
import redisClient from "../services/radis.service.js";

export const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      (authHeader && authHeader.split(" ")[1]) ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Check if token is blacklisted in Redis
    let isBlackListed = false;
    try {
      isBlackListed = await redisClient.get(token);
    } catch (e) {
      console.warn("Redis check skipped:", e.message);
    }

    if (isBlackListed) {
      res.clearCookie("token");
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to req
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
