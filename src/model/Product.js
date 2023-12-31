const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  Item_id: {
    type: String,
  },
  Item_name: {
    type: String,
    index: true, 
  },
  Status: {
    type: String,
  },
});

itemSchema.index({ Item_name: "text" });

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
