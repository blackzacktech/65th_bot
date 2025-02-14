const path = require('path');
const db = require(path.join(__dirname, '../../../utils/db'));
const moment = require('moment');
require('dotenv').config();

module.exports = {
    name: 'saveoldinstructions',
    description: 'Durchsucht den Einweisungs-Channel im Main-Server nach alten Einweisungen und speichert sie in die SQLite-Datenbank.',
    permission: 'freigabe2',
    async execute(message) {
        const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
        const INSTRUCTION_CHANNEL_ID = process.env.INSTRUCTION_CHANNEL_ID;

        // 🏛 Hauptserver abrufen
        const mainGuild = message.client.guilds.cache.get(MAIN_SERVER_ID);
        if (!mainGuild) {
            return message.reply("❌ Fehler: Der Main-Server wurde nicht gefunden!");
        }

        // 📌 Einweisungs-Channel abrufen
        const channel = mainGuild.channels.cache.get(INSTRUCTION_CHANNEL_ID);
        if (!channel) {
            return message.reply("❌ Fehler: Der Einweisungs-Channel wurde nicht gefunden.");
        }

        message.reply("🔄 Starte das Scannen aller alten Einweisungen im Hauptserver...");

        let messages = [];
        let lastMessageId = null;
        let totalScanned = 0;

        // 🔄 **Nachrichtenabruf mit unbegrenztem Scrollen**
        while (true) {
            const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
            if (fetchedMessages.size === 0) break;

            messages = messages.concat(Array.from(fetchedMessages.values()));
            lastMessageId = fetchedMessages.last().id;
            totalScanned += fetchedMessages.size;

            console.log(`📌 Gescannte Nachrichten: ${totalScanned}`);
        }

        console.log(`🔍 Insgesamt ${messages.length} Nachrichten gefunden!`);

        let savedCount = 0;

        for (const msg of messages) {
            if (!msg.content.includes("Einweisung")) continue;

            console.log(`📌 Verarbeite Einweisung von ${msg.author.username}...`);

            // 🛠 **Robustes Parsing zur Fehlervermeidung (Markdown-Probleme fixen)**
            let content = msg.content.replace(/\*/g, "").replace(/_/g, "").trim(); // Entfernt **, *, __, _

            // 🛠 **Verbesserte Regex-Erkennung für mögliche Fehler in Formatierung**
            const regex = /name der\s+Eingewiesenen person:\s*<@(\d+)>\s*\n.*?VRC Name.*?:\s*(.+?)\s*\n.*?Rang\+CT Nummer.*?:\s*(.+?)\s*\n.*?Ping:/is;
            const match = content.match(regex);

            if (!match) {
                console.log("❌ Keine Übereinstimmung mit dem Regex! Originalnachricht:");
                console.log(content);
                continue;
            }

            const traineeUserId = match[1].trim();
            const vrcName = match[2].trim();
            const instructorInfo = match[3].trim();
            const timestamp = moment(msg.createdTimestamp).format('YYYY-MM-DD HH:mm:ss');

            // 🔍 **CT-, CC- oder AT-Nummer erkennen (Fehlertolerant)**
            const ctNumberMatch = instructorInfo.match(/\b(CT|CC|AT)\s*[-]?\s*(\d{1,4})\b/i);
            if (!ctNumberMatch) {
                console.log("❌ Keine gültige CT-, CC- oder AT-Nummer im Einweisungstext gefunden.");
                console.log(`Original Rang+CT Nummer Info: "${instructorInfo}"`);
                continue;
            }

            const ctNumber = `${ctNumberMatch[1].toUpperCase()}-${ctNumberMatch[2]}`; // Einheitliches Format z. B. CT-3663

            console.log(`🔍 Erkannte CT-/CC-/AT-Nummer: ${ctNumber}`);

            // 🔍 **Ausbilder anhand der CT-Nummer in der Datenbank suchen**
            db.get(
                `SELECT user_id, username FROM main_server_users WHERE "Soldaten Name" LIKE ?`,
                [`%${ctNumber}%`],
                (err, row) => {
                    if (err || !row) {
                        console.log(`❌ Kein Ausbilder für ${ctNumber} gefunden.`);
                        return;
                    }

                    const instructorUserId = row.user_id;
                    const instructorUsername = row.username;

                    // 📌 Prüfen, ob Einweisung bereits existiert
                    db.get(
                        `SELECT COUNT(*) AS count FROM instructions WHERE trainee_user_id = ? AND vrc_name = ?`,
                        [traineeUserId, vrcName],
                        (err, result) => {
                            if (err) {
                                console.error("❌ Fehler bei der Dublettenprüfung:", err);
                                return;
                            }

                            if (result.count > 0) {
                                console.log(`❌ Einweisung für ${vrcName} existiert bereits.`);
                                return;
                            }

                            // 📌 Einweisung speichern
                            db.run(
                                `INSERT INTO instructions (trainee_user_id, trainee_username, vrc_name, instructor_user_id, instructor_username, ct_number, timestamp) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [traineeUserId, vrcName, vrcName, instructorUserId, instructorUsername, ctNumber, timestamp],
                                (err) => {
                                    if (err) {
                                        console.error('❌ Fehler beim Speichern der Einweisung:', err);
                                    } else {
                                        console.log(`✅ Einweisung gespeichert: ${vrcName} von ${instructorUsername} (${ctNumber})`);
                                        savedCount++;
                                    }
                                }
                            );
                        }
                    );
                }
            );
        }

        message.reply(`✅ Fertig! ${savedCount} alte Einweisungen wurden gespeichert.`);
    }
};
