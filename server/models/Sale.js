import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    unitCost: { type: Number, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: Number,
      min: 1,
    },
    items: [saleItemSchema],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      default: "Completed",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
