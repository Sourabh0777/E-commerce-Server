const mongoose = require("mongoose");
const User = require("./UserModel");
const orderSchema = mongoose.Schema(
  {
    //Required
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: User,
    },
    orderTotal: {
      itemCount: { type: Number },
      cartSubTotal: { type: Number },
    },
    cartItems: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { path: { type: String, required: true } },
        quantity: { type: Number, required: true },
        count: { type: Number, required: true }, /// Total No of products in the data base
      },
    ],
    paymentMethod:{
      type:String,
      require:true
    },
    transactionResult: {
      status: { type: String },
      createTime: { type: String },
      amount: { type: Number },
    },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
