const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();
const moment = require('moment');

const app = express();
const port = process.env.WEB_PORT || 3055;

app.use(cors());
app.use(express.json());

//!---------------------------------------------------------------------------------------------------

//? 📌 Verbindung zur Datenbank
const db = new sqlite3.Database('./utils/database/database.sqlite', (err) => {
    if (err) {
        console.error('❌ Fehler beim Öffnen der Datenbank', err);
    } else {
        console.log('✅ Datenbank erfolgreich geöffnet');
    }
});

//!---------------------------------------------------------------------------------------------------

//? 📌 EJS als Template-Engine nutzen
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));

//!---------------------------------------------------------------------------------------------------

//? 📌 Webseite mit Statistiken anzeigen
//? 🔗 /
app.get('/', (req, res) => {
    // 🟢 1. Server-Statistiken abrufen
    db.get(`
        SELECT 
            COUNT(*) AS totalMembers, 
            SUM(messages_sent) AS totalMessages, 
            SUM(voice_minutes) AS totalVoiceMinutes 
        FROM main_server_users
    `, [], (err, serverStats) => {
        if (err) {
            console.error('❌ Fehler beim Abrufen der Server-Statistiken:', err);
            return res.status(500).send("Fehler beim Laden der Statistik.");
        }

        // 🟢 2. Leaderboard abrufen
        db.all(`
            SELECT username, messages_sent, voice_minutes, 
                   (messages_sent + voice_minutes + activity_points) AS total_score
            FROM main_server_users 
            ORDER BY total_score DESC 
            LIMIT 10
        `, [], (err, leaderboard) => {
            if (err) {
                console.error('❌ Fehler beim Abrufen des Leaderboards:', err);
                return res.status(500).send("Fehler beim Laden des Leaderboards.");
            }

            res.render('index', { title: "Home", serverStats, leaderboard });
        });
    });
});

//? 📌 Venator Base-Daten anzeigen
//? 🔗 /venator
app.get('/venator', (req, res) => {
    db.get(`SELECT * FROM Venator ORDER BY updated_at DESC LIMIT 1`, [], (err, venatorData) => {
        if (err) return res.status(500).send("❌ Fehler beim Laden der Venator Base-Daten.");

        res.render('venator', { title: "Venator", venatorData });
    });
});

//? 📌 Wiki anzeigen
//? 🔗 /wiki
app.get('/wiki', (req, res) => {
    res.render('wiki', { title: "Home" });
});

//? 📌 LOA-Abmeldungen anzeigen
//? 🔗 /loa
app.get('/loa', (req, res) => {
    const today = moment().format("YYYY-MM-DD"); // Heutiges Datum im sicheren Format

    db.all(
        `SELECT username, from_date, to_date, reason 
         FROM loa 
         WHERE to_date >= DATE(?) 
         ORDER BY to_date ASC`,
        [today],
        (err, loaData) => {
            if (err) {
                return res.status(500).send("❌ Fehler beim Laden der Abmeldungen.");
            }

            // 🔄 **Datenbereinigung für Anzeige**
            const cleanLoaData = loaData
                .map(loa => {
                    let fromDate = moment(loa.from_date, ["DD.MM.YYYY", "YYYY-MM-DD"], true);
                    let toDate = moment(loa.to_date, ["DD.MM.YYYY", "YYYY-MM-DD"], true);

                    return {
                        username: loa.username || "Unbekannt",
                        from_date: fromDate.isValid() ? fromDate.format("DD.MM.YYYY") : "Unbekannt",
                        to_date: toDate.isValid() ? toDate.format("DD.MM.YYYY") : "Unbekannt",
                        reason: loa.reason && loa.reason.length > 5 ? loa.reason : "Kein Grund angegeben"
                    };
                })
                .filter(loa => loa.to_date !== "Unbekannt" && moment(loa.to_date, "DD.MM.YYYY").isSameOrAfter(moment())); // ❗ Nur aktive LOAs behalten

            res.render('loa', { 
                title: "Aktuelle Abmeldungen", 
                loaData: cleanLoaData.length > 0 ? cleanLoaData : [] // ✅ Falls leer, bleibt die Seite nicht leer
            });
        }
    );
});


