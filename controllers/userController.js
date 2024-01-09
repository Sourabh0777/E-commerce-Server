const User = require("../models/UserModel");
const HttpError = require("../models/http-error");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const { generateAuthToken } = require("../utils/generateAuthToken");
const Product = require("../models/ProductModel");
const Review = require("../models/ReviewModel");
const ObjectId = require("mongodb").ObjectId;
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").orFail();
    return res.json(users);
  } catch (err) {
    const error = new HttpError("No user fetched", 400);
    return next(error);
  }
};
const registerUser = async (req, res, next) => {
  try {
    const { name, lastName, email, password } = req.body;
    if (!(name && lastName && email && password)) {
      const error = new HttpError("All inputs are required", 400);
      return next(error);
    }
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      const error = new HttpError(
        "User Already exists from given email id",
        400
      );
      return next(error);
    } else {
      const hashedPassword = hashPassword(password);
      const user = await User.create({
        name,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
      });
      return res
        .cookie(
          "access_token",
          generateAuthToken(
            user._id,
            user.name,
            user.lastName,
            user.email,
            user.isAdmin
          ),
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          }
        )
        .status(201)
        .json({
          success: "User Created",
          userCreated: {
            _id: user._id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin,
          },
        });
    }
  } catch (err) {
    const error = new HttpError("No user Created", 400);
    return next(error);
  }
};
const loginUser = async (req, res, next) => {
  try {
    const { email, password, doNotLogout } = req.body;
    if (!(email && password)) {
      const error = new HttpError("All inputs are required", 400);
      return next(error);
    }
    const user = await User.findOne({ email: email.toLowerCase() }).orFail();

    if (user && comparePassword(password, user.password)) {
      let cookieParams;
      cookieParams = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      };
      if (doNotLogout) {
        cookieParams = { ...cookieParams, maxAge: 1000 * 60 * 60 * 24 * 7 };
      }
      return res
        .cookie(
          "access_token",
          generateAuthToken(
            user._id,
            user.name,
            user.lastName,
            user.email,
            user.isAdmin
          ),
          cookieParams
        )
        .json({
          success: "User logged in",
          userLoggedIn: {
            _id: user._id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin,
            doNotLogout,
          },
        });
    } else {
      const error = new HttpError("Password not matched", 400);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("No user found", 400);
    return next(error);
  }
};
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).orFail();
    user.name = req.body.name || user.name;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber;
    user.address = req.body.address;
    user.country = req.body.country;
    user.zipCode = req.body.zipCode;
    user.city = req.body.city;
    user.state = req.body.state;
    if (req.body.password !== user.password) {
      user.password = hashPassword(req.body.password);
    }
    await user.save();
    res.json({
      success: "user updated",
      userUpdated: {
        _id: user._id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    const err = new HttpError("No user updated", 500);
    return next(error || err);
  }
};
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).orFail();
    return res.json({ success: true, user: user });
  } catch (error) {
    const err = new HttpError("Unable to get user profile", 500);
    return next(error || err);
  }
};
const writeReview = async (req, res, next) => {
  const session = await Review.startSession();

  try {
    // get comment, rating from request.body:
    const { comment, rating } = req.body;
    // validate request:
    if (!(comment && rating)) {
      return res.status(400).send("All inputs are required");
    }

    // create review id manually because it is needed also for saving in Product collection
    const ObjectId = require("mongodb").ObjectId;
    let reviewId = new ObjectId();

    session.startTransaction();

    await Review.create(
      [
        {
          _id: reviewId,
          comment: comment,
          rating: Number(rating),
          user: {
            _id: req.user._id,
            name: req.user.name + " " + req.user.lastName,
          },
        },
      ],
      { session: session }
    );

    const product = await Product.findById(req.params.productId)
      .populate("reviews")
      .session(session);

    const alreadyReviewed = product.reviews.find(
      (r) => r.user._id.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send("product already reviewed");
    }

    let prc = [...product.reviews];
    prc.push({ rating: rating });
    product.reviews.push(reviewId);
    if (product.reviews.length === 1) {
      product.rating = Number(rating);
      product.reviewsNumber = 1;
    } else {
      product.reviewsNumber = product.reviews.length;
      product.rating =
        prc
          .map((item) => Number(item.rating))
          .reduce((sum, item) => sum + item, 0) / product.reviews.length;
    }
    await product.save();

    await session.commitTransaction();
    session.endSession();
    return res.send("review created");
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .select("name lastName email isAdmin")
      .orFail();
    return res.json(user);
  } catch (error) {
    const err = new HttpError("Unable to get user details", 500);
    return next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, lastName, email, isAdmin } = req.body;
    const userId = req.params.id;
    const user = await User.findById(userId).orFail();
    user.name = name || user.name;
    user.lastName = lastName || user.name;
    user.email = email || user.email;
    user.isAdmin = isAdmin || user.isAdmin;
    await user.save();
    return res.send("User updated");
  } catch (error) {
    const err = new HttpError("Unable to update user", 500);
    return next(error || err);
  }
};
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    console.log("🚀 ~ file: userController.js:266 ~ deleteUser ~ userId:", userId)
    const user = await User.findById(userId).orFail();
    const result = await user.deleteOne();

    return res.json({ message: "User Was deleted" });
  } catch (error) {
    const err = new HttpError("Unable to get user profile", 500);
    return next(error || err);
  }
};
module.exports = {
  getUsers,
  registerUser,
  loginUser,
  updateUserProfile,
  getUserProfile,
  writeReview,
  getUser,
  updateUser,
  deleteUser,
};
