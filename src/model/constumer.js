const mongoose=require("mongoose")
const  CustomerSchema= new mongoose.Schema({


    Refernce_id:{
        type:String,
        require:true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
      },
      
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
})

const Customer = mongoose.model("Customer", CustomerSchema);

module.exports = Customer;