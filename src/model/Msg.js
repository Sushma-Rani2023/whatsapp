const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  order: [{
    Item_id: { type: String, required: true },
    Item_name: { type: String, required: true },
    Quantity: { type: Number, required: true },
  }],
  Meta_object: { type: Object, required: true }
});

module.exports = mongoose.model('Message', messageSchema);
