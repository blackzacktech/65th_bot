const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();

//? 📌 Einweisungen einer bestimmten Benutzers abrufen
//? 🔗 /:discordUserId/instructions
router.get('/:discordUserId/instructions', (req, res) => {
    const { discordUserId } = req.params;

    // Zuerst den Soldaten Namen abrufen
    db.get(
        `SELECT "Soldaten Name" FROM main_server_users WHERE user_id = ?`,
        [discordUserId],
        (err, userData) => {
            if (err) {
                console.error("❌ Fehler beim Abrufen des Soldaten Namens:", err);
                return res.status(500).send("❌ Fehler beim Laden der Nutzerdaten.");
            }

            let ctNumber = discordUserId; // Standard: Discord-ID, falls keine CT-Nummer gefunden wird
            if (userData && userData["Soldaten Name"]) {
                // Versuche die CT-Nummer aus dem Soldaten Namen zu extrahieren
                const ctMatch = userData["Soldaten Name"].match(/(CT|CC|AT)-\d+/i);
                if (ctMatch) {
                    ctNumber = ctMatch[0]; // Setze CT-Nummer, wenn gefunden
                }
            }

            // Dann die Einweisungs-Daten abrufen
            db.all(
                `SELECT trainee_user_id, trainee_username, vrc_name, instructor_username, ct_number, timestamp 
                 FROM instructions 
                 WHERE instructor_user_id = ? 
                 ORDER BY timestamp DESC`,
                [discordUserId],
                (err, instructions) => {
                    if (err) {
                        console.error("❌ Fehler beim Abrufen der Einweisungen:", err);
                        return res.status(500).send("❌ Fehler beim Laden der Einweisungen.");
                    }

                    res.render('User/userInstructions', {
                        title: `Einweisungen von ${ctNumber}`, // 🔥 Jetzt mit CT-Nummer!
                        instructions,
                        ctNumber
                    });
                }
            );
        }
    );
});

module.exports = router;
