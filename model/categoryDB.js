const mongoose = require('mongoose')

//category schema
const categorySchema = mongoose.Schema({
    category_name:{
        type: String,
        require: true
    },
    category_id:{
        type: String,
        require: true
    }
   
});

const category = module.exports = mongoose.model('category', categorySchema)