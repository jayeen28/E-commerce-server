const { Router } = require('express');
const router = new Router();
const Product = require('../models/product');
const auth = require('../middleware/auth');

/**
 * @api {post} /cart Add a product to cart
 */
router.post('/cart/:method', auth, async (req, res) => {
    const methods = {
        increase: (item, user) => {
            if (item) item.quantity++;
            else user.cart.push({
                productId: req.query.productId,
                quantity: 1
            });
        },
        reduce: (item, user) => {
            if (item && item.quantity > 1) item.quantity--;
            else user.cart.pull({ _id: item._id })

        },
        remove: (item, user) => {
            user.cart.pull({ _id: item._id })
        }
    }
    try {
        const product = await Product.findById(req.query.productId);
        if (!product) throw new Error('Product not found');
        const user = req.user
        if (!user) throw new Error('User not found');
        const item = user.cart.find(cart => cart.productId.toString() === req.query.productId);
        methods[req.params.method](item, user);
        await user.save();
        res.send(user.cart);
    } catch (e) {
        res.status(400).send('Something went wrong while managing cart');
    }
});

module.exports = router;