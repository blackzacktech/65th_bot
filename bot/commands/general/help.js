const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Zeigt eine Liste aller Befehle und deren Beschreibung.',
    permission: "public", // Jeder kann es nutzen

    async execute(message, args) {
        const { client } = message; // Zugriff auf alle geladenen Commands

        // 🟢 **Erstelle eine Liste aller Commands**
        let helpMessage = "";
        client.commands.forEach(command => {
            helpMessage += `🔹 **!${command.name}** - ${command.description || "Keine Beschreibung verfügbar."}\n`;
        });

        // 📜 **Embed für die Hilfemeldung**
        const helpEmbed = new EmbedBuilder()
            .setColor('#d32f2f') // Rote Star Wars Farbe
            .setTitle('📜 Befehlsliste')
            .setDescription(helpMessage)
            .setFooter({ text: "Klicke auf ❌, um diese Nachricht zu löschen." });

        // ✅ **Nachricht mit Reaktion senden**
        const botMessage = await message.reply({ embeds: [helpEmbed] });

        // ❌ **Emoji-Reaktion hinzufügen**
        await botMessage.react('❌');

        // 🎯 **Event-Listener für die Reaktion**
        const filter = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;
        const collector = botMessage.createReactionCollector({ filter, time: 60000 });

        collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name === '❌') {
                await botMessage.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Nachricht:", err));
                message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
            }
        });
    }
};
