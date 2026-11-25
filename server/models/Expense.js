import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentMethod: { type: String, enum: ["Cash", "Card", "Digital", "Bank transfer"], default: "Cash" },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

expenseSchema.index({ date: -1 });
export default mongoose.model("Expense", expenseSchema);
