const db = require('../utils/db');
const rollensystem = require('../utils/rollensystem');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        // ✅ **COMMAND HANDLER**
        if (message.content.startsWith('!')) {
            const args = message.content.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (!client.commands.has(commandName)) return;

            try {
                const command = client.commands.get(commandName);

                // 🛑 **Überprüfung der Berechtigung**
                if (command.permission && command.permission !== "public") {
                    if (!rollensystem.hasPermission(message.member, command.permission)) {
                        return message.reply("🚫 Du hast keine Berechtigung, diesen Befehl zu nutzen.").then(botMsg => {
                            setTimeout(() => {
                                botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                                message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                            }, 5000);
                        });
                    }
                }

                await command.execute(message, args);
                console.log(`✅ Command ausgeführt: ${commandName}`);
            } catch (error) {
                console.error(`❌ Fehler beim Ausführen des Commands "${commandName}":`, error);
                message.reply('❌ Ein Fehler ist aufgetreten.').then(msg => {
                    setTimeout(() => msg.delete(), 5000);
                });
            }
            return; // ❗ **Stoppt hier, damit Commands nicht als Broadcast gesendet werden**
        }

        // ✅ **Broadcast-System für den Hauptserver**
        const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
        const MAIN_CHANNEL_ID = process.env.MAIN_CHANNEL_ID;

        if (message.guild && message.guild.id === MAIN_SERVER_ID && message.channel.id === MAIN_CHANNEL_ID) {
            console.log(`📢 Nachricht wird an Partner-Server gesendet: ${message.content}`);

            db.all(`SELECT target_channel FROM partner_servers`, [], async (err, rows) => {
                if (err) {
                    console.error('❌ Fehler beim Abrufen der Partner-Server-Channels:', err);
                    return;
                }

                for (const row of rows) {
                    const targetChannelId = row.target_channel;

                    try {
                        const targetChannel = await client.channels.fetch(targetChannelId);
                        if (targetChannel && targetChannel.isTextBased()) {
                            const sentMessage = await targetChannel.send({
                                content: message.content,
                                files: message.attachments.map(attachment => attachment.url),
                            });

                            // 📌 **Speichern der IDs für spätere Updates**
                            db.run(
                                `INSERT INTO broadcast_messages (main_message_id, partner_message_id, channel_id)
                                 VALUES (?, ?, ?)`,
                                [message.id, sentMessage.id, targetChannelId]
                            );
                        }
                    } catch (err) {
                        console.error(`❌ Fehler beim Senden an Channel ${targetChannelId}:`, err);
                    }
                }
            });
        }

        // ✅ Nachrichtenzähler aktualisieren
        db.run(
            `INSERT INTO main_server_users (user_id, username, messages_sent, activity_points)
             VALUES (?, ?, 1, 5)
             ON CONFLICT(user_id) DO UPDATE
             SET messages_sent = main_server_users.messages_sent + 1,
                 activity_points = main_server_users.activity_points + 5`,
            [message.author.id, message.author.username]
        );
    }
};
