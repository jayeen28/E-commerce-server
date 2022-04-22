const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: true,
    useUnifiedTopology: true 
}, err => {
if(err){console.log("error : ", err)};
console.log('Connected to MongoDB!!!')
});
    
