import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.active) return res.status(401).json({ message: "Account is unavailable" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
}
