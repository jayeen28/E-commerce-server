const { Router } = require('express');
const router = new Router();
const Order = require('../models/order');
const Product = require('../models/product');
const auth = require('../middleware/auth');

/**
 * @api {post} /order Create an order
 */
router.post('/order', auth, async (req, res) => {
    try {
        const { productId, quantity, address, phone } = req.body;
        const order = new Order({
            user: req.user.id,
            productId,
            quantity,
            address,
            phone
        });

        const product = await Product.findById(productId);
        if (!product) return res.status(400).send('Invalid product id');
        if (product.quantity < quantity) return res.status(400).send('Quentity not available.');
        product.quantity -= quantity;
        await product.save();
        await order.save();
        res.status(200).send(order);
    } catch (e) {
        console.log(e)
        res.status(400).send('Something went wrong while creating order');
    }
});

/**
 * @api {get} /order Get all orders
 */
router.get('/order', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(401).send('You are not authorized to see orders.');
        const orders = await Order.find({}).populate('products.product', 'name price');
        res.status(200).send(orders);
    } catch (e) {
        res.status(400).send('Something went wrong while getting orders');
    }
});

/**
 * @api {get} /order/:id Get an order
 */
router.get('/order/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('products.product', 'name price');
        if (!order) return res.status(404).send('Order not found');
        if (req.user.id === order.user || req.user.role === 'admin') res.status(200).send(order);
        else res.status(401).send('Sorry, you are not authorized to see this order.');
    } catch (e) {
        console.log(e)
        res.status(400).send('Something went wrong while getting order');
    }
});

/**
 * @api {put} /order/:id Update an order
 */
// It will be uncommented if needed. NOTE: Here is no validation for the update.
// router.put('/order/:id', async (req, res) => {
//     try {
//         const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         res.status(200).send(order);
//     } catch (e) {
//         res.status(400).send('Something went wrong while updating order');
//     }
// });

/**
 * @api {delete} /order/:id Delete an order
 */
router.delete('/order/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(400).send('Order not found');
        if (req.user.role === 'admin' || order.user === req.user.id) {
            const deleteRes = await Order.deleteOne(order);
            res.status(200).send({ ...deleteRes, id: order._id });
        }
        else res.status(401).send('You are not authorized to delete orders.');
    } catch (e) {
        res.status(400).send('Something went wrong while deleting order');
    }
});

/**
 * @api {get} /order/:userId Get orders of a user
 */
router.get('/order/user/me', auth, async (req, res) => {
    try {
        // if (req.user.id !== req.params.id) return res.status(400).send('You are not the creator of this order.');
        const orders = await Order.find({ user: req.user.id });
        res.status(200).send(orders);
    } catch (e) {
        res.status(400).send('Something went wrong while getting orders of user');
    }
});

/**
 * @api {get} /order/user/:id Get orders of a user 
 */
router.get('/order/user/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(401).send('You are not authorized to see orders.');
        const orders = await Order.find({ user: req.params.id });
        res.status(200).send(orders);
    } catch (e) {
        res.status(400).send('Something went wrong while getting orders of user');
    }
});

module.exports = router;