import express from "express";
import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const { from, to, supplierId, paymentStatus } = req.query;
    const filter = {};
    if (supplierId) filter.supplierId = Number(supplierId);
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) filter.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
    res.json(await Purchase.find(filter).sort({ date: -1 }).lean());
  } catch (error) {
    console.error("List purchases failed:", error.message);
    res.status(500).json({ message: "Failed to load purchases" });
  }
});

router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  const supportsTransactions = /ReplicaSet|Sharded/.test(mongoose.connection.client?.topology?.description?.type || "");
  try {
    if (supportsTransactions) session.startTransaction();
    const supplierId = Number(req.body.supplierId);
    const supplier = Number.isInteger(supplierId) ? await Supplier.findOne({ id: supplierId }).session(session) : null;
    const items = req.body.items;
    if (!supplier || !Array.isArray(items) || !items.length) return res.status(400).json({ message: "Select a supplier and at least one product" });

    const seen = new Set();
    const purchaseItems = [];
    let subtotal = 0;
    for (const item of items) {
      const productId = Number(item.productId);
      const qty = Number(item.qty);
      const unitCost = Number(item.unitCost);
      if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(qty) || qty < 1 || !Number.isFinite(unitCost) || unitCost < 0 || seen.has(productId)) {
        return res.status(400).json({ message: "Each purchase item needs a valid product, quantity, and unit cost" });
      }
      seen.add(productId);
      const product = await Product.findOne({ id: productId }).session(session);
      if (!product) return res.status(404).json({ message: `Product ${productId} not found` });
      purchaseItems.push({ productId, name: product.name, qty, unitCost });
      subtotal += qty * unitCost;
    }
    const discount = Number(req.body.discount || 0);
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) return res.status(400).json({ message: "Discount must be between zero and the subtotal" });
    const total = subtotal - discount;
    const amountPaid = Number(req.body.amountPaid || 0);
    if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > total) return res.status(400).json({ message: "Payment must be between zero and the purchase total" });
    const paymentStatus = amountPaid === total ? "Paid" : amountPaid > 0 ? "Partially Paid" : "Unpaid";
    const last = await Purchase.findOne().sort({ createdAt: -1 }).session(session);
    const lastNumber = last ? Number(last.id.replace("P-", "")) : 999;
    const id = `P-${lastNumber + 1}`;
    const [purchase] = await Purchase.create([{
      id, supplierId: supplier.id, supplierName: supplier.name, items: purchaseItems,
      subtotal, discount, total, amountPaid, paymentStatus, date: req.body.date || new Date(), createdBy: req.user?._id,
    }], { session });
    for (const item of purchaseItems) {
      await Product.updateOne({ id: item.productId }, { $inc: { stock: item.qty }, $set: { purchasePrice: item.unitCost, supplierId: supplier.id } }, { session });
    }
    if (supportsTransactions) await session.commitTransaction();
    res.status(201).json(purchase.toObject());
  } catch (error) {
    if (supportsTransactions) await session.abortTransaction().catch(() => {});
    console.error("Create purchase failed:", error.message);
    res.status(500).json({ message: "Failed to record purchase. Ensure MongoDB supports transactions." });
  } finally {
    await session.endSession();
  }
});

router.post("/:id/payment", async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ id: req.params.id });
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });
    const payment = Number(req.body.amount);
    if (!Number.isFinite(payment) || payment <= 0 || purchase.amountPaid + payment > purchase.total) return res.status(400).json({ message: "Enter a valid amount up to the remaining balance" });
    purchase.amountPaid += payment;
    purchase.paymentStatus = purchase.amountPaid === purchase.total ? "Paid" : "Partially Paid";
    await purchase.save();
    res.json(purchase);
  } catch (error) {
    console.error("Record purchase payment failed:", error.message);
    res.status(500).json({ message: "Failed to record payment" });
  }
});
export default router;
