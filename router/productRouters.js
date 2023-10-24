const express = require("express");
const router = express.Router();
const { verifyIsLoggedIn,verifyIsAdmin } = require("../middleware/verifyAuthToken");
const {
  getProducts,
  getProductById,
  getBestSellers,
  adminGetProducts,
  adminDeleteProducts,
  adminCreateProducts,
  adminUpdateProducts,
  adminUpload,
  adminDeleteProductsImage,
} = require("../controllers/productController");
router.get("/category/:categoryName/search/:searchQuery", getProducts);
router.get("/category/:categoryName", getProducts);
router.get("/search/:searchQuery", getProducts);
router.get("/", getProducts);
router.get("/bestsellers", getBestSellers);
router.get("/get-one/:id", getProductById);

//Admin Routes
router.use(verifyIsLoggedIn);
router.use(verifyIsAdmin)
router.get("/admin", adminGetProducts);
router.delete("/admin/:id", adminDeleteProducts);
router.delete("/admin/image/:imagePath/:productId", adminDeleteProductsImage);
router.put("/admin/:id", adminUpdateProducts);
router.post("/admin/upload", adminUpload);
router.post("/admin", adminCreateProducts);

getProductById;

module.exports = router;
