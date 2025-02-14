const path = require('path');
const db = require(path.join(__dirname, '../../utils/db'));

module.exports = {
    name: 'messageDelete',
    async execute(deletedMessage, client) {
        if (!deletedMessage || !deletedMessage.guild) return;
        if (!deletedMessage.author || deletedMessage.author.bot) return;

        const MAIN_SERVER_ID = process.env.MAIN_SERVER_ID;
        const MAIN_CHANNEL_ID = process.env.MAIN_CHANNEL_ID;
        if (deletedMessage.guild.id !== MAIN_SERVER_ID || deletedMessage.channel.id !== MAIN_CHANNEL_ID) return;

        console.log(`🗑 Nachricht im Hauptserver gelöscht: ${deletedMessage.content}`);

        // ✅ Suche nach der Nachricht in der Datenbank
        db.all(
            `SELECT partner_message_id, channel_id FROM broadcast_messages WHERE main_message_id = ?`,
            [deletedMessage.id],
            async (err, rows) => {
                if (err) {
                    console.error('❌ Fehler beim Abrufen der Broadcast-Nachrichten:', err);
                    return;
                }

                for (const row of rows) {
                    const targetChannelId = row.channel_id;
                    try {
                        const targetChannel = await client.channels.fetch(targetChannelId);
                        const targetMessage = await targetChannel.messages.fetch(row.partner_message_id);

                        if (targetMessage) {
                            await targetMessage.delete();
                            console.log(`✅ Nachricht in ${targetChannelId} gelöscht.`);
                        }
                    } catch (err) {
                        console.error(`❌ Fehler beim Löschen der Nachricht in ${targetChannelId}:`, err);
                    }
                }

                // ✅ Entferne die Nachricht aus der Datenbank
                db.run(`DELETE FROM broadcast_messages WHERE main_message_id = ?`, [deletedMessage.id]);
            }
        );
    }
};
