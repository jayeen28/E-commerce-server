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


/**
 * @route GET /orders This endpoint is for getting all orders.
 * @access Private
 * NOTE: Admins can query only with _id, status and user.
 */
router.get('/orders', auth, VRole(['owner', 'admin', 'seller']), async (req, res) => {
    try {
        // PREPARE SEARCH PARAMS
        let searchParams = {}
        Object.keys(req.query).forEach(key => {
            if (!['_id', 'status', 'user'].includes(key)) return res.status(400).send('Invalid query');
            searchParams[key] = req.query[key];
        });

        // GET THE ORDERS
        let orders = await Order.find(searchParams).populate('products.id')

        // SEND ALL ORDERS IF THER REQUESTER IS OWNER OR ADMIN
        if (['owner', 'admin'].includes(req.user.role)) return res.status(200).send(orders);

        // IF THE REQUESTER IS SELLER THEN SEND ONLY HIS ORDERS.
        if (req.user.role !== 'seller') return res.status(400).send('You are unauthorized to get the orders.')
        orders = orders.filter(order => {
            order.products = order.products.filter(product => req.user.id === product.id.productOwner.toString())
            return order.products.length > 0;
        })
        res.status(200).send(orders)
    } catch (e) { res.status(500).send('Failed to get the orders.'); }
});

/**
 * @route GET /orders/me get own orders
 * @access Private
 */
router.get('/orders/me', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });
        res.status(200).send(orders);
    } catch (e) { res.status(500).send('Failed to get the orders.') }
});

/**
 * @route GET /orders/:id This endpoint is for getting an order by id.
 * @access Private
 */
router.get('/orders/:id', auth, async (req, res) => {
    try {
        // FIND THE ORDER
        const order = await Order.findById(req.params.id).populate('products.id')
        if (!order) return res.status(404).send('Order not found');

        // IF THE REQUESTER IS FROM THE ADMIN SIDE OR THE CREATOR OF THE ORDER THEN SEND THE ORDER.
        const isAdmin = ['owner', 'admin'].includes(req.user.role);
        const isOrderCreator = order.user.toString() === req.user.id;
        if (isAdmin || isOrderCreator) return res.status(200).send(order);

        // IF THE REQUESTER IS SELLER THEN SEND ONLY HIS ORDERS.
        if (req.user.role !== 'seller') return res.status(400).send('You are unauthorized to get the order.')
        order.products = order.products.filter(product => req.user.id === product.id.productOwner.toString());
        if (order.products.length === 0) return res.status(401).send('You are unauthorized to get the order.');
        res.status(200).send(order);
    } catch (e) { res.status(500).send('Failed to get the order') }
});

/**
 * @route PATCH /orders/status/:id This endpoint is for updating order status.
 * @access Private
 */
router.patch('/orders/status/:id', auth, VRole(['owner', 'admin', 'seller']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).send('Order not found');
        if (order.status === 'completed') return res.status(400).send('Order already completed');
        order.status = req.body.status;
        await order.save();
        res.status(200).send(order);
    } catch (e) { res.status(500).send('Failed to update the order status.') }
});

module.exports = router;