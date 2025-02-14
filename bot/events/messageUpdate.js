const path = require('path');
const db = require(path.join(__dirname, '../../utils/db'));

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) {
        if (!oldMessage || !newMessage) return;
        if (!oldMessage.author || !newMessage.author) return;
        if (oldMessage.author.bot || newMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return;

        console.log(`✏ Nachricht bearbeitet: ${newMessage.content}`);

        // ✅ **Gespeicherte Broadcast-Nachrichten abrufen**
        db.all(
            `SELECT partner_message_id, channel_id FROM broadcast_messages WHERE main_message_id = ?`,
            [oldMessage.id],
            async (err, rows) => {
                if (err) {
                    console.error('❌ Fehler beim Abrufen der Broadcast-Nachrichten:', err);
                    return;
                }

                for (const row of rows) {
                    const targetChannelId = row.channel_id;
                    try {
                        const targetChannel = await client.channels.fetch(targetChannelId);

                        // 🔄 **Nachricht explizit abrufen (wichtig nach Neustart!)**
                        const targetMessage = await targetChannel.messages.fetch(row.partner_message_id).catch(() => null);

                        if (targetMessage) {
                            await targetMessage.edit(newMessage.content);
                            console.log(`✅ Nachricht in ${targetChannelId} erfolgreich bearbeitet.`);
                        } else {
                            console.warn(`⚠️ Nachricht ${row.partner_message_id} in ${targetChannelId} nicht gefunden.`);
                        }
                    } catch (err) {
                        console.error(`❌ Fehler beim Bearbeiten der Nachricht in ${targetChannelId}:`, err);
                    }
                }
            }
        );
    }
};
