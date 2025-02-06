const db = require('../utils/db');

const userVoiceActivity = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    execute(oldState, newState) {
        const userId = newState.id;
        const username = newState.member?.user.username;

        if (!oldState.channelId && newState.channelId) {
            // ✅ Benutzer ist in einen Voice-Channel eingetreten
            userVoiceActivity.set(userId, Date.now());
            console.log(`${username} ist einem Voice-Channel beigetreten.`);
        } else if (oldState.channelId && !newState.channelId) {
            // ✅ Benutzer hat den Voice-Channel verlassen
            const joinTime = userVoiceActivity.get(userId);
            console.log(`${username} hat den Voice-Channel verlassen.`);
            if (joinTime) {
                const duration = Math.floor((Date.now() - joinTime) / 60000); // Minuten berechnen
                userVoiceActivity.delete(userId);

                // ✅ Voice-Minuten & Punkte in der Datenbank speichern
                db.run(
                    `INSERT INTO main_server_users (user_id, username, voice_minutes, activity_points)
                     VALUES (?, ?, ?, ?)
                     ON CONFLICT(user_id) DO UPDATE
                     SET voice_minutes = main_server_users.voice_minutes + ?,  
                         activity_points = main_server_users.activity_points + ?`,
                    [userId, username, duration, duration * 2, duration, duration * 2]
                );
            }
        }
    }
};
