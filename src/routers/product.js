const { Router } = require('express');
const router = new Router();
const auth = require('../middleware/auth');
const VRole = require('../middleware/VRole');
const Product = require('../models/product');
const PManagers = ['admin', 'owner', 'seller'];

/**
 * Create product
 */
router.post('/products', auth, VRole(PManagers), async (req, res) => {
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
 * EXAMPLE: GET /products?search="test"&page=1&limit=10&sortBy=name:desc
 */
router.get('/products', async (req, res) => {
    try {
        let params = {}
        let sort = {};
        if (req.query.search) params = { ...params, $text: { $search: req.query.search } }
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        }
        const pageOptions = {
            page: parseInt(req.query.page, 10) || 0,
            limit: parseInt(req.query.limit, 10) || 10
        }
        const products = await Product.find(params, null, {
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
router.patch('/products/:id', auth, VRole(PManagers), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found.');
        if (product.owner.toString() !== req.user.id) return res.status(400).send('You are not the creator of this product.')
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'price', 'description', 'images', 'quantity', 'category'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' });
        updates.forEach((update) => product[update] = req.body[update]);
        await product.save();
        res.status(200).send(product);
    } catch (e) { res.status(400).send('Failed to update product.') }
})

/**
 * Delete product by id
 */
router.delete('/products/:id', auth, VRole(PManagers), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found.');
        if (product.owner.toString() !== req.user.id) return res.status(404).send('You are not the creator of this product.')
        await product.remove();
        res.status(200).send(product);
    } catch (e) { res.status(500).send('Failed to delete the product.') }
})

module.exports = router;