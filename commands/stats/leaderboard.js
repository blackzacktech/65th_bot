const db = require('../../utils/db');

module.exports = {
    name: 'leaderboard',
    description: 'Zeigt die aktivsten Benutzer an.',
    permission: "freigabe1",
    async execute(message) {
        db.all(`SELECT username, activity_points FROM main_server_users ORDER BY activity_points DESC LIMIT 5`, [], (err, rows) => {
            if (err) {
                console.error('❌ Fehler beim Abrufen des Leaderboards:', err);
                return message.reply('❌ Fehler beim Abrufen des Leaderboards.').then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            }

            if (rows.length === 0) {
                return message.reply('ℹ️ Keine Daten für das Leaderboard verfügbar.').then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            }

            let leaderboard = '🏆 **Top 5 aktivste Benutzer:**\n';
            rows.forEach((row, index) => {
                leaderboard += `**${index + 1}.** ${row.username} - ${row.activity_points} XP\n`;
            });

            message.reply(leaderboard)
        });
    }
};
