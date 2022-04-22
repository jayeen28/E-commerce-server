const { model, Schema } = require('mongoose');

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }, {
            timeStamp: true
        }
    ]

});

const Cart = model('Cart', cartSchema);
module.exports = Cart;