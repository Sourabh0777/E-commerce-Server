const express = require("express");
const apiRouters = express();
const productRouters = require("./productRouters");
const categoryRouters = require("./categoryRouters");
const userRouters = require("./userRouters");
const orderRouters = require("./orderRouters");
const jsonwebtoken = require("jsonwebtoken");
const HttpError = require("../models/http-error");
jsonwebtoken;
apiRouters.use("/products", productRouters);
apiRouters.use("/categories", categoryRouters);
apiRouters.use("/user", userRouters);
apiRouters.use("/order", orderRouters);
apiRouters.get("/get-token", async (req, res, next) => {
  try {
    const access_token = await req.cookies.access_token;
    if (access_token) {
      const decodedToken = jsonwebtoken.decode(
        access_token,
        process.env.JWT_SECRET_KEY
      );
      return res.json({ token: decodedToken });
    } else {
      throw new HttpError("Invalid Token", 403);
    }
  } catch (err) {
    const error = new HttpError("Internal Server Error", 400);
    return next(err || error);
  }
});

module.exports = apiRouters;
