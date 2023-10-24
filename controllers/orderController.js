const HttpError = require("../models/http-error");

const getOrders = async (req, res, next) => {
  res.send("This is get Orders API");
};
module.exports = getOrders;
