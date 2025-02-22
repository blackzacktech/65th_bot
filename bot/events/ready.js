const path = require('path');
const db = require(path.join(__dirname, '../../utils/db'));
const fetchVRChatData = require(path.join(__dirname, '../../utils/fetchVRChat'));

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Bot gestartet als: ${client.user.tag}`);

        fetchVRChatData();

        const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
        try {
            const mainServer = await client.guilds.fetch(MAIN_SERVER_ID);
            const members = await mainServer.members.list({ limit: 1000 }); // **Begrenzt die Anzahl**

            members.forEach(member => {
                const userId = member.user.id;
                const username = member.user.username;
                const serverNickname = member.nickname || username;
                const roles = member.roles.cache.map(role => role.name).join(',');

                db.run(
                    `INSERT INTO main_server_users (user_id, username, messages_sent, voice_minutes, activity_points)
                     VALUES (?, ?, 0, 0, 0)
                     ON CONFLICT(user_id) DO UPDATE
                     SET username = excluded.username`,
                    [userId, username],
                    function (err) {
                        if (err) {
                            console.error('❌ Fehler beim Aktualisieren der Benutzerstatistiken:', err);
                        }
                    }
                );
            });

            console.log(`✅ ${members.size} Mitglieder geladen.`);
        } catch (error) {
            console.error('❌ Fehler beim Abrufen der Mitglieder:', error);
        }

        // Alle Server abrufen und speichern
        client.guilds.cache.forEach(async (guild) => {
            try {
                const owner = await guild.fetchOwner();
                
                db.run(`
                    INSERT INTO bot_servers (id, name, member_count, owner_id) 
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET 
                        name = excluded.name, 
                        member_count = excluded.member_count, 
                        owner_id = excluded.owner_id
                `, [guild.id, guild.name, guild.memberCount, owner.id], (err) => {
                    if (err) {
                        console.error(`❌ Fehler beim Speichern des Servers ${guild.name}:`, err);
                    } else {
                        //console.log(`✅ Server gespeichert: ${guild.name} (${guild.id})`);
                    }
                });
            
            } catch (error) {
                console.error(`❌ Fehler beim Abrufen der Besitzer-ID für ${guild.name}:`, error);
            }
        });

        // **Soldatennamen alle 10 Minuten aktualisieren**
        setInterval(() => {
            updateSoldatenNames();
        }, 600000); // 600000ms = 10 Minuten

        // Soldatennamen beim Start des Bots aktualisieren
        updateSoldatenNames();
    }
};

async function updateSoldatenNames() {
    const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
    try {
        const mainServer = await global.client.guilds.fetch(MAIN_SERVER_ID);
        const members = await mainServer.members.list({ limit: 1000 });

        members.forEach(member => {
            const userId = member.user.id;
            const username = member.user.username;
            const serverNickname = member.nickname || username;

            // Hier den Soldaten Namen abrufen, falls vorhanden
            const soldatenName = serverNickname; // Beispiel: Hier kannst du den Soldatennamen anpassen

            db.run(
                `INSERT INTO main_server_users (user_id, username, "Soldaten Name", messages_sent, voice_minutes, activity_points)
                 VALUES (?, ?, ?, 0, 0, 0)
                 ON CONFLICT(user_id) DO UPDATE
                 SET username = excluded.username, "Soldaten Name" = excluded."Soldaten Name"`,
                [userId, username, soldatenName],
                function (err) {
                    if (err) {
                        console.error(`❌ Fehler beim Aktualisieren der Soldaten Namen für Benutzer ${userId}:`, err);
                    }
                }
            );
        });
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Mitglieder:', error);
    }
}
