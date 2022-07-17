const { Router } = require('express');
const router = new Router();
const auth = require('../middleware/auth');
const VRole = require('../middleware/VRole');
const Order = require('../models/order');
const Product = require('../models/product');

/**
 * @route POST /orders This endpoint is for creating orders.
 * @access Public
 */
router.post('/order', auth, VRole(['owner', 'admin', 'buyer']), async (req, res) => {
    try {
        // GET THE PRODUCTS
        const productIds = req.body.products.map((product) => product.id);
        const products = await Product.find({ _id: { $in: productIds } }, [
            "name",
            "price",
            "quantity",
        ]);
        if (products.length !== productIds.length) return res.status(400).send("Maybe there is one or more invalid product ID's.");

        // QUANTITY CHECK 
        const isValQuantity = products.map((product) => {
            const orderedProduct = req.body.products.find((p) => p.id === product._id.toString());
            return orderedProduct.quantity < 1 || orderedProduct.quantity > product.quantity ?
                { product, valid: false, quantity: orderedProduct.quantity } :
                { product, valid: true, quantity: orderedProduct.quantity }
        });
        const finalProducts = isValQuantity.filter((product) => product.valid === true);
        if (finalProducts.length === 0) return res.status(400).send("Invalid quantity of every products.");

        // UPDATE THE PRODUCTS QUANTITY
        await Promise.all(finalProducts.map(
            async ({ product, quantity }) =>
                await Product.findByIdAndUpdate(product.id, {
                    $inc: { quantity: -quantity },
                })
        ));

        // CALCULATE TOTAL PRICE
        const totalPrice = finalProducts.reduce((total, { product, quantity }) => total + (product.price * quantity), 0);

        // CREATE ORDER 
        const order = new Order({
            user: req.user._id,
            products: finalProducts.map(({ product, quantity }) => ({
                id: product._id,
                quantity,
            })),
            totalPrice,
        });
        await order.save();

        // PREPARE A MESSAGE IF INVALID PRODUCT QUANTITIES FOUND
        const invalidProducts = isValQuantity.filter((product) => product.valid === false); //get the invalid products and create message if found invalid products for the requester
        let message;
        if (invalidProducts.length > 0)
            message = `The following products are not available: ${invalidProducts
                .map(({ product }, index) => `${index + 1}. ${product.name}`)
                .join(", ")}`;

        // SEND RESPONSE
        res.status(200).send({ order, message });
    } catch (e) { res.status(500).send('Fail to create the order.') }
});

module.exports = router;