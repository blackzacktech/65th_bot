const db = require('../../utils/db');

module.exports = {
    name: 'stats',
    description: 'Zeigt die Benutzer-Statistik an.',
    permission: "public",
    async execute(message, args) {
        const userId = args[0] ? args[0].replace(/[<@!>]/g, '') : message.author.id;

        db.get(`SELECT * FROM main_server_users WHERE user_id = ?`, [userId], (err, row) => {
            if (err) {
                console.error('❌ Fehler beim Abrufen der Statistik:', err);
                return message.reply('❌ Fehler beim Abrufen der Statistik.').then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            }

            if (!row) {
                return message.reply('ℹ️ Keine Statistik für diesen Benutzer gefunden.').then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            }

            message.reply(`📊 **Statistik für <@${userId}>**:
- 📝 **Nachrichten gesendet:** ${row.messages_sent}
- 🎤 **Voice-Chat-Zeit:** ${row.voice_minutes} Minuten
- ⭐ **Aktivitätspunkte:** ${row.activity_points}`);
        });
    }
};
