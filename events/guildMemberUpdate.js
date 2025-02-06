const db = require('../utils/db');

module.exports = {
    name: 'guildMemberUpdate',
    execute(oldMember, newMember) {
        const userId = newMember.id;
        const roles = newMember.roles.cache.map(role => role.name).join(',');

        db.run(
            `UPDATE main_server_users SET roles = ? WHERE user_id = ?`,
            [roles, userId],
            (err) => {
                if (err) {
                    console.error(`❌ Fehler beim Aktualisieren der Rollen für Benutzer ${userId}:`, err);
                }
            }
        );
    }
};
