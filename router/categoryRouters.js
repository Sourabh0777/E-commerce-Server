const express = require("express");
const router = express.Router();
const {
  verifyIsLoggedIn,
  verifyIsAdmin,
} = require("../middleware/verifyAuthToken");

const {
  getCategories,
  newCategory,
  deleteCategory,
  saveAttr,
} = require("../controllers/categoryController");
//Routes

router.get("/", getCategories);
router.use(verifyIsLoggedIn);
router.use(verifyIsAdmin);
router.post("/", newCategory);
router.delete("/:category", deleteCategory);
router.post("/attr", saveAttr);

module.exports = router;
