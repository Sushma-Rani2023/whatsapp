const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema([{
 Product_name:{
  type:String
 },
 Item_id:{
    type:String
 },
 Quantity:{
    type:Number
 }
}]);

const Message = mongoose.model('Order', messageSchema);

module.exports = Message;