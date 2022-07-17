const { Router } = require('express');
const router = new Router();
const auth = require('../middleware/auth');
const VRole = require('../middleware/VRole');
const Product = require('../models/product');

/**
 * Create product
 */
router.post('/products', auth, VRole(['admin', 'owner', 'seller', 'buyer']), async (req, res) => {
    try {
        const product = new Product({
            ...req.body,
            owner: req.user._id
        });
        await product.save();
        res.status(201).send(product);
    } catch (e) { res.status(500).send('Failed to create product.') }
})

/**
 * Get all products
 * EXAMPLE: GET /products?page=1&limit=10&sortBy=name:desc
 */
router.get('/products', async (req, res) => {
    try {
        const sort = {};
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        }
        const pageOptions = {
            page: parseInt(req.query.page, 10) || 0,
            limit: parseInt(req.query.limit, 10) || 10
        }
        const products = await Product.find({}, null, {
            limit: pageOptions.limit,
            skip: pageOptions.page * pageOptions.limit,
            sort
        }).exec();
        res.status(200).send(products);
    } catch (e) { res.status(500).send('Failed to get all products.'); }
});

/**
 * Get product by id
 */
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found.');
        res.status(200).send(product);
    } catch (e) { res.status(500).send('Something went wrong.') }
})

/**
 * Update product by id
 */
router.patch('/products/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(401).send();
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'price', 'description', 'imageUrl', 'quantity'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' });
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send();
        updates.forEach((update) => product[update] = req.body[update]);
        await product.save();
        res.send(product);
    } catch (e) {
        res.status(400).send(e);
    }
})

/**
 * Delete product by id
 */
router.delete('/products/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(401).send();
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send();
        await product.remove();
        res.send(product);
    } catch (e) {
        res.status(500).send(e);
    }
})

module.exports = router;