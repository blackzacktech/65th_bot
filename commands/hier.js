const db = require('../utils/db');

module.exports = {
    name: 'hier',
    description: 'Registriert den Server als Partner-Server. Nur für Partner erlaubt!',
    permission: "public",
    async execute(message) {
        // ✅ Prüfen, ob der Benutzer ein Partner ist
        db.get(`SELECT * FROM partners WHERE user_id = ?`, [message.author.id], (err, row) => {
            if (err) {
                console.error('❌ Fehler beim Überprüfen der Partnerschaft:', err);
                return message.reply('❌ Fehler bei der Überprüfung deiner Berechtigung.').then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            }

            if (!row) {
                return message.reply('❌ Du bist kein registrierter Partner und darfst diesen Befehl nicht nutzen.').then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            }

            const guildId = message.guild.id;
            const guildName = message.guild.name;
            const userCount = message.guild.memberCount;
            const ownerId = message.guild.ownerId;

            message.guild.fetchOwner().then((owner) => {
                const ownerName = owner.user.username;
                const channelId = message.channel.id;

                db.run(
                    `INSERT OR REPLACE INTO partner_servers (server_id, server_name, user_count, target_channel, owner_id, owner_name) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [guildId, guildName, userCount, channelId, ownerId, ownerName],
                    (err) => {
                        if (err) {
                            console.error('❌ Fehler beim Speichern des Servers:', err);
                            return message.reply('❌ Fehler beim Speichern der Server-Informationen.').then(botMsg => {
                                setTimeout(() => {
                                    botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                                    message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                                }, 5000);
                            });
                        }
                        message.reply('✅ **Dieser Server wurde als Partner-Server registriert!**').then(botMsg => {
                            setTimeout(() => {
                                botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                                message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                            }, 5000);
                        });
                    }
                );
            });
        });
    }
};
