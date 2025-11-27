require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const messages = require('express-messages');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require("http");
const socketIO = require("socket.io");
const { check, validationResult } = require('express-validator');
const multer =require('multer')
const {cloudinary} =require('./config/cloudinary') 

// --- Initialize Express ---
const app = express();

//seeion
app.use(session({
  secret: process.env.session_key,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // secure: true only works on HTTPS
}));

// Import routes and model
// const model = require('./model/database.js');
// const Message = require("./model/chatDB");
const user = require('./model/userDB.js')


const adminRoute = require('./routes/adminR.js');
const userRoute = require('./routes/userR.js');
// const messageRoute = require('./routes/messageR.js');

// --- Connect to MongoDB ---
mongoose.connect(process.env.Atlas_database)
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.log(err + ' Database connection failed'));


// --- Middleware setup ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'assets')));

app.use(flash());

app.use((req, res, next) => {
  // These will now be available in all EJS files
  res.locals.successMeg = req.flash('success');
  res.locals.failureMessages = req.flash('danger');
  next();
});

// --- Set up EJS view engine ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



// --- Use routes ---
app.use('/', userRoute);
app.use('/admin', adminRoute);
// app.use('/message', messageRoute);

// --- Body Parser (optional, you already have express.json) ---
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// --- Global variables ---
app.locals.errors = null;

// --- Start the server ---
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server connected to port ${port}`);
});