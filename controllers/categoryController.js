const HttpError = require("../models/http-error");
const Category = require("../models/CategoryModel");

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: "asc" }).orFail();
    res.json(categories);
  } catch (err) {
    const error = new HttpError("Error in fetching categories data");
    next(error);
  }
};

const newCategory = async (req, res, next) => {
  try {
    const { category, description } = req.body;
    if (!category) {
      const error = new HttpError("Category Input is required", 400);
      next(error);
    }
    const categoryExist = await Category.findOne({ name: category });
    if (categoryExist) {
      const error = new HttpError("Category already exist", 400);
      next(error);
    } else {
      const createCategory = await Category.create({
        name: category,
        description: description,
      });
      res.status(200).send({ CategoryCreated: createCategory });
    }
  } catch (err) {
    const error = new HttpError("Error in Posting category data");
    return next(error);
  }
};
const deleteCategory = async (req, res, next) => {
  try {
    if (req.params.category !== "Choose category") {
      const categoryExists = await Category.findOne({
        name: decodeURIComponent(req.params.category),
      }).orFail();
      await categoryExists.deleteOne();

      return res.json({ categoryDeleted: true });
    }
  } catch (err) {
    console.log("🚀  err:", err);
    const error = new HttpError(
      "Error in deleting the Category" || err.message,
      400
    );
    return next(error);
  }
};

const saveAttr = async (req, res, next) => {
  const { key, val, categoryChoosen } = req.body;
  if (!key || !val || !categoryChoosen) {
    return res.status(400).send("All inputs are required");
  }
  try {
    const category = categoryChoosen.split("/")[0];
    const categoryExists = await Category.findOne({ name: category }).orFail();
    if (categoryExists.attrs.length > 0) {
      // if key exists in the database then add a value to the key
      var keyDoesNotExistsInDatabase = true;
      categoryExists.attrs.map((item, idx) => {
        if (item.key === key) {
          keyDoesNotExistsInDatabase = false;
          var copyAttributeValues = [...categoryExists.attrs[idx].value];
          copyAttributeValues.push(val);
          var newAttributeValues = [...new Set(copyAttributeValues)]; // Set ensures unique values
          categoryExists.attrs[idx].value = newAttributeValues;
        }
      });

      if (keyDoesNotExistsInDatabase) {
        categoryExists.attrs.push({ key: key, value: [val] });
      }
    } else {
      // push to the array
      categoryExists.attrs.push({ key: key, value: [val] });
    }
    await categoryExists.save();
    let cat = await Category.find({}).sort({ name: "asc" });
    return res.status(201).json({ categoriesUpdated: cat });
  } catch (err) {
    return next(err);
  }
};
module.exports = { newCategory, getCategories, deleteCategory, saveAttr };
