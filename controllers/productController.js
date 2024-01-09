const Product = require("../models/ProductModel");
const HttpError = require("../models/http-error");
const recordsPerPage = require("../config/pagination");
const imageValidate = require("../utils/imageValidate");
const { log } = require("console");
const getProducts = async (req, res, next) => {
  try {
    let query = {};
    let sort = {};
    let select = {};
    let queryCondition = false;

    //Price query Condition
    let priceQueryCondition = {};
    if (req.query.price) {
      queryCondition = true;
      priceQueryCondition = { price: { $lte: Number(req.query.price) } };
    }
    //
    //Rating query Condition
    let ratingQueryCondition = {};
    if (req.query.rating) {
      queryCondition = true;
      ratingQueryCondition = { rating: { $in: req.query.rating.split(",") } };
    }
    //
    // Category Query Condition , as category is coming from params/end point not like query
    let categoryQueryCondition = {};
    const categoryName = req.params.categoryName || "";
    if (categoryName) {
      queryCondition = true;
      let a = categoryName.replaceAll(",", "/");
      var regEx = new RegExp("^" + a);
      categoryQueryCondition = { category: regEx };
    }
    if (req.query.category) {
      //When user search filter when open products products
      queryCondition = true;
      let a = req.query.category.split(",").map((item) => {
        if (item) {
          return new RegExp("^" + item);
        }
      });
      categoryQueryCondition = { category: { $in: a } };
    }
    //
    //Attributes Query Condition
    let attrsQueryCondition = [];
    if (req.query.attrs) {
      queryCondition = true;
      attrsQueryCondition = req.query.attrs.split(",").reduce((acc, item) => {
        if (item) {
          let a = item.split("-");
          let value = [...a];
          value.shift();
          let a1 = {
            attrs: { $elemMatch: { key: a[0], value: { $in: value } } },
          };
          acc.push(a1);
          console.dir(acc, { depth: null });
          return acc;
        }
      }, []);
      console.dir(attrsQueryCondition, { depth: null });
    }
    //
    //For page number
    const pageNum = Number(req.query.pageNum) || 1;
    //

    //For Sorting
    //render list radio buttoPrice high to low, low to high a-z and z-a
    //Example sort({name:-1}) z-a
    const sortOption = req.query.sort || "";
    if (sortOption) {
      let sortOpt = sortOption.split("_");
      sort = { [sortOpt[0]]: Number(sortOpt[1]) };
      //If we want to create JavaScript object with dynamic key name.
    }
    //

    //Search bar param in url condition
    const searchQuery = req.params.searchQuery || "";
    let searchQueryCondition = {};
    if (searchQuery) {
      queryCondition = true;
      searchQueryCondition = { $text: { $search: searchQuery } };
      select = {
        score: {
          $meta: "textScore",
        },
      };
      sort = { score: { $meta: "textScore" } };
    }
    //

    //Query Conditions ended

    //Creating Query
    if (queryCondition) {
      query = {
        $and: [
          priceQueryCondition,
          ratingQueryCondition,
          categoryQueryCondition,
          searchQueryCondition,
          ...attrsQueryCondition,
        ],
      };
      //performs a logical AND operation on an array of one or more expressions
    }
    //

    //Total number of products
    //query is the query to filter out the products
    const totalProducts = await Product.countDocuments(query);
    //
    //Finding product using mongoose
    const products = await Product.find(query)
      .select(select)
      .skip(recordsPerPage * (pageNum - 1))
      .sort(sort)
      .limit(recordsPerPage);
    //

    return res.json({
      products,
      pageNum,
      paginationLinksNumber: Math.ceil(totalProducts / recordsPerPage),
    });
  } catch (err) {
    const error = new HttpError("Unable to fetch data of products", 400);
    return next(error);
  }
};
const getProductById = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId)
      .populate("reviews")
      .orFail();
    return res.json(product);
  } catch (err) {
    const error = new HttpError("Unable to Product by id", 400);
    return next(error);
  }
};

