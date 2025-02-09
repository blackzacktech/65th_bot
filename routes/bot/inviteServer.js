const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();

//? 📌 Weiterleitung zum Haupt-Discord-Server ---- /invite-server
//? 🔗 /
router.get('/invite-server', (req, res) => {
    res.redirect('https://discord.com/invite/AeeTSBwXGP');
});

module.exports = router;
