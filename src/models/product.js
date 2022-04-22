const { model, Schema } = require('mongoose');

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    tokenType: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: false,//should be true later
        trim: true
    },
    category: {
        type: String,
        required: false,//should be true later
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        trim: true
    }
}, { timestamps: true });

const Product = model('Product', productSchema);
module.exports = Product;