const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();

//? 📌 Partner-Benutzer abrufen
//? 🔗 /partners
router.get('/partners', (req, res) => {
    db.all('SELECT * FROM partners', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
