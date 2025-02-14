const express = require('express');
const db = require('../../../utils/db.js');
const router = express.Router();

//? 📌 Partner-Server abrufen
//? 🔗 /partner-servers
router.get('/partner-servers', (req, res) => {
    db.all('SELECT * FROM partner_servers', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
