const db = require('../utils/db');
const moment = require('moment');
require('dotenv').config();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        // 📌 Nur im Hauptserver und Einweisungs-Channel aktiv!
        const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
        const INSTRUCTION_CHANNEL_ID = process.env.INSTRUCTION_CHANNEL_ID;

        if (message.guild.id !== MAIN_SERVER_ID || message.channel.id !== INSTRUCTION_CHANNEL_ID) return;

        if (message.content.includes('**__Einweisung__**')) {
            console.log("📌 Neue Einweisung erkannt...");

            // ✅ Verbesserter Regex für flexiblere Erkennung (optional @, besserer CT-Match)
            const regex = /\*\*@?name der\s+Eingewiesenen person:\*\*\s*<@(\d+)>\s*\n\*\*VRC Name der\s+- Eingewiesenen person:\*\*\s*(.+?)\s*\n\*\*Rang\+CT Nummer des Ausbilders:\*\*\s*(.+?)\s*\n\*\*Ping:\*\*\s*<@&\d+>/s;
            const match = message.content.match(regex);

            if (!match) {
                console.log("❌ Keine Übereinstimmung mit dem Regex!");
                return;
            }

            const traineeUserId = match[1].trim();
            const vrcName = match[2].trim();
            const instructorInfo = match[3].trim();
            const timestamp = moment(message.createdTimestamp).format('YYYY-MM-DD HH:mm:ss');

            // 🔍 CT-Nummer auslesen (verbesserte Version)
            const ctNumberMatch = instructorInfo.match(/CT[-\s]?(\d+)/i);
            if (!ctNumberMatch) {
                console.log("❌ Keine CT-Nummer im Einweisungstext gefunden.");
                return;
            }
            const ctNumber = `CT-${ctNumberMatch[1]}`;
            console.log(`✅ CT-Nummer erkannt: ${ctNumber}`);

            // 🔍 **Ausbilder anhand der CT-Nummer in der Datenbank suchen**
            db.get(
                `SELECT user_id, username FROM main_server_users WHERE "Soldaten Name" LIKE ?`,
                [`%${ctNumber}%`],
                async (err, row) => {
                    if (err) {
                        console.error("❌ Fehler beim Suchen der CT-Nummer:", err);
                        return;
                    }

                    if (!row) {
                        console.log(`❌ Kein Discord-Benutzer für CT-Nummer ${ctNumber} gefunden.`);
                        return;
                    }

                    const instructorUserId = row.user_id;
                    const instructorUsername = row.username;
                    console.log(`✅ Ausbilder gefunden: ${instructorUsername} (ID: ${instructorUserId})`);

                    // 📌 Prüfen, ob Einweisung bereits existiert
                    db.get(
                        `SELECT COUNT(*) AS count FROM instructions WHERE trainee_user_id = ? AND vrc_name = ?`,
                        [traineeUserId, vrcName],
                        (err, result) => {
                            if (err) {
                                console.error("❌ Fehler bei der Einweisungsprüfung:", err);
                                return;
                            }

                            if (result && result.count > 0) {
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
                                    }
                                }
                            );
                        }
                    );
                }
            );
        }
    }
};
