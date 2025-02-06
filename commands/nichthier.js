const db = require('../utils/db');

module.exports = {
    name: 'nichthier',
    description: 'Entfernt den aktuellen Server aus der Partnerliste. Nur für Partner erlaubt!',
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

            // ✅ Partner darf den Server entfernen
            db.run(`DELETE FROM partner_servers WHERE server_id = ?`, [message.guild.id], (err) => {
                if (err) {
                    console.error('❌ Fehler beim Entfernen des Servers:', err);
                    return message.reply('❌ Fehler beim Entfernen des Partner-Servers.').then(botMsg => {
                        setTimeout(() => {
                            botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                            message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                        }, 5000);
                    });
                }
                message.reply('✅ **Dieser Server wurde aus der Partner-Liste entfernt!**').then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            });
        });
    }
};
