const path = require('path');
const db = require(path.join(__dirname, '../../../utils/db'));
const moment = require('moment');
require('dotenv').config();

module.exports = {
    name: 'saveoldloa',
    description: 'Durchsucht den LOA-Channel im Main-Server nach alten Abmeldungen und speichert sie in der SQLite-Datenbank.',
    permission: 'freigabe2',
    async execute(message) {
        const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
        const LOA_CHANNEL_ID = process.env.LOA_CHANNEL_ID;

        const mainGuild = message.client.guilds.cache.get(MAIN_SERVER_ID);
        if (!mainGuild) {
            return message.reply("❌ Fehler: Der Main-Server wurde nicht gefunden!");
        }

        const channel = mainGuild.channels.cache.get(LOA_CHANNEL_ID);
        if (!channel) {
            return message.reply("❌ Fehler: Der LOA-Channel wurde nicht gefunden.");
        }

        let messages = [];
        let lastMessageId = null;

        await mainGuild.members.fetch();

        while (true) {
            const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
            if (fetchedMessages.size === 0) break;

            messages = messages.concat(Array.from(fetchedMessages.values()));
            lastMessageId = fetchedMessages.last().id;
        }

        let savedCount = 0;

        for (const msg of messages) {
            const userId = msg.author.id;
            const username = msg.author.username;
            let content = msg.content;

            // 🛠 **Robuste Datumserkennung**
            const dateRegex = /\*\*Ab Wann:\*\*[\s]*(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})[\s\S]*?\*\*Bis Wann:\*\*[\s]*(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/i;
            const singleDateRegex = /\*\*Ab Wann:\*\*[\s]*(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/i;

            let fromDate = "Unbekannt";
            let toDate = "Unbekannt";

            let match = content.match(dateRegex);
            if (match) {
                fromDate = match[1];
                toDate = match[2];
            } else {
                let singleMatch = content.match(singleDateRegex);
                if (singleMatch) {
                    fromDate = toDate = singleMatch[1];
                }
            }

            // 🔄 **Konvertiere Datum in `YYYY-MM-DD`**
            fromDate = moment(fromDate, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true).isValid()
                ? moment(fromDate, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true).format("YYYY-MM-DD")
                : "Unbekannt";

            toDate = moment(toDate, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true).isValid()
                ? moment(toDate, ["DD.MM.YYYY", "D.M.YYYY", "YYYY-MM-DD"], true).format("YYYY-MM-DD")
                : "Unbekannt";

            // 🔍 **Grund extrahieren**
            let reasonMatch = content.match(/(?:Ausführlicher Grund für die Abmeldung:|Grund:)\s*(.+)/i);
            let reason = reasonMatch ? reasonMatch[1].trim() : "Kein Grund angegeben";

            if (reason.length < 5) {
                reason = "Kein Grund angegeben";
            }

            const timestamp = moment(msg.createdTimestamp).format('YYYY-MM-DD HH:mm:ss');

            // 🛠 **Debugging: Konsolen-Ausgabe der extrahierten Daten**
            console.log(`📌 LOA gefunden:`);
            console.log(`   👤 User: ${username} (${userId})`);
            console.log(`   📅 Von: ${fromDate}`);
            console.log(`   📅 Bis: ${toDate}`);
            console.log(`   📝 Grund: ${reason}`);

            // Falls das Datum oder der Grund nicht erkannt wurde, logge die Originalnachricht
            if (fromDate === "Unbekannt" || toDate === "Unbekannt" || reason === "Kein Grund angegeben") {
                console.warn(`❌ Fehlerhafte LOA-Nachricht:\n${content}`);
                continue; // Nachricht überspringen, wenn Daten fehlen
            }

            // LOA in SQLite speichern
            db.run(
                `INSERT INTO loa (user_id, username, from_date, to_date, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, username, fromDate, toDate, reason, timestamp],
                (err) => {
                    if (err) {
                        console.error(`❌ Fehler beim Speichern der LOA-Nachricht von ${userId}:`, err);
                    } else {
                        savedCount++;
                    }
                }
            );
        }

        message.reply(`✅ Fertig! ${savedCount} alte LOA-Nachrichten wurden gespeichert.`);
    }
};
