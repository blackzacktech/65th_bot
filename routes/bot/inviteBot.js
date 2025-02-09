const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();

//? 📌 Weiterleitung zum Bot-Invite-Link ---- /invite-bot
//? 🔗 /
router.get('/invite-bot', (req, res) => {
    res.redirect('https://discord.com/oauth2/authorize?client_id=1333895828175065119');
});

module.exports = router;
