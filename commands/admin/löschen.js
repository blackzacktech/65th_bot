module.exports = {
    name: 'löschen',
    description: 'Löscht Nachrichten aus dem aktuellen Channel. Optional: Nur von einem bestimmten Benutzer.',
    permission: "public",
    async execute(message, args) {
        // ✅ Prüfen, ob der Benutzer in AUTHORIZED_USERS ist
        const AUTHORIZED_USERS = process.env.AUTHORIZED_USERS ? process.env.AUTHORIZED_USERS.split(',') : [];
        if (!AUTHORIZED_USERS.includes(message.author.id)) {
            return message.reply('❌ Du hast keine Berechtigung, diesen Befehl zu nutzen.').then(botMsg => {
                setTimeout(() => {
                    botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                    message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht1:", err));
                }, 5000);
            });
        }

        // ✅ Prüfen, ob ein Nutzer erwähnt wurde
        let targetUser = message.mentions.users.first();
        let deleteCount = targetUser ? parseInt(args[1]) : parseInt(args[0]); // Zahl ist an anderer Position, wenn User erwähnt wird

        // ✅ Validierung der Eingabe
        if (!deleteCount || isNaN(deleteCount) || deleteCount < 1 || deleteCount > 100) {
            return message.reply('⚠️ Bitte gib eine Zahl zwischen **1 und 100** ein! Beispiel: `!löschen 20` oder `!löschen @Benutzer 10`').then(botMsg => {
                setTimeout(() => {
                    botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                    message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht2:", err));
                }, 5000);
            });
        }

        try {
            const fetchedMessages = await message.channel.messages.fetch({ limit: 100 }); // Maximal 100 Nachrichten abrufen

            let messagesToDelete;
            if (targetUser) {
                // ✅ Falls ein spezifischer Benutzer angegeben wurde, filtere nur seine Nachrichten
                messagesToDelete = fetchedMessages.filter(msg => msg.author.id === targetUser.id).first(deleteCount);

                if (messagesToDelete.length === 0) {
                    return message.reply(`⚠️ Keine Nachrichten von **${targetUser.tag}** gefunden!`).then(botMsg => {
                        setTimeout(() => {
                            botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                            message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht3:", err));
                        }, 5000);
                    });
                }
            } else {
                // ✅ Falls kein User angegeben wurde, lösche einfach die letzten X Nachrichten
                messagesToDelete = fetchedMessages.first(deleteCount);
            }

            // ✅ Nachrichten löschen & Nachricht verzögert senden
            await message.channel.bulkDelete(messagesToDelete, true);

            setTimeout(() => {
                message.channel.send(`✅ **${messagesToDelete.length} Nachrichten** wurden gelöscht!`).then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                    }, 5000);
                });
            }, 1000);

        } catch (error) {
            console.error('❌ Fehler beim Löschen der Nachrichten:', error);
            return message.reply('⚠️ Fehler beim Löschen der Nachrichten. Möglicherweise sind sie älter als **14 Tage**.').then(botMsg => {
                setTimeout(() => {
                    botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                    message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht5:", err));
                }, 5000);
            });
        }
    }
};
