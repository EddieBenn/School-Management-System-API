const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("School", schoolSchema);
