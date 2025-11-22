const express = require('express');
const ejs = require('ejs');
const path = require('path');

// --- Initialize Express ---
const app = express();


// --- Middleware setup ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'assets')));

// --- Set up EJS view engine ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Import routes and model
// const model = require('./model/database.js');
// const Message = require("./model/chatDB");
// const user = require('./model/userDB.js')


// const adminRoute = require('./routes/adminR.js');
const userRoute = require('./routes/userR.js');
// const messageRoute = require('./routes/messageR.js');

// --- Use routes ---
app.use('/', userRoute);
// app.use('/admin', adminRoute);
// app.use('/message', messageRoute);

// --- Start the server ---
const port = 2000;
app.listen(port, () => {
  console.log(`Server connected to port ${port}`);
});