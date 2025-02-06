const db = require('../utils/db');
const moment = require('moment');
require('dotenv').config();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        // 📌 Channel-ID für Einweisungsnachrichten (Anpassen!)
        const INSTRUCTION_CHANNEL_ID = '1336697115610452049';

        if (message.content.includes('**__ Einweisung__**')) {
            console.log("📌 Einweisung erkannt, versuche zu speichern...");

            const regex = /\*\*name der\s+Eingewiesenen person:\*\*\s*<@(\d+)>\s*\n\*\*VRC Name der\s+- Eingewiesenen person:\*\*\s*(.+?)\s*\n\*\*Rang\+CT Nummer des Ausbilders:\*\*\s*(.+?)\s*\n\*\*Ping:\*\*\s*<@&\d+>/s;
            const match = message.content.match(regex);

            if (!match) {
                console.log("❌ Keine Übereinstimmung mit dem Regex!");
                return;
            }

            const traineeUserId = match[1].trim();
            const vrcName = match[2].trim();
            const instructorInfo = match[3].trim();
            const timestamp = moment(message.createdTimestamp).format('YYYY-MM-DD HH:mm:ss'); // ✅ Discord-Zeitstempel nehmen

            // 🔍 **CT-Nummer auslesen (egal ob "CT-3663", "ct - 3663", etc.)**
            const ctNumberMatch = instructorInfo.match(/ct\s*-?\s*(\d+)/i);
            if (!ctNumberMatch) {
                console.log("❌ Keine CT-Nummer im Einweisungstext gefunden.");
                return;
            }

            const ctNumber = `CT-${ctNumberMatch[1]}`; // Einheitliches Format: CT-3663
            console.log(`🔍 CT-Nummer erkannt: ${ctNumber}`);

            // 🔍 **Discord-ID des Ausbilders anhand der CT-Nummer aus der Datenbank suchen**
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

                    // 📌 Prüfen, ob Einweisung schon existiert (trainee_user_id darf nur einmal vorkommen)
                    db.get(
                        `SELECT COUNT(*) AS count FROM instructions WHERE trainee_user_id = ?`,
                        [traineeUserId],
                        (err, result) => {
                            if (err) {
                                console.error("❌ Fehler bei der Dublettenprüfung:", err);
                                return;
                            }

                            if (result.count > 0) {
                                console.log(`❌ Einweisung für ${vrcName} (ID: ${traineeUserId}) existiert bereits.`);
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
