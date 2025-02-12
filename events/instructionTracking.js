const db = require('../utils/db');
const moment = require('moment');
require('dotenv').config();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
        const INSTRUCTION_CHANNEL_ID = process.env.INSTRUCTION_CHANNEL_ID;

        if (message.guild.id !== MAIN_SERVER_ID || message.channel.id !== INSTRUCTION_CHANNEL_ID) return;

        if (message.content.includes('**__ Einweisung__**')) {
            console.log("📌 Neue Einweisung erkannt...");

            const regex = /\*\*name der\s+Eingewiesenen person:\*\*\s*<@(\d+)>\s*\n\*\*VRC Name der\s+- Eingewiesenen person:\*\*\s*(.+?)\s*\n\*\*Rang\+CT Nummer des Ausbilders:\*\*\s*(.+?)\s*\n\*\*Ping:\*\*\s*<@&\d+>/s;
            const match = message.content.match(regex);

            if (!match) {
                console.log("❌ Keine Übereinstimmung mit dem Regex!");
                return;
            }

            const traineeUserId = match[1].trim();
            const vrcName = match[2].trim();
            let instructorInfo = match[3].trim();
            const timestamp = moment(message.createdTimestamp).format('YYYY-MM-DD HH:mm:ss');

            let instructorUserId = null;

            // 🔍 **Prüfe, ob eine Discord-ID angegeben wurde**
            const discordIdMatch = instructorInfo.match(/<@(\d+)>/);
            if (discordIdMatch) {
                instructorUserId = discordIdMatch[1].trim();
                console.log(`✅ Ausbilder anhand der Discord-ID gefunden: ${instructorUserId}`);
            } else {
                // 🔍 **Falls nur eine CT-Nummer angegeben wurde, suche die passende Discord-ID**
                const ctNumberMatch = instructorInfo.match(/\bCT\s*-?\s*(\d+)\b/i);
                if (!ctNumberMatch) {
                    console.log("❌ Weder eine Discord-ID noch eine CT-Nummer wurde erkannt.");
                    return;
                }

                const ctNumber = `CT-${ctNumberMatch[1]}`;
                console.log(`🔍 Erkannte CT-Nummer: ${ctNumber}`);

                // **Finde die zugehörige Discord-ID aus der Datenbank**
                const instructorData = await new Promise((resolve, reject) => {
                    db.get(
                        `SELECT user_id FROM main_server_users WHERE "Soldaten Name" LIKE ?`,
                        [`%${ctNumber}%`],
                        (err, row) => {
                            if (err) reject(err);
                            resolve(row);
                        }
                    );
                });

                if (!instructorData) {
                    console.log(`⚠️ Keine Discord-ID für ${ctNumber} gefunden.`);
                    return;
                }

                instructorUserId = instructorData.user_id;
                console.log(`✅ CT-Nummer erfolgreich zugeordnet: ${ctNumber} -> ${instructorUserId}`);
            }

            // 🛑 **Dublettenprüfung: Prüfen, ob die Einweisung bereits existiert**
            const existingInstruction = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT COUNT(*) AS count FROM instructions WHERE trainee_user_id = ? AND vrc_name = ?`,
                    [traineeUserId, vrcName],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (existingInstruction.count > 0) {
                console.log(`❌ Einweisung für ${vrcName} existiert bereits.`);
                return;
            }

            // 🔄 **Speichern der Einweisung in der Datenbank**
            db.run(
                `INSERT INTO instructions (trainee_user_id, trainee_username, vrc_name, instructor_user_id, timestamp) 
                VALUES (?, ?, ?, ?, ?)`,
                [traineeUserId, vrcName, vrcName, instructorUserId, timestamp],
                (err) => {
                    if (err) {
                        console.error('❌ Fehler beim Speichern der Einweisung:', err);
                    } else {
                        console.log(`✅ Einweisung gespeichert: ${vrcName} von ${instructorUserId}`);
                    }
                }
            );
        }
    }
};
