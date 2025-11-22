const express = require('express');
const ejs = require('ejs');
const path = require('path');
const router = express.Router();

router.get ('/', (req, res)=>{
    res.render('home')
})

router.get ('/category', (req, res)=>{
    res.render('category')
})

router.get ('/login', (req, res)=>{
    res.render('login')
})

router.get ('/register', (req, res)=>{
    res.render('register')
})


module.exports = router;