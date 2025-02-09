const express = require('express');
const db = require('../../utils/db.js');
const router = express.Router();

//? 📌 Story speichern
router.post('/profile/update', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');

    const discordId = req.user.id;
    const newStory = req.body.story;

    db.run(`
        INSERT INTO user_stories (user_id, story) VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET story = ?
    `, [discordId, newStory, newStory], (err) => {
        if (err) return res.status(500).send("Fehler beim Speichern.");
        res.redirect('/profile');
    });
});

module.exports = router;
