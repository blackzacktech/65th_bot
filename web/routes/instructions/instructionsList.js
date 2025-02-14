const express = require('express');
const db = require('../../../utils/db.js');
const router = express.Router();

//? 📌 Einweisungen anzeigen
//? 🔗 /instructions
router.get('/instructions', (req, res) => {
    db.all(
        `SELECT trainee_user_id, trainee_username, vrc_name, instructor_username, ct_number, timestamp 
         FROM instructions 
         ORDER BY timestamp DESC`,
        [],
        (err, instructions) => {
            if (err) {
                console.error("❌ Fehler beim Abrufen der Einweisungen:", err);
                return res.status(500).send("❌ Fehler beim Laden der Einweisungen.");
            }
            res.render('Bot/instructions', { title: "Einweisungen", instructions });
        }
    );
});

module.exports = router;
