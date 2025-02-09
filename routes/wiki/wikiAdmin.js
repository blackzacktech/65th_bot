const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
require('dotenv').config();


const wikiPath = path.join(process.cwd(), 'media/wiki');

// 🔐 Funktion zur Überprüfung, ob der Benutzer ein Wiki-Editor ist
function isWikiEditor(userId) {
    const allowedUsers = process.env.WIKI_EDITOR_USER ? process.env.WIKI_EDITOR_USER.split(',').map(u => u.trim()) : [];
    return allowedUsers.includes(userId);
}

// 📝 📌 Neue Wiki-Seite erstellen (Formular)
router.get('/wiki/new', (req, res) => {
    if (!req.isAuthenticated() || !isWikiEditor(req.user.id)) return res.redirect('/wiki');

    res.render('Wiki/admin/newEntry', { title: "Neuen Wiki-Artikel erstellen" });
});

// 💾 Wiki-Seite speichern (NEU)
router.post('/wiki/new', (req, res) => {
    if (!req.isAuthenticated() || !isWikiEditor(req.user.id)) return res.status(403).send("❌ Zugriff verweigert.");

    const { category, title, content } = req.body;
    if (!category || !title || !content) return res.status(400).send("❌ Fehlende Daten.");

    const categoryPath = path.join(wikiPath, category);
    const entryFile = path.join(categoryPath, `${title}.md`);

    // Ordner erstellen, falls nicht vorhanden
    if (!fs.existsSync(categoryPath)) fs.mkdirSync(categoryPath, { recursive: true });

    // Datei speichern
    const fileContent = `---
title: ${title}
author: ${req.user.username}
created: ${new Date().toISOString()}
last_modified: ${new Date().toISOString()}
category: ${category}
tags: []
---
${content}`;

    fs.writeFile(entryFile, fileContent, (err) => {
        if (err) return res.status(500).send("❌ Fehler beim Speichern.");
        res.redirect(`/wiki/${category}/${title}`);
    });
});

// 📝 ✏️ Wiki-Seite bearbeiten (Editor mit Markdown)
router.get('/wiki/edit/:category/:entry', (req, res) => {
    if (!req.isAuthenticated() || !isWikiEditor(req.user.id)) return res.redirect('/wiki');

    const categoryPath = path.join(wikiPath, req.params.category);
    const entryFile = path.join(categoryPath, `${req.params.entry}.md`);

    fs.readFile(entryFile, 'utf8', (err, content) => {
        if (err) return res.status(404).send("❌ Dieser Wiki-Artikel existiert nicht.");

        res.render('Wiki/admin/editEntry', {
            title: `Bearbeite ${req.params.entry}`,
            category: req.params.category,
            entry: req.params.entry,
            content
        });
    });
});

// 💾 Änderungen speichern
router.post('/wiki/edit/:category/:entry', (req, res) => {
    if (!req.isAuthenticated() || !isWikiEditor(req.user.id)) return res.status(403).send("❌ Zugriff verweigert.");

    const { content } = req.body;
    if (!content) return res.status(400).send("❌ Kein Inhalt angegeben.");

    const categoryPath = path.join(wikiPath, req.params.category);
    const entryFile = path.join(categoryPath, `${req.params.entry}.md`);

    // Metadaten aktualisieren
    const fileContent = content.replace(/(last_modified: )(.+)/, `$1${new Date().toISOString()}`);

    fs.writeFile(entryFile, fileContent, (err) => {
        if (err) return res.status(500).send("❌ Fehler beim Speichern.");
        res.redirect(`/wiki/${req.params.category}/${req.params.entry}`);
    });
});

// 🗑️ Wiki-Seite löschen
router.post('/wiki/delete/:category/:entry', (req, res) => {
    if (!req.isAuthenticated() || !isWikiEditor(req.user.id)) return res.status(403).send("❌ Zugriff verweigert.");

    const categoryPath = path.join(wikiPath, req.params.category);
    const entryFile = path.join(categoryPath, `${req.params.entry}.md`);

    fs.unlink(entryFile, (err) => {
        if (err) return res.status(500).send("❌ Fehler beim Löschen.");
        res.redirect('/wiki');
    });
});

module.exports = router;
