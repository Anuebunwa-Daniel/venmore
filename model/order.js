const mongoose = require("mongoose");

// Order Schema
const orderSchema = new mongoose.Schema(
{
    txRef: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, // better than string
        ref: "User",
        required: true
    },
    email: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "successful", "failed"],
    },
    cartItems: [
        {
            productId: String,
            productName: String,
            price: Number,
            qty: Number
        }
    ]
},
{ timestamps: true }
);

module.exports = mongoose.model("order", orderSchema);
