const db = require('../../utils/db');
const moment = require('moment');

module.exports = {
    name: 'saveoldloa',
    description: 'Durchsucht den LOA-Channel nach alten Abmeldungen und speichert sie in der Datenbank.',
    permission: 'freigabe2',
    async execute(message) {
        const LOA_CHANNEL_ID = '1286192943274655765'; // Channel-ID für LOA Nachrichten
        const channel = message.client.channels.cache.get(LOA_CHANNEL_ID);

        if (!channel) {
            return message.reply("❌ Fehler: Der LOA-Channel wurde nicht gefunden.");
        }

        message.reply("🔄 Starte das Scannen aller alten LOA...");

        let messages = [];
        let lastMessageId = null;

        // Nachrichten abrufen (bis alle durch sind)
        while (true) {
            const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
            if (fetchedMessages.size === 0) break;

            messages = messages.concat(Array.from(fetchedMessages.values()));
            lastMessageId = fetchedMessages.last().id;
        }

        console.log(`🔍 ${messages.length} Nachrichten gefunden!`);

        for (const msg of messages) {
            if (msg.content.includes('**__Abmeldung [LOA -leave of absence-]__**')) {
                console.log(`📌 Verarbeite Nachricht von ${msg.author.username}...`);

                const regex = /\*\*Ab Wann:\*\*(.+?)\n\*\*Bis Wann:\*\*(.+?)\n\*\*Ausführlicher grund für die Abmeldung:\*\*(.+?)\n\*\*Wer:\*\* <@(\d+)>/s;
                const match = msg.content.match(regex);

                if (!match) {
                    console.log("❌ Keine Übereinstimmung mit dem Regex!");
                    continue;
                }

                let fromDate = match[1].trim();
                let toDate = match[2].trim();
                const reason = match[3].trim();
                const userId = match[4];

                // Konvertiere Datum in `YYYY-MM-DD` für SQL-Kompatibilität
                fromDate = moment(fromDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
                toDate = moment(toDate, 'DD.MM.YYYY').format('YYYY-MM-DD');

                // Benutzername abrufen
                const user = await msg.guild.members.fetch(userId);
                const username = user ? user.user.username : "Unbekannt";

                // Alte LOA speichern
                db.run(
                    `INSERT INTO loa (user_id, username, from_date, to_date, reason) VALUES (?, ?, ?, ?, ?)`,
                    [userId, username, fromDate, toDate, reason],
                    (err) => {
                        if (err) {
                            console.error('❌ Fehler beim Speichern der alten LOA:', err);
                        } else {
                            console.log(`✅ Alte LOA gespeichert: ${username} von ${fromDate} bis ${toDate}`);
                        }
                    }
                );
            }
        }

        message.reply("✅ Alle alten LOA wurden gespeichert!");
    }
};
