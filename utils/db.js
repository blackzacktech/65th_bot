const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./utils/database/database.sqlite', (err) => {
    if (err) {
        console.error('❌ Fehler beim Öffnen der Datenbank:', err);
    } else {
        //console.log('✅ Datenbank erfolgreich geöffnet.');

        // Tabelle für VRChat-Weltdaten
        db.run(`
            CREATE TABLE IF NOT EXISTS Venator (
                world_id TEXT PRIMARY KEY,
                name TEXT,
                authorId TEXT,
                authorName TEXT,
                description TEXT,
                capacity INTEGER,
                favorites INTEGER,
                featured BOOLEAN,
                heat INTEGER,
                imageUrl TEXT,
                thumbnailImageUrl TEXT,
                occupants INTEGER,
                instances INTEGER,
                privateOccupants INTEGER,
                publicOccupants INTEGER,
                popularity INTEGER,
                recommendedCapacity INTEGER,
                releaseStatus TEXT,
                publicationDate TEXT,
                updated_at TEXT,
                tags TEXT,
                urlList TEXT,
                visits INTEGER,
                version INTEGER
            )`, (err) => {
            if (err) console.error('❌ Fehler beim Erstellen der Venator-Tabelle:', err);
        });

        // Tabelle für Benutzer auf dem Hauptserver
        db.run(`
            CREATE TABLE IF NOT EXISTS main_server_users (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                "Soldaten Name" TEXT,
                message_score INTEGER DEFAULT 0,
                messages_sent INTEGER DEFAULT 0,
                voice_minutes INTEGER DEFAULT 0,
                activity_points INTEGER DEFAULT 0,
                roles TEXT
            )`, (err) => {
            if (err) console.error('❌ Fehler beim Erstellen der main_server_users-Tabelle:', err);
        });

        // Tabelle für Partner-Server
        db.run(`
            CREATE TABLE IF NOT EXISTS partner_servers (
                server_id TEXT PRIMARY KEY,
                server_name TEXT,
                user_count INTEGER,
                target_channel TEXT,
                owner_id TEXT,
                owner_name TEXT
            )`, (err) => {
            if (err) console.error('❌ Fehler beim Erstellen der partner_servers-Tabelle:', err);
        });

        // Tabelle für Partner-Benutzer
        db.run(`
            CREATE TABLE IF NOT EXISTS partners (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                added_by TEXT,
                added_by_username TEXT,
                added_at TEXT
            )`, (err) => {
            if (err) console.error('❌ Fehler beim Erstellen der partners-Tabelle:', err);
        });

        // Tabelle für gespeicherte Nachrichten (inkl. Medien)
        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                username TEXT,
                content TEXT,
                timestamp TEXT,
                media_path TEXT
            )`, (err) => {
            if (err) console.error('❌ Fehler beim Erstellen der messages-Tabelle:', err);
        });

        // 📌 Tabelle für Abmeldungen erstellen
        db.run(`
            CREATE TABLE IF NOT EXISTS loa (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                from_date TEXT NOT NULL,
                to_date TEXT NOT NULL,
                reason TEXT NOT NULL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 📌 Tabelle für Einweisungen erstellen (falls sie nicht existiert)
        db.run(`
            CREATE TABLE IF NOT EXISTS instructions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trainee_user_id TEXT NOT NULL,
                trainee_username TEXT NOT NULL,
                vrc_name TEXT NOT NULL,
                instructor_user_id TEXT NOT NULL,
                instructor_username TEXT NOT NULL,
                ct_number TEXT NOT NULL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('❌ Fehler beim Erstellen der instructions-Tabelle:', err);
        });


        // 📌 Tabelle für gespeicherte Server erstellen
        db.run(`
            CREATE TABLE IF NOT EXISTS bot_servers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                member_count INTEGER NOT NULL,
                owner_id TEXT NOT NULL
            )
        `);

        // Tabelle für gesendete Nachrichten auf Partner-Servern
        db.run(`
            CREATE TABLE IF NOT EXISTS broadcast_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                main_message_id TEXT NOT NULL,  -- ID der Nachricht auf dem Hauptserver
                partner_message_id TEXT NOT NULL,  -- ID der Nachricht auf dem Partner-Server
                channel_id TEXT NOT NULL  -- ID des Partner-Server-Channels
            )
        `, (err) => {
            if (err) console.error('❌ Fehler beim Erstellen der broadcast_messages-Tabelle:', err);
        });
        
        db.run(`
            CREATE TABLE IF NOT EXISTS user_stories (
                user_id TEXT PRIMARY KEY,
                story TEXT
            )
        `);
    }
});

module.exports = db;
