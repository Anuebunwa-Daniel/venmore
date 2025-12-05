const mongoose = require('mongoose')

//product schema
const productSchema = mongoose.Schema({
    productName: {
        type: String,
        require: true
    },
    product_id: {
        type: String,
        require: true
    },
    productCategory: {
        type: String,
        require: true
    },
    popular: {
        type: String,
        require: true
    },
    price: {
        type: Number,
        require: true
    },
    desc: {
        type: String,
        require: true
    },
    image: {
        type: String,
        require: true
    },
    badge: {
        type: String,
        require: false
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 4
    },

      public_id: {
        type: String,
        require: true
    }


});

const product = module.exports = mongoose.model('product', productSchema)