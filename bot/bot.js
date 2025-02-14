const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();
const db = require(path.join(__dirname, '../utils/db'));
const fetchVRChatData = require(path.join(__dirname, '../utils/fetchVRChat'));

// Discord Client erstellen
global.client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

client.commands = new Collection();

// **Commands laden**
// Da bot.js im Ordner "bot" liegt und "commands" in diesem Ordner,
// nutzen wir __dirname, um den korrekten Pfad zu ermitteln.
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        client.commands.set(command.name, command);
        console.log(`➡️ Command geladen: ${command.name}`);
    }
}

// **Events laden**
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// **Webserver starten (nachdem der Client definiert wurde)**
require('../web/webserver');

// **VRChat-Daten alle 5 Minuten abrufen & speichern**
setInterval(() => {
    fetchVRChatData();
}, 300000); // 300000ms = 5 Minuten

client.login(process.env.TOKEN);
