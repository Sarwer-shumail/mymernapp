import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  qty: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  supplierId: { type: Number, required: true },
  supplierName: { type: String, required: true, trim: true },
  items: { type: [purchaseItemSchema], validate: value => value.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  paymentStatus: { type: String, enum: ["Paid", "Unpaid", "Partially Paid"], default: "Unpaid" },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

purchaseSchema.index({ date: -1 });
export default mongoose.model("Purchase", purchaseSchema);
