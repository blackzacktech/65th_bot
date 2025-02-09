const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();

//? 📌 Alle Server anzeigen, in denen der Bot ist*
//? 🔗 /bot-servers
router.get('/bot-servers', (req, res) => {
    db.all(`SELECT * FROM bot_servers`, [], (err, servers) => {
        if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Server." });

        res.render('Bot/botServers', { title: "Bot-Server", servers });
    });
});

module.exports = router;
