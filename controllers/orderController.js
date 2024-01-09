const HttpError = require("../models/http-error");
const ObjectId = require("mongodb").ObjectId;
const Order = require("../models/OrderModel");
const User = require("../models/UserModel");
const Product = require("../models/ProductModel");

const getUserOrders = async (req, res, next) => {
  try {
    const UserId = req.user._id;
    const order = await Order.find({ user: UserId });
    if (order.length == 0) {
      return res.send("No order Found for this user.");
    }
    return res.send(order);
  } catch (error) {
    const err = new HttpError("Unable to get user orders.", 500);
    return next(error || err);
  }
};
const getOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate("user", " -password -isAdmin -_id -__v -createdAt -updatedAt").orFail();
    if (order.length == 0) {
      return res.send("No order Found for this user.");
    }
    return res.send(order);
  } catch (error) {
    const err = new HttpError("Unable to get order", 500);
    return next(error || err);
  }
};
const createOrder = async (req, res, next) => {
  try {
    const { orderTotal, cartItems, paymentMethod } = req.body;
    if (!orderTotal || !cartItems || !paymentMethod) {
      const err = new HttpError("All input fields are required", 400);
      return next(err);
    }
    let ids = cartItems.map((item) => {
      return item.productId;
    });
    let qty = cartItems.map((item) => {
      return Number(item.quantity);
    });
    await Product.find({ _id: { $in: ids } }).then((products) => {
      products.forEach((product, idx) => {
        product.sales += qty[idx];
        product.save();
      });
    });

    const { _id } = req.user;
    const user = await User.findById(_id);
    const order_id = new ObjectId();
    const order = new Order({
      _id: order_id,
      user: _id,
      orderTotal: orderTotal,
      cartItems: cartItems,
      paymentMethod: paymentMethod,
    });
    const createdOrder = await order.save();
    return res.send(createdOrder);
  } catch (error) {
    const err = new HttpError("Unable to book order", 500);
    return next(error || err);
  }
};
const updateOrderPaid = async (req, res, next) => {
  try {
    const { isPaid } = req.body;
    const order = await Order.findById(req.params.id).orFail();
    order.isPaid = true;
    order.paidAt = Date.now();
    const updatedOrder = await order.save();
    return res.send(updatedOrder);
  } catch (error) {
    const err = new HttpError("Unable to update paid status.", 500);
    return next(error || err);
  }
};
const updateOrderDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).orFail();
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updatedOrder = await order.save();
    return res.send(updatedOrder);
  } catch (error) {
    const err = new HttpError("Unable to Change status of order delivery.", 500);
    return next(error || err);
  }
};

const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate("user", "-password").sort({ paymentMethod: "desc" });
    return res.send(orders);
  } catch (error) {
    const err = new HttpError("Unable fetch orders", 500);
    return next(error || err);
  }
};

const getOrderForAnalysis = async (req, res, next) => {
  try {
    const { date } = req.params;

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const order = await Order.find({
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: "asc" });
    return res.send(order);
  } catch (error) {
    const err = new HttpError("Unable to get user profile", 500);
    return next(error || err);
  }
};
module.exports = {
  getUserOrders,
  getOrder,
  createOrder,
  updateOrderPaid,
  updateOrderDelivered,
  getAdminOrders,
  getOrderForAnalysis,
};
