const db = require('../utils/db');
const moment = require('moment');
require('dotenv').config();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        // 📌 Channel-ID für LOA Nachrichten (Hier anpassen!)
        const LOA_CHANNEL_ID = '1286192943274655765';

        if (message.channel.id !== LOA_CHANNEL_ID) return;

        if (message.content.includes('**__Abmeldung [LOA -leave of absence-]__**')) {
            const regex = /\*\*Ab Wann:\*\*(.+?)\n\*\*Bis Wann:\*\*(.+?)\n\*\*Ausführlicher grund für die Abmeldung:\*\*(.+?)\n\*\*Wer:\*\* <@(\d+)>/s;
            const match = message.content.match(regex);

            if (!match) return;

            let fromDate = match[1].trim();
            let toDate = match[2].trim();
            const reason = match[3].trim();
            const userId = match[4];

            // 🔄 Konvertiere Datum in `YYYY-MM-DD` für SQL-Kompatibilität
            fromDate = moment(fromDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
            toDate = moment(toDate, 'DD.MM.YYYY').format('YYYY-MM-DD');

            // 🔍 Benutzername abrufen
            const user = await message.guild.members.fetch(userId);
            const username = user ? user.user.username : "Unbekannt";

            // Alte LOA speichern
            db.run(
                `INSERT INTO old_loa (user_id, username, from_date, to_date, reason) VALUES (?, ?, ?, ?, ?)`,
                [userId, username, fromDate, toDate, reason],
                (err) => {
                    if (err) {
                        console.error('❌ Fehler beim Speichern der alten LOA:', err);
                    } else {
                        console.log(`✅ Alte LOA gespeichert: ${username} von ${fromDate} bis ${toDate}`);
                    }
                }
            );

            // Daten in die Datenbank speichern
            db.run(
                `INSERT INTO loa (user_id, username, from_date, to_date, reason) VALUES (?, ?, ?, ?, ?)`,
                [userId, username, fromDate, toDate, reason],
                (err) => {
                    if (err) {
                        console.error('❌ Fehler beim Speichern der LOA-Abmeldung:', err);
                    } else {
                        console.log(`✅ LOA gespeichert: ${username} von ${fromDate} bis ${toDate}`);
                    }
                }
            );
        }
    }
};