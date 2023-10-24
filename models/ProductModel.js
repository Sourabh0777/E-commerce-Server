const mongoose = require("mongoose");
const Review = require("./ReviewModel");
const imageSchema = mongoose.Schema({
  path: {
    type: String,
  },
});
const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    count: { type: Number, required: true },
    price: { type: Number, required: true },
    rating: { type: Number }, // Average of rating
    reviewsNumber: { type: Number }, // Number of reviews the product has
    sales: { type: Number, default: 0 }, // How many times this product was ordered, sold
    attrs: [{ key: { type: String }, value: { type: String } }],
    // Example of attributes called as attrs
    //[{key:"color",value:"red"}, ]
    images: [imageSchema], // Example [image1,image2,image2] just path
    reviews: [
      // One to many relationship model as product does have relation with image, reviews
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Review,
      }, //example [{comment:"",rating:"",userId:"",name:""}]
    ],
  },
  {
    timestamps: true,
  }
);
//Indexing is used for the searching so that we can search for the products using name and description faster
productSchema.index(
  { name: "text", description: "text" },
  { name: "TextIndex" } // Compound Index
);
productSchema.index({ "attrs.key": 1, "attrs.value": 1 });
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
