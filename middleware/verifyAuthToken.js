const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");
const verifyIsLoggedIn = async (req, res, next) => {
  next();
  return;
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(403).send("Token is required for authentication.");
    }
    try {
      const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = decodeToken;
      return next();
    } catch (error) {
      return res.status(401).send("unauthorized invalid token.");
    }
  } catch (err) {
    const error = new HttpError("Unable to authenticate", 401);
    return next(err);
  }
};
const verifyIsAdmin = async (req, res, next) => {
  next();
  return;

  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send("Unauthorized, Admin required");
  }
};
module.exports = { verifyIsLoggedIn, verifyIsAdmin };
