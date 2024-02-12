/** @format */

const mongoose = require("mongoose");
const couponSchema = mongoose.Schema({
  itemType: Number,
  genderType: String,
  category: String,
  subcategory: String,
  occassion: String,
  productId: String,
  dimension: String,
  couponCode: [
    {
      couponCode: String,
      redeemed: Boolean,
    },
  ],
  couponType: {},
  expiryDate: Number,
  conditions: [],
  branchId: String,
  shiftId: Number,
});
const coupomModel = mongoose.model("coupon", couponSchema);
module.exports = coupomModel;
