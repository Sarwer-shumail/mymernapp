import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true, default: "" },
  color: { type: String, trim: true, default: "blue" },
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
