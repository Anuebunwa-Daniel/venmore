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
const { check, validationResult } = require('express-validator');

const user = require('../model/userDB');
const Category = require('../model/categoryDB');
const Product = require('../model/productDB');


// get the home page 
router.get('/', async (req, res) => {
    const product = await Product.find()
    const category = await Category.find()
    const users = await user.find()
    res.render('home', {
        users,
        product,
        category
    })
})

//get the category page
// router.get('/category', (req, res) => {
//     res.render('category')
// })
// Dynamic category page



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

        // ADMIN LOGIN
        if (existingUser.email === 'dan@gmail.com') {
            const users = await user.find();
            return res.render('admin/admin', { users });
        }

        // REGULAR USER LOGIN
        res.redirect('/');

    } catch (err) {
        console.log(err);
        res.render('login', {
            failureMessages: req.flash('danger')
        });
    }
});


//dynamic category page 
router.get("/:category", async (req, res) => {
    const categoryName = req.params.category;
   

    try {
        const category = await Category.find()
        const categories = await Category.findOne({ category_name: categoryName });

        if (!categories) {
            return res.render('/');
        }

        const products = await Product.find({ productCategory: categoryName });
        console.log(products)

        res.render("category", {
            categoryName,
            products,
            category
        });
    } catch (err) {
        console.log(err);
        res.render("500", { error: err.message });
    }
});


module.exports = router;