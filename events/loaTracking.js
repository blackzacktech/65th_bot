const db = require('../utils/db');
const moment = require('moment');
require('dotenv').config();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        // 📌 Main-Server & LOA-Channel IDs aus Umgebungsvariablen
        const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
        const LOA_CHANNEL_ID = process.env.LOA_CHANNEL_ID;

        if (message.guild.id !== MAIN_SERVER_ID) return;
        if (message.channel.id !== LOA_CHANNEL_ID) return;

        if (message.content.includes('Abmeldung [LOA -leave of absence-]')) {
            let content = message.content;

            // 🔄 **Markdown & Leerzeichen fixen**
            content = content.replace(/\*/g, "").replace(/_/g, "").trim();

            // 🛠 **Erweiterte Datumserkennung**
            const dateRegex = /(?:Ab Wann:\s*([\d]{1,2}[.\-\/][\d]{1,2}[.\-\/][\d]{4}))[\s\S]*?(?:Bis Wann:\s*([\d]{1,2}[.\-\/][\d]{1,2}[.\-\/][\d]{4}))/i;
            const singleDateRegex = /Ab Wann:\s*([\d]{1,2}[.\-\/][\d]{1,2}[.\-\/][\d]{4})/i;

            let fromDate = "Unbekannt";
            let toDate = "Unbekannt";

            let match = content.match(dateRegex);
            if (match) {
                fromDate = match[1].trim();
                toDate = match[2].trim();
            } else {
                let singleMatch = content.match(singleDateRegex);
                if (singleMatch) {
                    fromDate = toDate = singleMatch[1].trim();
                }
            }

            // 🔄 **Konvertiere Datum in `YYYY-MM-DD`**
            fromDate = moment(fromDate, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true).isValid()
                ? moment(fromDate, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true).format("YYYY-MM-DD")
                : "Unbekannt";

            toDate = moment(toDate, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true).isValid()
                ? moment(toDate, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true).format("YYYY-MM-DD")
                : "Unbekannt";

            // 🔍 **Benutzer-ID extrahieren**
            const userMatch = content.match(/Wer:\s*<@!?(\d+)>/);
            const userId = userMatch ? userMatch[1] : "Unbekannt";

            // 🔍 **Grund extrahieren (auch wenn "Grund" nicht explizit gesetzt wurde)**
            let reasonMatch = content.match(/(?:Grund:|Ausführlicher Grund für die Abmeldung:)\s*(.+)/i);
            let reason = reasonMatch ? reasonMatch[1].trim() : "Kein Grund angegeben";

            // Falls der Grund zu kurz ist, wird er ignoriert
            if (reason.length < 5) {
                reason = "Kein Grund angegeben";
            }

            let username = "Unbekannt";
            if (userId !== "Unbekannt") {
                try {
                    const user = await message.guild.members.fetch(userId);
                    username = user ? user.user.username : "Unbekannt";
                } catch (err) {
                    console.error(`❌ Fehler beim Abrufen des Benutzernamens für ${userId}:`, err);
                }
            }

            // 📌 **Debugging: Zeigt alle erkannten Daten an**
            console.log(`📌 LOA erfasst:`);
            console.log(`   👤 User: ${username} (${userId})`);
            console.log(`   📅 Von: ${fromDate}`);
            console.log(`   📅 Bis: ${toDate}`);
            console.log(`   📝 Grund: ${reason}`);

            // 🛠 **Erkenne & korrigiere fehlerhafte Einträge**
            if (fromDate === "Unbekannt" || toDate === "Unbekannt") {
                console.warn(`❌ Fehlerhafte LOA-Nachricht:\n${content}`);
                return;
            }

            // 🛠 **Speichern in die Datenbank**
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
