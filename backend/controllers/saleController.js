// controllers/saleController.js

import Sale from "../models/Sale.js";
import Inventory from "../models/Inventory.js";

export const addSale = async (req, res) => {
  try {
    const { type, collectorName, product, quantity, rate } = req.body;

    const total = quantity * rate;

    // 🔥 Inventory update
    if (type === "PRODUCT") {
      const item = await Inventory.findById(product);
      if (!item) return res.status(404).json({ msg: "Product not found" });

      if (item.quantity < quantity) {
        return res.status(400).json({ msg: "Not enough stock" });
      }

      item.quantity -= quantity;
      await item.save();
    }

    const sale = await Sale.create({
      type,
      // farmer,
      collectorName,
      product,
      quantity,
      rate,
      total,
    });

    res.json(sale);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      // .populate("farmer")
      .populate("product")
      .sort({ date: -1 });

    res.json(sales);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
