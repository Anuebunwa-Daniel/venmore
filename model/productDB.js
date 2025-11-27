const mongoose = require('mongoose')

//product schema
const productSchema = mongoose.Schema({
    productName:{
        type: String,
        require: true
    },
    product_id:{
        type: String,
        require: true
    },
     productCategory:{
        type: String,
        require: true
    },
     price:{
        type: Number,
        require: true
    },
     desc:{
        type: String,
        require: true
    },
     image:{
        type: String,
        require: true
    },
      public_id:{
        type: String,
        require: true
    }
   
});

const product = module.exports = mongoose.model('product', productSchema)