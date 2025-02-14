const express = require('express');
const db = require('../../../utils/db.js');
const router = express.Router();
const passport = require('passport');

router.get('/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => res.redirect('/')
);

module.exports = router;
