const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  //Required
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  //Admin required
  isAdmin: { type: Boolean, default: false, required: true },
  //Optional Required
  phoneNumber: { type: String },
  address: { type: String },
  country: { type: String },

  city: { type: String },

  zipCode: { type: String },

  state: { type: String },
});
const User = mongoose.model("User", userSchema);
module.exports = User;
