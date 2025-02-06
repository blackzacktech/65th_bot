module.exports = {
    name: 'ping',
    description: 'Antwortet mit Pong!',
    permission: "public",
    execute(message) {
        message.reply('🏓 Pong!').then(botMsg => {
            setTimeout(() => {
                botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
            }, 5000);
        });
    }
};
