const connectDB = require("../config/DB");
connectDB();

const categoryData = require("./Categories");
const Category = require("../models/CategoryModel");
const Product = require("../models/ProductModel");
const productData = require("./products");

const Review = require("../models/ReviewModel");
const reviewData = require("./reviews");
const User = require("../models/UserModel");
const userData = require("./users");

const Order = require("../models/OrderModel")
const orderData = require("./orders")
const importData = async () => {
  try {
    await Category.collection.dropIndexes();
    await Product.collection.dropIndexes();

    await Category.collection.deleteMany({});
    await Product.collection.deleteMany({});
    await Review.collection.deleteMany({});
    await User.collection.deleteMany({})
    await Order.collection.deleteMany({})
    
    await Category.insertMany(categoryData);
    const reviews = await Review.insertMany(reviewData);
    const sampleProducts = productData.map((product) => {
      reviews.map((review) => {
        product.reviews.push(review._id);
      });
      return { ...product };
    });
    await Product.insertMany(sampleProducts);
    await User.insertMany(userData);
    await Order.insertMany(orderData)
    console.log("Seeder data proceeded successfully");
    process.exit();
  } catch (error) {
    console.error("Error while proccessing seeder data", error);
    process.exit(1);
  }
};
importData();
