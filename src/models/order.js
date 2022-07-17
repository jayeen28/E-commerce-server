const { Schema, model, default: mongoose } = require("mongoose");

const productSchema = new Schema({
    id: {
        type: Schema.Types.ObjectId,
        ref: "Products",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    }
});

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    products: [
        {
            type: productSchema,
        }
    ],
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "completed", "cancelled"],
        default: "pending",
    }
});

const Orders = model("Orders", orderSchema);
module.exports = Orders;