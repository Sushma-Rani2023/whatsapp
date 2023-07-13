const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  Item_id: {
    type: String,
  },
  Item_name: {
    type: String,
  },
  Status: {
    type: String,
  },
});

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