//? 📌 Einweisungen anzeigen
//? 🔗 /instructions
app.get('/instructions', (req, res) => {
    db.all(
        `SELECT trainee_user_id, trainee_username, vrc_name, instructor_username, ct_number, timestamp 
         FROM instructions 
         ORDER BY timestamp DESC`,
        [],
        (err, instructions) => {
            if (err) {
                console.error("❌ Fehler beim Abrufen der Einweisungen:", err);
                return res.status(500).send("❌ Fehler beim Laden der Einweisungen.");
            }
            res.render('instructions', { title: "Einweisungen", instructions });
        }
    );
});

//? 📌 Alle Server anzeigen, in denen der Bot ist*
//? 🔗 /bot-servers
app.get('/bot-servers', (req, res) => {
    db.all(`SELECT * FROM bot_servers`, [], (err, servers) => {
        if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Server." });

        res.render('botServers', { title: "Bot-Server", servers });
    });
});

//!---------------------------------------------------------------------------------------------------User infos

//? 📌 Automatische Weiterleitung von `/discordUserId` zu `/discordUserId/info`
//? 🔗 /:discordUserId
app.get('/:discordUserId', (req, res, next) => {
    const { discordUserId } = req.params;

    // Prüfen, ob die Eingabe eine reine Zahl ist (Discord User IDs sind nur Zahlen)
    if (/^\d+$/.test(discordUserId)) {
        return res.redirect(`/${discordUserId}/info`);
    }

    // Falls es keine Zahl ist (z. B. `/main-server-users`), Route normal weiterverarbeiten
    next();
});

