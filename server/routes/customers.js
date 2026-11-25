import express from "express";
import Customer from "../models/Customer.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

// GET all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ id: 1 });
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error.message);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

// POST create customer
router.post("/", async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name?.trim() || !/^0\d{10}$/.test(phone?.trim() || "")) {
      return res.status(400).json({ message: "Provide a customer name and an 11-digit contact number starting with 0" });
    }

    // Generate unique ID
    const lastCustomer = await Customer.findOne().sort({ id: -1 });
    const nextId = lastCustomer ? lastCustomer.id + 1 : 1;

    const newCustomer = await Customer.create({
      id: nextId,
      name: name.trim(),
      phone: phone.trim(),
      orders: 0,
    });

    res.status(201).json({
      message: "Customer added successfully!",
      customer: newCustomer,
    });
  } catch (error) {
    console.error("Error adding customer:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: "A customer with this ID already exists" });
    }
    res.status(500).json({ message: "Failed to add customer" });
  }
});

// DELETE customer
router.delete("/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const deleted = await Customer.findOneAndDelete({ id: customerId });
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully!" });
  } catch (error) {
    console.error("Error deleting customer:", error.message);
    res.status(500).json({ message: "Failed to delete customer" });
  }
});

export default router;
