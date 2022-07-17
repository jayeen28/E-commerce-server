const fs = require('fs')
require('dotenv').config()
const express = require('express')
require('./db/mongoose')
var cors = require('cors')
const app = express()
const port = process.env.PORT;
app.use(cors())
app.use(express.json())
/**
 * NOTE: If routes are not working and keep loading for long
 * then please check if all the items are router function in the routers array.
 */
const v1Routers = fs.readdirSync('src/routers').map(file => require(`./routers/${file}`))
app.use('/api/v1/', v1Routers);
app.listen(port, () => console.log('Server is up on port ' + port))