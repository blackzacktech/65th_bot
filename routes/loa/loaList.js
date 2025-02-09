const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();
const moment = require('moment');
require('dotenv').config();

//? 📌 LOA-Abmeldungen anzeigen
//? 🔗 /loa
router.get('/loa', (req, res) => {
    const today = moment().format("YYYY-MM-DD"); // Sicheres Format für Vergleich

    db.all(
        `SELECT loa.username, loa.from_date, loa.to_date, loa.reason, users."Soldaten Name" AS soldier_name 
         FROM loa 
         LEFT JOIN main_server_users AS users ON loa.user_id = users.user_id
         WHERE loa.to_date >= DATE(?) 
         ORDER BY loa.to_date ASC`,
        [today],
        (err, loaData) => {
            if (err) {
                return res.status(500).send("❌ Fehler beim Laden der Abmeldungen.");
            }

            const cleanLoaData = loaData.map(loa => {
                let fromDate = moment(loa.from_date, ["YYYY-MM-DD", "DD.MM.YYYY"], true).format("DD.MM.YYYY");
                let toDate = moment(loa.to_date, ["YYYY-MM-DD", "DD.MM.YYYY"], true).format("DD.MM.YYYY");
                let isActive = moment(toDate, "DD.MM.YYYY").isSameOrAfter(today, 'day');

                return {
                    soldier_name: loa.soldier_name || "Unbekannt",
                    username: loa.username || "Unbekannt",
                    from_date: fromDate || "Unbekannt",
                    to_date: toDate || "Unbekannt",
                    reason: loa.reason && loa.reason.length > 5 ? loa.reason : "Kein Grund angegeben",
                    isActive
                };
            });

            res.render('Bot/loa', { 
                title: "Aktuelle Abmeldungen", 
                loaData: cleanLoaData.filter(loa => loa.isActive) // ✅ Nur aktive LOAs behalten
            });
        }
    );
});

module.exports = router;
