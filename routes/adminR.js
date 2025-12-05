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

const multer = require('multer')
const { cloudinary } = require('../config/cloudinary')
const upload = require('../config/multer')
const user = require('../model/userDB');
const Category = require('../model/categoryDB');
const Product = require('../model/productDB');



//get the admin dashboard
router.get('/admin', async (req, res) => {
    // Protect Route
    if (!req.session.user) {
        req.flash("danger", "Please login first");
        return res.redirect("/login");
    }

    const failureMessages = req.flash('danger');
    const successMeg = req.flash('success');

    // Get logged user from session 
    const loggedUser = req.session.user;
    // Fetch full user info from DB
    const users = await user.findOne({ email: loggedUser.email });
    const category = await Category.find() //fetch all users from the userDB
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await user.countDocuments();
   

    try {
        res.render('admin/admin', {
            failureMessages,
            successMeg,
            header: 'Admin Dashboard',
            productCount,
            userCount,
            categoryCount,
            users  // pass to EJS
        });

    } catch (err) {
        console.log(err);
    }
});


//get the admin category 
router.get('/admin_category', async (req, res) => {
    const failureMessages = req.flash('danger')
    const successMeg = req.flash('success')

    if (!req.session.user) {
        req.flash("danger", "Please login first");
        return res.redirect("/login");
    }
    // Get logged user from session
    const loggedUser = req.session.user;

    // Fetch full user info from DB
    const users = await user.findOne({ email: loggedUser.email });
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await user.countDocuments();


    const category = await Category.find() //fetch all users from the userDB

    try {
        res.render('admin/admin_category', {
            failureMessages,
            successMeg,
            header: 'Admin Category',
            category,
            productCount,
            userCount,
            categoryCount,
            users
        }); //pass users to the ejs

    } catch (err) {
        console.log(err)
    }

})


//post the add category
router.post('/add_category', [
    check('catname', 'Enter the category name').notEmpty()
], async (req, res) => {
    const categoryName = req.body.catname;
    const failureMessages = req.flash('danger')
    const successMeg = req.flash('success')
    const categories = await Category.find();
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await user.countDocuments();

    const errors = validationResult(req);
    if ((!errors.isEmpty())) {
        res.render('admin/admin_category', {
            failureMessages,
            successMeg,
            header: 'Admin Category',
            user,
            prroductCount,
            categoryCount,
            userCount,
            category: categories
        })
    } else {
        try {
            const existingCategory = await Category.findOne({ category_name: categoryName });
            if (existingCategory) {
                req.flash('danger', 'category already exists, pls choose another')
                res.render('admin/admin_category', {
                    failureMessages: req.flash('danger'),
                    successMeg: req.flash('success'),
                    errors: errors.array(),
                    header: 'Admin Category',
                    user,
                    productCount,
                    categoryCount,
                    userCount,
                    category: categories
                })
            } else {
                // Get last category
                const lastCategory = await Category.findOne().sort({ category_id: -1 });

                let nextIdNumber = 1;

                if (lastCategory) {
                    // Extract the number part from CAT001
                    const lastNumber = parseInt(lastCategory.category_id.replace("CAT", ""));
                    nextIdNumber = lastNumber + 1;
                }

                // Format: CAT + three-digit padded number
                const newCatId = "CAT" + nextIdNumber.toString().padStart(3, "0");

                const newcategory = new Category({
                    category_name: categoryName,
                    category_id: newCatId
                })
                await newcategory.save()
                req.flash('success', 'category added')

                res.redirect('/admin/admin_category')
            }
        } catch (err) {
            console.log(err)
            res.redirect('/admin/admin_category')
        }
    }

})

//get the admin product page
router.get('/admin_product', async (req, res) => {
    // Protect Route
    if (!req.session.user) {
        req.flash("danger", "Please login first");
        return res.redirect("/login");
    }
    const flashMessages = req.flash('danger');
    const successMeg = req.flash('success');

    loggedUser = req.session.user
    const users = await user.findOne({ email: loggedUser.email })
    const product = await Product.find() //fetch all product from the productDB
    const category = await Category.find() //fetch all product from the productDB
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await user.countDocuments();
    try {
        res.render('admin/admin_product', {
            flashMessages,
            successMeg,
            header: 'Admin Products',
            users,
            productCount,
            userCount,
            categoryCount,
            product: product,
            category
        }); //pass users to the ejs

    } catch (err) {
        console.log(err)
    }

})

