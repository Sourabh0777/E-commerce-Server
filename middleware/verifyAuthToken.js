const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");
const verifyIsLoggedIn =async (req, res, next) => {
  try {
    const token =await req.cookies.access_token;
    if (!token) {
      return res.status(403).send("Token is required for authentication.");
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
      if (err) {
        return res.status(401).send("Unauthorized: Invalid token.");
      }
      req.user = decodedToken;
      next();
    });
  } catch (err) {
    const error = new HttpError("Unable to authenticate", 401);
    return next(error);
  }
};
const verifyIsAdmin = async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send("Unauthorized, Admin required");
  }
};
module.exports = { verifyIsLoggedIn, verifyIsAdmin };
