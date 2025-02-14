const express = require('express');
const db = require('../../../utils/db.js');
const router = express.Router();

//? 📌 Punkte eines Benutzers aktualisieren
//? 🔗 /update-score
router.post('/update-score', (req, res) => {
    const { user_id, points } = req.body;
    if (!user_id || points === undefined) {
        return res.status(400).json({ error: 'Fehlende Parameter' });
    }

    db.run(
        'UPDATE main_server_users SET message_score = message_score + ? WHERE user_id = ?',
        [points, user_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Punkte aktualisiert' });
        }
    );
});

module.exports = router;