//post the add product 
router.post('/add_product', upload.single('image'), [
    check('productName', 'product  must have a name!').notEmpty(),
    check('productCategory', 'product  must belog to a category').notEmpty(),
    check('popular', 'select if the product is pupolar or not').notEmpty(),
    check('badge', 'select badge').notEmpty(),
    check('rating', 'Rate your product').notEmpty(),
    check('price', 'price  must have a value!').notEmpty(),
    check('desc', 'product  must have a Description!').notEmpty(),
], async (req, res) => {
    const categories = await Category.find()
    const products = await Product.find()
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await user.countDocuments();

    const productName = req.body.productName;
    const popular = req.body.popular;
    const badge = req.body.badge;
    const rating = req.body.rating;
    const productCategory = req.body.productCategory;
    const price = req.body.price;
    const desc = req.body.desc
    const image = req.file;

    const errors = validationResult(req)
    if ((!errors.isEmpty())) {
        res.render('admin/add_product', {
            errors: errors.array(),
            productName,
            productCategory,
            price,
            desc,
            popular,
            badge,
            rating,
            image,
            category: categories,
            productCount,
            categoryCount,
            userCount,
            product: products
        })
    } else {
        try {
            const existingProduct = await Product.findOne({ productName: productName });
            if (existingProduct) {
                req.flash('danger', 'product name already exists')
                res.render('admin/admin_product', {
                    failureMessages: req.flash('danger'),
                    successMeg: req.flash('success'),
                    errors: errors.array(),
                    header: 'Admin Product',
                    product: products,
                    productCount,
                    categoryCount,
                    userCount,
                    category: categories
                })
            } else {
                // upload to cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'venmore/products',
                    width: 300,
                    height: 300
                })
                //get the last category
                const lastProduct = await Product.findOne().sort({ product_id: -1 });
                let nextIdNumber = 1;
                if (lastProduct) {
                    //extract the number part from it pro00001
                    const lastNumber = parseInt(lastProduct.product_id.replace("PRO", ""));
                    nextIdNumber = lastNumber + 1;
                }
                //format: PRO + four-digit padded number
                const newProId = "PRO" + nextIdNumber.toString().padStart(5, "0");

                const newProduct = new Product({
                    product_id: newProId,
                    productName,
                    productCategory,
                    price,
                    popular,
                    badge,
                    rating,
                    desc,
                    image: result.url,
                    public_id: result.public_id

                })
                await newProduct.save()
                req.flash('success', 'product added');
                res.redirect('/admin/admin_product')
            }
        } catch (err) {
            console.log(err)
            req.flash('danger', 'something went wrong, check your network and try again')
            res.redirect('/admin/admin_product')
        }
    }
})


//deleting a product
router.get('/admin_product/delete/:id', async (req, res) => {

    const productId = req.params.id;
    try {
        const product = await Product.findById(productId);

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/admin_product');
        }

        //  Delete Cloudinary image (if exists)
        const public_id = product.public_id
        if (public_id) {
            await cloudinary.uploader.destroy(public_id, function (error, result) { });
        }
        await Product.findByIdAndDelete(productId);

        req.flash('success', 'product deleted successfully')
        return res.redirect('/admin/admin_product')
    } catch (err) {
        console.error(err)
    }

})

// editing page
router.get('/admin_product/edit/:id', async (req, res) => {
    const productId = req.params.id;
    loggedUser = req.session.user
    try {

        const users = await user.findOne({ email: loggedUser.email })
        const prod = await Product.find() //fetch all product from the productDB
        const product = await Product.findById(productId);
        const category = await Category.find();
        const productCount = await Product.countDocuments();
        const categoryCount = await Category.countDocuments();
        const userCount = await user.countDocuments();

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/admin_product');
        }
        const failureMessages = req.flash('danger')
        const successMeg = req.flash('success')
        res.render('admin/product_edit', {
            product,
            prod,
            category,
            failureMessages,
            successMeg,
            productCount,
            categoryCount,
            userCount,
            users
        })
    } catch (err) {

    }
})

// post editing product page
router.post('/admin_product/edit/:id', upload.single('image'), [
    check('productName', 'Product  must have a Name!').notEmpty(),
    check('desc', 'Description must have a value!').notEmpty(),
    check('price', 'price must have a value!').notEmpty(),
    check('popular', 'select if its a popular product').notEmpty(),
    check('badge', 'select the badge').notEmpty(),
    check('rating', 'you forgot to rate your product').notEmpty(),
    check('productCategory', 'price must have a value!').notEmpty(),
], async (req, res) => {
    const productName = req.body.productName;
    const desc = req.body.desc;
    const popular = req.body.popular ;
    const badge = req.body.badge ;
    const rating = req.body.rating ;
    const price = req.body.price;
    const productCategory = req.body.productCategory;

    const userid = req.params.id
    loggedUser = req.session.user
    const users = await user.findOne({ email: loggedUser.email })
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await user.countDocuments();

    const errors = validationResult(req)
    if ((!errors.isEmpty())) {
        const category = await Category.find();
        const product = await Product.findById(userid);
        res.render('admin/admin_product', {
            errors: errors.array(),
            header: 'Admin Product',
            users,
            product,
            popular,
            badge,
            rating,
            productCount,
            categoryCount,
            userCount,
            category
        })
    } else {
        try {
            const category = await Category.find();
            const product = await Product.findOne({ productName });
            if (product) {

                req.flash('danger', 'product name exist')
                res.render('admin/product_edit/', {
                    failureMessages,
                    successMeg,
                    productCount,
                    categoryCount,
                    userCount
                })
            }
            if (!product) {
                const product = await Product.findById(userid);
                const public_id = product.public_id;
                await cloudinary.uploader.destroy(public_id, function (error, result) { });
            }
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'venmore/products',
                width: 300,
                height: 300
            })
            const pro = await Product.updateOne({ _id: userid }, {
                productName,
                desc,
                price,
                popular,
                badge,
                rating,
                productCategory,
                image: result.url,
                public_id: result.public_id
            })
            req.flash('success', 'Product edited')
            res.redirect('/admin/admin_product');
        } catch (err) {
            req.flash('danger', 'Error editing product');
            res.redirect('/admin/admin_product');
        }
    }

})

// post the logout
router.post('/logout', (req, res) => {
    //save flash sucess message before destroying the session
    req.flash('success', 'you have logged out successfully')
    //destroy the user session 
    req.session.destroy((err) => {
        if (err) {
            console.error('error destroying the session', err)
            req.flash('danger', 'logout failed, check your network and try again')
            return res.redirect('/admin/admin')
        } else {
            //clear any residual cookies if any
            res.clearCookie('connect.sid');
            res.redirect('/')
        }
    })
})


module.exports = router;