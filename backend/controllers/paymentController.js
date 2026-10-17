const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const User = require("../models/User");
const Order = require("../models/Order");

const createOrder = async (req, res) => {
  try {
    const options = {
      amount: 49900,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Persist order with authenticating user binding
    await Order.create({
      orderId: order.id,
      user: req.user._id,
      amount: order.amount,
      currency: order.currency,
      status: "created",
    });

    res.json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment verification fields" });
    }

    // 1. Fetch order from database and verify user ownership & state
    const order = await Order.findOne({ orderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: Order does not belong to the authenticated user" });
    }

    if (order.status === "paid") {
      return res.status(409).json({ message: "Conflict: This payment order has already been processed" });
    }

    // 2. Cryptographic HMAC-SHA256 signature verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.status = "failed";
      await order.save();
      return res.status(400).json({ message: "Payment verification failed: Invalid cryptographic signature" });
    }

    // 3. Atomically mark order as paid & upgrade user plan
    order.status = "paid";
    order.paymentId = razorpay_payment_id;
    order.paidAt = new Date();
    await order.save();

    await User.findByIdAndUpdate(req.user._id, { plan: "premium" });

    res.json({ message: "Payment verified successfully, plan upgraded!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
