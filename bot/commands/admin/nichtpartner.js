const path = require('path');
const db = require(path.join(__dirname, '../../../utils/db'));

module.exports = {
    name: 'nichtpartner',
    description: 'Entfernt einen Benutzer aus der Partnerliste.',
    permission: "public",
    execute(message, args) {
        // ✅ Prüfen, ob der Benutzer in AUTHORIZED_USERS ist
        const AUTHORIZED_USERS = process.env.AUTHORIZED_USERS ? process.env.AUTHORIZED_USERS.split(',') : [];
        if (!AUTHORIZED_USERS.includes(message.author.id)) {
            return message.reply('❌ Du hast keine Berechtigung, diesen Befehl zu nutzen.').then(botMsg => {
                setTimeout(() => {
                    botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                    message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                }, 5000);
            });
        }

        if (!args.length) return message.reply('❌ Bitte gib eine User-ID an.').then(botMsg => {
            setTimeout(() => {
                botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
            }, 5000);
        });
        
        const userIdToRemove = args[0];

        db.run(
            `DELETE FROM partners WHERE user_id = ?`,
            [userIdToRemove],
            (err) => {
                if (err) {
                    console.error('❌ Fehler beim Entfernen des Partners:', err);
                    return message.reply('❌ Fehler beim Entfernen des Partners.').then(botMsg => {
                        setTimeout(() => {
                            botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                            message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                        }, 5000);
                    });
                }
                message.reply(`✅ Benutzer mit der ID ${userIdToRemove} wurde aus der Partner-Liste entfernt.`).then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            }
        );
    }
};
