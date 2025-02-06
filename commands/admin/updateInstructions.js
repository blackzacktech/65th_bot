const db = require('../../utils/db');
const moment = require('moment');
require('dotenv').config();

module.exports = {
    name: 'updateinstructions',
    description: 'Überprüft alle alten Einweisungen im Channel und speichert sie in die Datenbank.',
    permission: 'freigabe2',
    async execute(message) {
        const INSTRUCTION_CHANNEL_ID = process.env.INSTRUCTION_CHANNEL_ID;
        const channel = message.client.channels.cache.get(INSTRUCTION_CHANNEL_ID);

        if (!channel) {
            return message.reply("❌ Fehler: Der Einweisungs-Channel wurde nicht gefunden.");
        }

        message.reply("🔄 Starte das Scannen aller alten Einweisungen...");

        let messages = [];
        let lastMessageId = null;

        // 🔄 Nachrichten abrufen (bis alle durch sind)
        while (true) {
            const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
            if (fetchedMessages.size === 0) break;

            messages = messages.concat(Array.from(fetchedMessages.values()));
            lastMessageId = fetchedMessages.last().id;
        }

        console.log(`🔍 ${messages.length} Nachrichten gefunden!`);

        for (const msg of messages) {
            if (msg.content.includes('**__ Einweisung__**')) {
                console.log(`📌 Verarbeite Nachricht von ${msg.author.username}...`);

                const regex = /\*\*name der\s+Eingewiesenen person:\*\*\s*<@(\d+)>\s*\n\*\*VRC Name der\s+- Eingewiesenen person:\*\*\s*(.+?)\s*\n\*\*Rang\+CT Nummer des Ausbilders:\*\*\s*(.+?)\s*\n\*\*Ping:\*\*\s*<@&\d+>/s;
                const match = msg.content.match(regex);

                if (!match) {
                    console.log("❌ Keine Übereinstimmung mit dem Regex!");
                    continue;
                }

                const traineeUserId = match[1].trim();
                const vrcName = match[2].trim();
                const instructorInfo = match[3].trim();
                const timestamp = moment(msg.createdTimestamp).format('YYYY-MM-DD HH:mm:ss');

                const ctNumberMatch = instructorInfo.match(/ct\s*-?\s*(\d+)/i);
                if (!ctNumberMatch) {
                    console.log("❌ Keine CT-Nummer im Einweisungstext gefunden.");
                    continue;
                }

                const ctNumber = `CT-${ctNumberMatch[1]}`;

                // 🔍 **Ausbilder in der Datenbank suchen**
                db.get(
                    `SELECT user_id, username FROM main_server_users WHERE "Soldaten Name" LIKE ?`,
                    [`%${ctNumber}%`],
                    (err, row) => {
                        if (err || !row) {
                            console.log(`❌ Kein Ausbilder für CT-Nummer ${ctNumber} gefunden.`);
                            return;
                        }

                        const instructorUserId = row.user_id;
                        const instructorUsername = row.username;

                        // 📌 Prüfen, ob Einweisung schon existiert
                        db.get(
                            `SELECT COUNT(*) AS count FROM instructions WHERE trainee_user_id = ?`,
                            [traineeUserId],
                            (err, result) => {
                                if (result.count > 0) {
                                    console.log(`❌ Einweisung für ${vrcName} existiert bereits.`);
                                    return;
                                }

                                // 📌 Einweisung speichern
                                db.run(
                                    `INSERT INTO instructions (trainee_user_id, trainee_username, vrc_name, instructor_user_id, instructor_username, ct_number, timestamp) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                    [traineeUserId, vrcName, vrcName, instructorUserId, instructorUsername, ctNumber, timestamp],
                                    () => console.log(`✅ Alte Einweisung gespeichert: ${vrcName}`)
                                );
                            }
                        );
                    }
                );
            }
        }
        message.reply("✅ Alle alten Einweisungen wurden geprüft!");
    }
};
