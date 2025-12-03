const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const router = express.Router();
const session = require('express-session');
const messages = require('express-messages');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path')
const https = require('https');
const { check, validationResult } = require('express-validator');

const user = require('../model/userDB');
const Category = require('../model/categoryDB');
const Product = require('../model/productDB');
const auth = require('../config/auth')


// get the home page 
router.get('/', async (req, res) => {
    const product = await Product.find()
    const category = await Category.find()
    const users = await user.find()

    // CART DATA FROM SESSION
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    res.render('home', {
        users,
        product,
        category,
        cart,     // 👈 SEND CART
        total     // 👈 SEND TOTAL PRICE
    })
})


//get the login page 
router.get('/login', (req, res) => {
    const failureMessages = req.flash('danger')
    const successMeg = req.flash('success')
    req.session.user = user
    res.render('login', {
        failureMessages,
        successMeg
    })
})

//get the registration page 
router.get('/register', (req, res) => {
    const failureMessages = req.flash('danger')
    const successMeg = req.flash('success')
    res.render('register', {
        failureMessages,
        successMeg
    })
})

//get the product page 
router.get('/products', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // current page
    const limit = 15; // number of products per page
    const skip = (page - 1) * limit;
    try {
        const product = await Product.find()
        const category = await Category.find()
        const users = await user.find()
        const products = await Product.find().skip(skip).limit(limit);
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);
        // CART DATA FROM SESSION
        const cart = req.session.cart || [];
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        res.render('products', {
            product,
            category,
            products,
            currentPage: page,
            totalPages,
            cart,
            total,
            users
        })
    } catch (err) {
        console.log(err);
    }

})

//post registration page 
router.post('/register', [
    check('firstName', 'First Name is required').notEmpty(),
    check('lastName', 'Last Name is required').notEmpty(),
    check('email', 'A valid Email is required').isEmail(),
    check('phoneNumber', 'valid Phone Number is required').notEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('comPassword', 'Passwords do not match').custom((value, { req }) => value === req.body.password)
], async (req, res) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;
    const password = req.body.password;
    const errors = validationResult(req);
    if ((!errors.isEmpty())) {
        res.render('register', {
            errors: errors.array()
        })
    } else {
        try {
            const existingUser = await user.findOne({ email: email })
            console.log(existingUser)
            if (existingUser) {
                req.flash('danger', 'Email already exist')
                const failureMessages = req.flash('danger')
                res.render('register', {
                    failureMessages
                })
            } else {
                const salt = await bcrypt.genSalt(10)
                const hashedPassword = await bcrypt.hash(password, salt)

                const newUser = new user({
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    password: hashedPassword
                })
                await newUser.save()
                const payload = {
                    user: {
                        email: req.body.email
                    }
                }
                // console.log(newUser)
                const token = await jwt.sign(payload, process.env.admin, {
                    expiresIn: '6000s'
                })

                res.cookie('token', token, {
                    httpOnly: true
                })
                req.flash('success', 'Registration successful')
                const successMeg = req.flash('success')
                return res.render('login', {
                    successMeg
                })
            }
        } catch (err) {
            console.log(err)
            res.redirect('/register')
        }
    }

})

//login
router.post('/login', [
    check('email', 'your valid email is required').isEmail(),
    check('password', 'Enter your correct password').notEmpty()
], async (req, res) => {

    const { email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('login', {
            errors: errors.array()
        });
    }

    try {
        const existingUser = await user.findOne({ email });

        if (!existingUser) {
            req.flash('danger', 'email does not exist');
            return res.render('login', {
                failureMessages: req.flash('danger')
            });
        }

        const validPassword = await bcrypt.compare(password, existingUser.password);
        if (!validPassword) {
            req.flash('danger', 'Wrong password');
            return res.render('login', {
                failureMessages: req.flash('danger')
            });
        }

        // 🔥 SAVE FULL USER IN SESSION FOR LATER USE
        req.session.user = existingUser;
        // Set token (optional)
        const payload = { user: { email: existingUser.email } };
        const token = jwt.sign(payload, process.env.admin, {
            expiresIn: '6000s'
        });
        res.cookie('token', token, { httpOnly: true });

        // Store user _id also (optional)
        req.session.userid = existingUser._id;
        const redirectTo = req.session.redirectTo || '/';
        delete req.session.redirectTo;


        // ADMIN LOGIN
        if (existingUser.email === 'dan@gmail.com') {
            const users = await user.find();
            const productCount = await Product.countDocuments();
            const categoryCount = await Category.countDocuments();
            const userCount = await user.countDocuments();
            return res.render('admin/admin', {
                users,
                productCount,
                categoryCount,
                userCount,
            });
        }

        // REGULAR USER LOGIN
        res.redirect(redirectTo);

    } catch (err) {
        console.log(err);
        res.render('login', {
            failureMessages: req.flash('danger')
        });
    }
});



