const db = require('../utils/db');

module.exports = {
    name: 'partner',
    description: 'Fügt einen Benutzer zur Partner-Liste hinzu.',
    permission: "public",
    async execute(message, args) {
        // 🔹 **Fehlermeldung, wenn keine User-ID eingegeben wurde**
        if (!args.length) {
            return message.reply('❌ Bitte gib eine gültige User-ID an.').then(botMsg => {
                setTimeout(() => {
                    botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                    message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                }, 5000);
            });
        }

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

        const userIdToAdd = args[0];

        try {
            // 🔹 **Benutzer-Objekt abrufen**
            const userToAdd = await message.client.users.fetch(userIdToAdd);
            if (!userToAdd) {
                return message.reply('❌ Benutzer wurde nicht gefunden.').then(botMsg => {
                    setTimeout(() => {
                        botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                        message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                    }, 5000);
                });
            }

            const username = userToAdd.username;
            const addedById = message.author.id;
            const addedByUsername = message.author.username;
            const addedAt = new Date().toISOString();

            // 🔹 **Prüfen, ob der Benutzer bereits ein Partner ist**
            db.get(`SELECT * FROM partners WHERE user_id = ?`, [userIdToAdd], (err, row) => {
                if (err) {
                    console.error('❌ Fehler beim Überprüfen des Partners:', err);
                    return message.reply('❌ Fehler beim Überprüfen der Partnerliste.').then(botMsg => {
                        setTimeout(() => {
                            botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                            message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                        }, 5000);
                    });
                }

                if (row) {
                    return message.reply(`⚠️ **${username}** ist bereits als Partner registriert.`).then(botMsg => {
                        setTimeout(() => {
                            botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                            message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                        }, 5000);
                    });
                }

                // 🔹 **Partner in der Datenbank speichern**
                db.run(
                    `INSERT INTO partners (user_id, username, added_by, added_by_username, added_at) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [userIdToAdd, username, addedById, addedByUsername, addedAt],
                    (err) => {
                        if (err) {
                            console.error('❌ Fehler beim Speichern des Partners:', err);
                            return message.reply('❌ Fehler beim Hinzufügen des Partners.').then(botMsg => {
                                setTimeout(() => {
                                    botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                                    message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                                }, 5000);
                            });
                        }

                        message.reply(`✅ **${username}** wurde erfolgreich als Partner hinzugefügt!\n👤 **Hinzugefügt von:** ${addedByUsername}`).then(botMsg => {
                            setTimeout(() => {
                                botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                                message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                            }, 5000);
                        });
                    }
                );
            });

        } catch (error) {
            console.error('❌ Fehler beim Abrufen des Benutzers:', error);
            return message.reply('❌ Ungültige User-ID oder der Benutzer existiert nicht.').then(botMsg => {
                setTimeout(() => {
                    botMsg.delete().catch(err => console.error("❌ Fehler beim Löschen der Bot-Antwort:", err));
                    message.delete().catch(err => console.error("❌ Fehler beim Löschen der User-Nachricht:", err));
                }, 5000);
            });
        }
    }
};
