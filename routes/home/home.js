const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();

//? 📌 Webseite mit Statistiken anzeigen
//? 🔗 /
router.get('/', (req, res) => {
    db.get(`
        SELECT 
            COUNT(*) AS totalMembers, 
            SUM(messages_sent) AS totalMessages, 
            SUM(voice_minutes) AS totalVoiceMinutes 
        FROM main_server_users
    `, [], (err, serverStats) => {
        if (err) return res.status(500).send("Fehler beim Laden der Statistik.");

        db.all(`
            SELECT username, messages_sent, voice_minutes, 
                   (messages_sent + voice_minutes + activity_points) AS total_score
            FROM main_server_users 
            ORDER BY total_score DESC 
            LIMIT 10
        `, [], (err, leaderboard) => {
            if (err) return res.status(500).send("Fehler beim Laden des Leaderboards.");

            res.render('Structur/index', { title: "Home", serverStats, leaderboard });
        });
    });
});

module.exports = router;