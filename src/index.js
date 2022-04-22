require('dotenv').config()
const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user');
const productRouter = require('./routers/product');
const cartRouter = require('./routers/cart');
const orderRouter = require('./routers/order');
var cors = require('cors')

const app = express()
const port = process.env.PORT;

app.use(cors())
app.use(express.json())
app.use(userRouter);
app.use(productRouter);
app.use(cartRouter);
app.use(orderRouter);

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})