const express = require('express');
const db = require('../../../utils/db.js');
const router = express.Router();
const moment = require('moment');
require('dotenv').config();



//? 📌 Automatische Weiterleitung von `/discordUserId` zu `/discordUserId/info`
//? 🔗 /:discordUserId
router.get('/:discordUserId', (req, res, next) => {
    const { discordUserId } = req.params;

    // Prüfen, ob die Eingabe eine reine Zahl ist (Discord User IDs sind nur Zahlen)
    if (/^\d+$/.test(discordUserId)) {
        return res.redirect(`/${discordUserId}/info`);
    }

    // Falls es keine Zahl ist (z. B. `/main-server-users`), Route normal weiterverarbeiten
    next();
});

//? 📌 Benutzerprofil anzeigen
//? 🔗 /:discordUserId/info
router.get('/:discordUserId/info', async (req, res) => {
    const { discordUserId } = req.params;

    try {
        const guild = await global.client.guilds.fetch(process.env.MAIN_SERVER_ID);
        const member = await guild.members.fetch(discordUserId);
        if (!member) return res.status(404).send("❌ Benutzer nicht gefunden.");

        const username = member.user.username;
        const avatarURL = member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 256 });
        const joinedAt = moment(member.joinedAt).format("DD.MM.YYYY") || "Unbekannt";

        db.get(`SELECT * FROM main_server_users WHERE user_id = ?`, [discordUserId], (err, userData) => {
            let soldierName = userData?.["Soldaten Name"] || "Unbekannt";
            let messagesSent = userData?.messages_sent || 0;
            let voiceMinutes = userData?.voice_minutes || 0;
            let activityPoints = userData?.activity_points || 0;

            let ctNumber = soldierName.match(/(CT|CC|AT)-\d+/i) ? soldierName.match(/(CT|CC|AT)-\d+/i)[0] : discordUserId;

            // 🔹 Rollen des Benutzers abrufen
            const roles = member.roles.cache.map(role => role.name);

            // 🔹 Militärische Ebene & Rang erkennen
            const rankRegex = /\b(C-CPL|CPL|L-CPL|PVT-1st|PVT|TRP|SGT-MAJ|SGT|LT|2nd-LT|MAJ|MAJ-L|CPT|CDR|S-CDR|\*C\*-CDR)\b/;
            const levelRegex = /\b(Commanders|Commanding Officers|Coruscant Guard Officers)\b/;

            const militaryRank = roles.find(role => rankRegex.test(role)) || "Kein Rang";
            const militaryLevel = roles.find(role => levelRegex.test(role)) || "Keine Ebene";

            // 🔹 Medaillen & Klasse extrahieren
            const medals = roles.filter(role => role.includes("Medaille")).join(', ') || "Keine Medaillen";

            const classKeywords = [
                "Senats Gardist", "Arc Trooper", "Riot Force", "Shock Trooper",
                "Massiv-Führer", "Engineering Company", "Hound Staffel", "Barc",
                "Advanced Recon Force", "Non Commissioned Officer", "Marksman",
                "Heavy Trooper", "Medic Trooper"
            ];

            const classRoles = roles.filter(role => classKeywords.some(keyword => role.includes(keyword)));
            const classType = classRoles.length > 0 ? classRoles.join(', ') : "Keine Klasse";

            // 🔹 LOA-Abmeldungen abrufen
            db.get(`SELECT COUNT(*) AS loaCount FROM loa WHERE user_id = ?`, [discordUserId], (err, loaData) => {
                let loaCount = loaData?.loaCount || 0;

                // 🔹 Einweisungen abrufen
                db.get(`SELECT COUNT(*) AS instructionCount FROM instructions WHERE instructor_user_id = ?`, [discordUserId], (err, instructionData) => {
                    let instructionCount = instructionData?.instructionCount || 0;

                    // 🔹 Story abrufen
                    db.get(`SELECT story FROM user_stories WHERE user_id = ?`, [discordUserId], (err, storyData) => {
                        res.render('User/userProfile', {
                            title: `Profil von ${soldierName}`,
                            username, avatarURL, joinedAt,
                            userId: discordUserId,  // 🔥 **Fix: `userId` wird jetzt korrekt übergeben!**
                            soldierName, ctNumber,
                            militaryRank, militaryLevel,
                            messagesSent, voiceMinutes, activityPoints,
                            medals, classType,
                            loaCount, instructionCount,
                            story: storyData ? storyData.story : "Keine Story eingetragen."
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("❌ Fehler beim Abrufen des Benutzers:", error);
        res.status(404).send("❌ Benutzer nicht gefunden.");
    }
});

module.exports = router;
