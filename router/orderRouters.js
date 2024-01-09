const express = require("express");
const router = express.Router();
const {
  getUserOrders,
  getOrder,
  createOrder,
  updateOrderPaid,
  updateOrderDelivered,
  getAdminOrders,
  getOrderForAnalysis,
} = require("../controllers/orderController");
const {
  verifyIsAdmin,
  verifyIsLoggedIn,
} = require("../middleware/verifyAuthToken");

router.use(verifyIsLoggedIn);
router.get("/", getUserOrders);
router.get("/user/:id", getOrder);
router.post("/", createOrder);
router.put("/paid/:id", updateOrderPaid);

router.use(verifyIsAdmin);
router.put("/delivered/:id", updateOrderDelivered);
router.get("/admin", getAdminOrders);
router.get("/analysis/:date", getOrderForAnalysis);

module.exports = router;
