const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();
const moment = require('moment');
require('dotenv').config();

//? 📌 LOA-Abmeldungen eines bestimmten Benutzers abrufen
//? 🔗 /:discordUserId/loa
router.get('/:discordUserId/loa', (req, res) => {
    const { discordUserId } = req.params;

    db.get(
        `SELECT "Soldaten Name" FROM main_server_users WHERE user_id = ?`,
        [discordUserId],
        (err, userData) => {
            if (err) {
                console.error("❌ Fehler beim Abrufen des Soldaten Namens:", err);
                return res.status(500).send("❌ Fehler beim Laden der Nutzerdaten.");
            }

            let ctNumber = discordUserId;
            if (userData && userData["Soldaten Name"]) {
                const ctMatch = userData["Soldaten Name"].match(/(CT|CC|AT)-\d+/i);
                if (ctMatch) {
                    ctNumber = ctMatch[0];
                }
            }

            db.all(
                `SELECT from_date, to_date, reason 
                 FROM loa 
                 WHERE user_id = ? 
                 ORDER BY to_date DESC`,
                [discordUserId],
                (err, loaData) => {
                    if (err) return res.status(500).send("❌ Fehler beim Laden der LOA-Daten.");

                    const today = moment().format("YYYY-MM-DD");

                    // **Füge `isActive` direkt im Backend hinzu, damit EJS das nicht berechnen muss**
                    const cleanLoaData = loaData.map(loa => {
                        let fromDate = moment(loa.from_date, ["YYYY-MM-DD", "DD.MM.YYYY"], true).format("DD.MM.YYYY");
                        let toDate = moment(loa.to_date, ["YYYY-MM-DD", "DD.MM.YYYY"], true).format("DD.MM.YYYY");

                        let isActive = moment(loa.to_date, ["YYYY-MM-DD", "DD.MM.YYYY"], true).isSameOrAfter(today, 'day');

                        return {
                            from_date: fromDate || "Unbekannt",
                            to_date: toDate || "Unbekannt",
                            reason: loa.reason && loa.reason.length > 5 ? loa.reason : "Kein Grund angegeben",
                            isActive
                        };
                    });

                    res.render('User/userLoa', { 
                        title: `LOA Übersicht von ${ctNumber}`,
                        loaData: cleanLoaData, 
                        ctNumber 
                    });
                }
            );
        }
    );
});

module.exports = router;
