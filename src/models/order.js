const { Schema, model } = require('mongoose');

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        trim: true,
        required: true
    }
}, { timestamps: true });

const Order = model('Order', orderSchema);
module.exports = Order;