const getBestSellers = async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      { $sort: { category: 1, sales: -1 } },
      { $group: { _id: "$category", doc_with_max_sale: { $first: "$$ROOT" } } },
      { $replaceWith: "$doc_with_max_sale" },
      { $match: { sales: { $gt: 0 } } },
      { $project: { _id: 1, name: 1, image: 1, category: 1, description: 1 } },
      { $limit: 3 },
    ]);
    return res.json(products);
  } catch (err) {
    const error = new HttpError("Unable to fetch Best sellers", 400);
    return next(error);
  }
  return;
};
//Admin get Products
const adminGetProducts = async (req, res, next) => {
  try {
    const user = req.user;
    console.log("🚀 ~ file: productController.js:170 ~ adminGetProducts ~ user:", user)
    const products = await Product.find({})
      .sort({ category: 1 })
      .select("name price category")
      .orFail();
    return res.json(products);
  } catch (err) {
    const error = new HttpError("Unable to fetch products for admin", 400);
    return next(error);
  }
};
const adminDeleteProducts = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).orFail();
    const result = await product.deleteOne();

    return res.json({ message: "Product Was deleted" });
  } catch (err) {
    const error = new HttpError("Unable to delete product", 400);
    return next(error);
  }
};

const adminCreateProducts = async (req, res, next) => {
  try {
    const product = await new Product();
    const { name, description, count, price, category, attributesTable } =
      req.body;
    product.name = name;
    product.description = description;
    product.count = count;
    product.price = price;
    product.category = category;
    if (attributesTable.length > 0) {
      attributesTable.map((item) => {
        product.attrs.push(item);
      });
    }
    product.attributesTable = attributesTable;
    await product.save();
    res.json({ message: "Product Created", productId: product._id });
  } catch (err) {
    const error = new HttpError("Unable to Add product", 400);
    return next(error);
  }
};
const adminUpdateProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).orFail();
    const { name, description, count, price, category, attributesTable } =
      req.body;
    product.name = name || product.name;
    product.description = description || product.description;
    product.count = count || product.count;
    product.price = price || product.price;
    product.category = category || product.category;
    if (attributesTable.length > 0) {
      product.attrs = [];
      attributesTable.map((item) => {
        product.attrs.push(item);
      });
    } else {
      product.attrs = [];
    }
    await product.save();
    res.json({ message: "Product Updated", productId: product._id });
  } catch (err) {
    const error = new HttpError("Unable to Add product", 400);
    return next(error);
  }
};
const adminUpload = async (req, res, next) => {
  try {
    if (!req.files || !!req.files.images === false) {
      const error = new HttpError("No files were uploaded", 400);
      return next(error);
    }
    const validateResult = imageValidate(req.files.images);
    if (validateResult.error) {
      const error = new HttpError(validateResult.error, 400);
      return next(error);
    }
    const path = require("path");
    const { v4: uuidv4 } = require("uuid");
    const uploadDirectory = path.resolve(
      __dirname,
      "../../E-Commerce-Client/public/images/products"
    );
    let product = await Product.findById(req.query.productId).orFail();
    let imagesTable = [];
    if (Array.isArray(req.files.images)) {
      imagesTable = req.files.images;
    } else {
      imagesTable.push(req.files.images);
    }
    for (let image of imagesTable) {
      var fileName = uuidv4() + path.extname(image.name);
      var uploadedPath = uploadDirectory + "/" + fileName;
      product.images.push({ path: "/images/products/" + fileName });
      image.mv(uploadedPath, function (err) {
        if (err) {
          const error = new HttpError("No files were uploaded", 500);
          return next(error);
        }
      });
    }
    await product.save();
    return res.send({ message: "Files Uploaded" });
  } catch (err) {}
};
const adminDeleteProductsImage = async (req, res, next) => {
  const imagePath = decodeURIComponent(req.params.imagePath);
  console.log("🚀 ~ imagePath:", imagePath)
  try {
    const path = require("path");
    const finalPath = path.resolve("../../E-Commerce-Client/public/images/products") + imagePath;
    const fs = require("fs");
    fs.unlink(finalPath, (err) => {
      if (err) {
        console.log("not deleted");
        return res.status(500).send(err);
      } else {
        console.log("deleted");
      }
    });
    await Product.findOneAndUpdate(
      { _id: req.params.productId },
      { $pull: { image: { path: imagePath } } }
    ).orFail();
    return res.end();
  } catch (err) {
    const error = new HttpError("No image deleted", 400);
    return next(error);
  }
};
module.exports = {
  getProducts,
  getProductById,
  getBestSellers,
  adminGetProducts,
  adminDeleteProducts,
  adminUpdateProducts,
  adminCreateProducts,
  adminUpload,
  adminDeleteProductsImage,
};
