const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const bodyParser = require('body-parser');

const app = express();
const port = process.env.WEB_PORT || 3055;

app.use(cors());
app.use(express.json());

//!---------------------------------------------------------------------------------------------------

//? 📌 Session & Login mit Discord einrichten
app.use(session({
    secret: process.env.SESSION_SECRET || 'supergeheim',
    resave: false,
    saveUninitialized: false
}));

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_REDIRECT_URI,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(passport.initialize());
app.use(passport.session());

// 🔐 Middleware, um zu prüfen, ob der Benutzer ein Wiki-Editor ist
function isWikiEditor(user) {
    if (!user) return false;
    const allowedUsers = process.env.WIKI_EDITOR_USER ? process.env.WIKI_EDITOR_USER.split(',').map(u => u.trim()) : [];
    return allowedUsers.includes(user.id);
}

// Middleware: Benutzer für alle Templates verfügbar machen
app.use((req, res, next) => {
    if (req.user) {
        req.user.avatarURL = req.user.avatar
            ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(req.user.discriminator, 10) % 5}.png`;
    }

    res.locals.user = req.user || null;
    res.locals.isWikiEditor = isWikiEditor(req.user);
    res.locals.wikiEntry = null; // Standard: `null`, es sei denn, eine Wiki-Seite setzt sie
    next();
});

//!---------------------------------------------------------------------------------------------------

//? 📌 EJS als Template-Engine nutzen
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//!---------------------------------------------------------------------------------------------------

// Lade Routen automatisch
app.use('/', require('./routes/index'));

app.use('/tinymce', express.static(path.join(process.cwd(), 'node_modules', 'tinymce')));


//!------------------------------------------------------------------------------------------------------------

//? 📌 Server starten
app.listen(port, () => {
    console.log(`🚀 Webserver läuft auf http://localhost:${port} / https://65thofvr.chat`);
});
