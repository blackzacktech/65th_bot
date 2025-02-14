const express = require('express');
const passport = require('passport');
const router = express.Router();

//? 📌 Discord-Login
router.get('/login', passport.authenticate('discord'));

module.exports = router;
