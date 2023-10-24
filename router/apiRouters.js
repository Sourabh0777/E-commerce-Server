const express = require("express");
const apiRouters = express();
const productRouters = require("./productRouters");
const categoryRouters = require("./categoryRouters");
const userRouters = require("./userRouters");
const orderRouters = require("./orderRouters");

apiRouters.use("/products", productRouters);
apiRouters.use("/categories", categoryRouters);
apiRouters.use("/user", userRouters);
apiRouters.use("/order", orderRouters);

module.exports = apiRouters;