router.get("/cart/:id", async (req, res) => {
    const productId = req.params.id;
    const referer = req.get("Referer") || "/products"; // fallback if missing

    // Initialize cart in session if not present
    if (!req.session.cart) {
        req.session.cart = [];
    }
    const cart = req.session.cart;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.log(`Invalid product ID: ${productId}`);


        res.redirect(referer);
        // return res.redirect();
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            console.log(`Product not found: ${productId}`);
            return res.redirect(referer);
        }

        // Check if product already exists in cart
        const existing = cart.find(item => item._id.toString() === productId);

        if (existing) {
            existing.qty += 1; // increment quantity
        } else {
            cart.push({
                _id: product._id,
                image: product.image,
                name: product.productName,
                price: product.price,
                qty: 1
            });
        }

        req.session.cart = cart; // save updated cart

        res.redirect(referer);; // safely return to previous page
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.redirect(referer); // fallback
    }
});

// Increase quantity
router.get('/cart/increase/:id', async (req, res) => {
    const productId = req.params.id;
    let cart = req.session.cart || [];

    cart = cart.map(item => {
        if (item._id === productId) {
            item.qty += 1;
        }
        return item;
    });

    req.session.cart = cart;
    res.json({ success: true, cart }); // return updated cart
});

// Decrease quantity
router.get('/cart/decrease/:id', async (req, res) => {
    const productId = req.params.id;
    let cart = req.session.cart || [];

    cart = cart.map(item => {
        if (item._id === productId && item.qty > 1) {
            item.qty -= 1;
        }
        return item;
    });

    req.session.cart = cart;
    res.json({ success: true, cart }); // return updated cart
});

// Remove item
router.get('/cart/remove/:id', async (req, res) => {
    const productId = req.params.id;
    let cart = req.session.cart || [];

    cart = cart.filter(item => item._id !== productId);

    req.session.cart = cart;
    res.json({ success: true, cart });
});


// GET checkout page
router.get('/checkout', async (req, res) => {
    const categoryName = req.params.category;
    const cart = req.session.cart || [];
    let total = 0;
    cart.forEach(item => total += item.price * item.qty);
    const category = await Category.find()
    const categories = await Category.findOne({ category_name: categoryName });

    res.render('checkout', {
        category,
        categories,
        cart,
        total
    });
});

// POST checkout
router.post('/checkout', auth, async (req, res) => {

    try {
        const cart = req.session.cart || [];
        if (cart.length === 0) return res.status(400).send('Cart is empty');

        const order = new Order({
            user: req.session.user._id, // or req.user._id
            items: cart,
            total: cart.reduce((a, b) => a + b.price * b.qty, 0),
            status: 'Pending'
        });
        await order.save();

        req.session.cart = [];
        res.json({ success: true, message: 'Order placed successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


//pay now, using monify 




//dynamic category page 
router.get("/:category", async (req, res) => {
    const categoryName = req.params.category;

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 15; // number of products per page
    const skip = (page - 1) * limit;

    try {
        const category = await Category.find()
        const categories = await Category.findOne({ category_name: categoryName });

        if (!categories) {
            return res.render('/');
        }

        // Fetch products only in this category WITH PAGINATION
        const products = await Product.find({ productCategory: categoryName })
            .skip(skip)
            .limit(limit);

        // Count total products for pagination
        const totalProducts = await Product.countDocuments({ productCategory: categoryName });
        const totalPages = Math.ceil(totalProducts / limit);

        // CART DATA FROM SESSION
        const cart = req.session.cart || [];
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        res.render("category", {
            categoryName,
            products,
            category,
            currentPage: page,
            totalPages,
            cart,     // 👈 SEND CART
            total     // 👈 SEND TOTAL PRICE
        });
    } catch (err) {
        console.log(err);
        res.render("500", { error: err.message });
    }
});


module.exports = router;