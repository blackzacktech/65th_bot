const express = require('express');
const db = require('../../../utils/db.js');
const router = express.Router();

//?📌 Route für alle Benutzer in einer übersichtlichen Tabelle
//? 🔗 /user
router.get('/user', (req, res) => {
    const searchTerm = req.query.search || ''; // Suchbegriff aus den Query-Parametern abrufen

    // SQL-Abfrage anpassen, um nach Soldaten Name oder Benutzername zu filtern
    db.all(`
        SELECT * FROM main_server_users 
        WHERE "Soldaten Name" LIKE ? OR username LIKE ? 
        ORDER BY "Soldaten Name" ASC
    `, [`%${searchTerm}%`, `%${searchTerm}%`], (err, users) => {
        if (err) {
            console.error("❌ Fehler beim Abrufen der Benutzer:", err);
            return res.status(500).send("Fehler beim Laden der Benutzerdaten.");
        }
        res.render('User/users', { title: "Benutzerübersicht", users, searchTerm }); // Suchbegriff an die Ansicht übergeben
    });
});

module.exports = router;
