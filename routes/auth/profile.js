const express = require('express');
const db = require('../../utils/db.js'); // Falls du eine separate Datei für DB-Zugriff hast
const router = express.Router();

//? 📌 Eigene Profilseite
router.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');

    db.get(`SELECT * FROM main_server_users WHERE user_id = ?`, [req.user.id], (err, userData) => {
        if (err || !userData) return res.status(500).send("Fehler beim Laden des Profils.");

        db.get(`SELECT story FROM user_stories WHERE user_id = ?`, [req.user.id], (err, storyData) => {
            res.render('User/profile', {
                title: "Mein Profil",
                user: req.user,
                soldierName: userData["Soldaten Name"],
                story: storyData ? storyData.story : "Keine Story eingetragen."
            });
        });
    });
});

module.exports = router;
