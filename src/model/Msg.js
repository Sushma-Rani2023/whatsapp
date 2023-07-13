const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  order: [
    {
      Item_name: {
        type: String,
      },
      Item_id: {
        type: String,
      },
      Quantity: {
        type: Number,
      },
    },
  ],
});

const Message = mongoose.model("Order", messageSchema);

module.exports = Message;
