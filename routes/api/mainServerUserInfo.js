const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();

//? 📌 Einzelne Benutzerinformationen abrufen
//? 🔗 /main-server-users/:id
router.get('/main-server-users/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT * FROM main_server_users WHERE user_id = ?', [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        res.json(row);
    });
});

module.exports = router;