//? 📌 Benutzerprofil anzeigen
//? 🔗 /:discordUserId/info
app.get('/:discordUserId/info', async (req, res) => {
    const { discordUserId } = req.params;

    try {
        const guild = await global.client.guilds.fetch(process.env.MAIN_SERVER_ID);
        const member = await guild.members.fetch(discordUserId);

        if (!member) {
            return res.status(404).send("❌ Benutzer nicht gefunden.");
        }

        const username = member.user.username;
        const avatarURL = member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 256 });
        const roles = member.roles.cache.map(role => role.name).join(', ') || "Keine Rollen";
        const joinedAt = member.joinedAt ? member.joinedAt.toISOString().split('T')[0] : "Unbekannt";

        // 🏅 CT-Nummer abrufen
        db.get(
            `SELECT "Soldaten Name" FROM main_server_users WHERE user_id = ?`,
            [discordUserId],
            (err, userData) => {
                if (err) {
                    console.error("❌ Fehler beim Abrufen des Soldaten Namens:", err);
                    return res.status(500).send("❌ Fehler beim Laden der Nutzerdaten.");
                }

                let ctNumber = discordUserId; // Standard: Discord-ID, falls keine CT-Nummer gefunden wird
                if (userData && userData["Soldaten Name"]) {
                    // Versuche die CT-Nummer aus dem Soldaten Namen zu extrahieren
                    const ctMatch = userData["Soldaten Name"].match(/(CT|CC|AT)-\d+/i);
                    if (ctMatch) {
                        ctNumber = ctMatch[0]; // Setze CT-Nummer, wenn gefunden
                    }
                }

                // 📊 Aktivitätsdaten abrufen
                db.get(
                    `SELECT messages_sent, voice_minutes, activity_points FROM main_server_users WHERE user_id = ?`,
                    [discordUserId],
                    (err, activityData) => {
                        if (err) return res.status(500).send("❌ Fehler beim Laden der Nutzerdaten.");

                        // 📌 Anzahl der LOA-Anträge abrufen
                        db.get(
                            `SELECT COUNT(*) AS loa_count FROM loa WHERE user_id = ?`,
                            [discordUserId],
                            (err, loaData) => {
                                if (err) return res.status(500).send("❌ Fehler beim Laden der LOA-Daten.");

                                // 🔹 Anzahl der Einweisungen abrufen:
                                db.get(
                                    `SELECT COUNT(*) AS instruction_count FROM instructions WHERE instructor_user_id = ?`,
                                    [discordUserId],
                                    (err, instructionData) => {
                                        if (err) return res.status(500).send("❌ Fehler beim Laden der Einweisungen.");

                                        res.render('userProfile', {
                                            title: `Profil von ${ctNumber}`,
                                            username,
                                            avatarURL,
                                            roles,
                                            joinedAt,
                                            messagesSent: activityData?.messages_sent || 0,
                                            voiceMinutes: activityData?.voice_minutes || 0,
                                            activityPoints: activityData?.activity_points || 0,
                                            loaCount: loaData?.loa_count || 0,
                                            instructionCount: instructionData?.instruction_count || 0,
                                            userId: discordUserId,
                                            ctNumber // ✅ CT-Nummer wird an das Template übergeben
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error("❌ Fehler beim Abrufen des Benutzers:", error);
        res.status(404).send("❌ Benutzer nicht gefunden.");
    }
});

//? 📌 LOA-Abmeldungen eines bestimmten Benutzers abrufen
//? 🔗 /:discordUserId/loa
app.get('/:discordUserId/loa', (req, res) => {
    const { discordUserId } = req.params;

    db.get(
        `SELECT "Soldaten Name" FROM main_server_users WHERE user_id = ?`,
        [discordUserId],
        (err, userData) => {
            if (err) {
                console.error("❌ Fehler beim Abrufen des Soldaten Namens:", err);
                return res.status(500).send("❌ Fehler beim Laden der Nutzerdaten.");
            }

            let ctNumber = discordUserId;
            if (userData && userData["Soldaten Name"]) {
                const ctMatch = userData["Soldaten Name"].match(/(CT|CC|AT)-\d+/i);
                if (ctMatch) {
                    ctNumber = ctMatch[0];
                }
            }

            db.all(
                `SELECT from_date, to_date, reason 
                 FROM loa 
                 WHERE user_id = ? 
                 ORDER BY to_date DESC`,
                [discordUserId],
                (err, loaData) => {
                    if (err) return res.status(500).send("❌ Fehler beim Laden der LOA-Daten.");

                    const cleanLoaData = loaData.map(loa => {
                        let fromDate = moment(loa.from_date, ["YYYY-MM-DD", "DD.MM.YYYY"], true);
                        let toDate = moment(loa.to_date, ["YYYY-MM-DD", "DD.MM.YYYY"], true);

                        return {
                            from_date: fromDate.isValid() ? fromDate.format("DD.MM.YYYY") : "Unbekannt",
                            to_date: toDate.isValid() ? toDate.format("DD.MM.YYYY") : "Unbekannt",
                            reason: loa.reason && loa.reason.length > 5 ? loa.reason : "Kein Grund angegeben"
                        };
                    });

                    res.render('userLoa', { 
                        title: `LOA Übersicht von ${ctNumber}`,
                        loaData: cleanLoaData, 
                        ctNumber 
                    });
                }
            );
        }
    );
});

//? 📌 Einweisungen einer bestimmten Benutzers abrufen
//? 🔗 /:discordUserId/instructions
app.get('/:discordUserId/instructions', (req, res) => {
    const { discordUserId } = req.params;

    // Zuerst den Soldaten Namen abrufen
    db.get(
        `SELECT "Soldaten Name" FROM main_server_users WHERE user_id = ?`,
        [discordUserId],
        (err, userData) => {
            if (err) {
                console.error("❌ Fehler beim Abrufen des Soldaten Namens:", err);
                return res.status(500).send("❌ Fehler beim Laden der Nutzerdaten.");
            }

            let ctNumber = discordUserId; // Standard: Discord-ID, falls keine CT-Nummer gefunden wird
            if (userData && userData["Soldaten Name"]) {
                // Versuche die CT-Nummer aus dem Soldaten Namen zu extrahieren
                const ctMatch = userData["Soldaten Name"].match(/(CT|CC|AT)-\d+/i);
                if (ctMatch) {
                    ctNumber = ctMatch[0]; // Setze CT-Nummer, wenn gefunden
                }
            }

            // Dann die Einweisungs-Daten abrufen
            db.all(
                `SELECT trainee_user_id, trainee_username, vrc_name, instructor_username, ct_number, timestamp 
                 FROM instructions 
                 WHERE instructor_user_id = ? 
                 ORDER BY timestamp DESC`,
                [discordUserId],
                (err, instructions) => {
                    if (err) {
                        console.error("❌ Fehler beim Abrufen der Einweisungen:", err);
                        return res.status(500).send("❌ Fehler beim Laden der Einweisungen.");
                    }

                    res.render('userInstructions', {
                        title: `Einweisungen von ${ctNumber}`, // 🔥 Jetzt mit CT-Nummer!
                        instructions,
                        ctNumber
                    });
                }
            );
        }
    );
});

//!---------------------------------------------------------------------------------------------------📌 API-Endpunkte für externe oder interne Nutzung

//?📌 Route für alle Benutzer in einer übersichtlichen Tabelle
//? 🔗 /user
app.get('/user', (req, res) => {
    const searchTerm = req.query.search || ''; // Suchbegriff aus den Query-Parametern abrufen

    // SQL-Abfrage anpassen, um nach Soldaten Name oder Benutzername zu filtern
    db.all(`
        SELECT * FROM main_server_users 
        WHERE "Soldaten Name" LIKE ? OR username LIKE ? 
        ORDER BY "Soldaten Name" ASC
    `, [`%${searchTerm}%`, `%${searchTerm}%`], (err, users) => {
        if (err) {
            console.error("❌ Fehler beim Abrufen der Benutzer:", err);
            return res.status(500).send("Fehler beim Laden der Benutzerdaten.");
        }
        res.render('users', { title: "Benutzerübersicht", users, searchTerm }); // Suchbegriff an die Ansicht übergeben
    });
});

//? 📌 Einzelne Benutzerinformationen abrufen
//? 🔗 /main-server-users/:id
app.get('/main-server-users/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT * FROM main_server_users WHERE user_id = ?', [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        res.json(row);
    });
});

//? 📌 Partner-Server abrufen
//? 🔗 /partner-servers
app.get('/partner-servers', (req, res) => {
    db.all('SELECT * FROM partner_servers', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

//? 📌 Partner-Benutzer abrufen
//? 🔗 /partners
app.get('/partners', (req, res) => {
    db.all('SELECT * FROM partners', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

//? 📌 Punkte eines Benutzers aktualisieren
//? 🔗 /update-score
app.post('/update-score', (req, res) => {
    const { user_id, points } = req.body;
    if (!user_id || points === undefined) {
        return res.status(400).json({ error: 'Fehlende Parameter' });
    }

    db.run(
        'UPDATE main_server_users SET message_score = message_score + ? WHERE user_id = ?',
        [points, user_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Punkte aktualisiert' });
        }
    );
});

//? 📌 Venator-Bild abrufen
//? 🔗 /venator-image
app.get('/venator-image', async (req, res) => {
    try {
        const WORLD_ID = 'wrld_23784c95-eb2a-4067-a355-31958bb85141';
        const API_URL = `https://api.vrchat.cloud/api/1/worlds/${WORLD_ID}`;

        // 🟢 1. VRChat-Daten abrufen
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`❌ Fehler beim Abrufen der VRChat-Daten: ${response.statusText}`);

        const data = await response.json();
        const apiImageUrl = data.imageUrl; // API-URL zum Bild

        //console.log(`🔄 Abrufen der Weiterleitungs-URL: ${apiImageUrl}`);

        // 🟢 2. FOLGE der Weiterleitung, um die signierte URL zu erhalten
        const imageResponse = await fetch(apiImageUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': '*/*'
            },
            redirect: 'manual' // Wichtig: Wir lesen die Weiterleitung selbst!
        });

        // **Die finale URL befindet sich in `location` Header**
        const finalImageUrl = imageResponse.headers.get('location');

        if (!finalImageUrl) {
            //console.warn(`⚠️ Fehler beim Abrufen der finalen Bild-URL, verwende Standard-URL.`);
            return res.json({ imageUrl: apiImageUrl });
        }

        //console.log(`✅ Erfolgreich erhaltene Bild-URL: ${finalImageUrl}`);

        res.json({ imageUrl: finalImageUrl });

    } catch (error) {
        console.error('❌ Fehler beim Abrufen des Venator-Bildes:', error);
        res.status(500).json({ error: 'Fehler beim Laden des Bildes.' });
    }
});

//!---------------------------------------------------------------------------------------------------Invites

//? 📌 Weiterleitung zum Bot-Invite-Link ---- /invite-bot
//? 🔗 /
app.get('/invite-bot', (req, res) => {
    res.redirect('https://discord.com/oauth2/authorize?client_id=1333895828175065119');
});

//? 📌 Weiterleitung zum Haupt-Discord-Server ---- /invite-server
//? 🔗 /
app.get('/invite-server', (req, res) => {
    res.redirect('https://discord.com/invite/AeeTSBwXGP');
});

//!---------------------------------------------------------------------------------------------------Invites

//? 📌 Server starten
app.listen(port, () => {
    console.log(`🚀 Webserver läuft auf http://localhost:${port} / https://65thofvr.chat`);
});
