const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const wikiPath = path.join(process.cwd(), 'media/wiki');

// 📌 🗂 WIKI: Liste aller Einträge abrufen
router.get('/wiki', (req, res) => {
    fs.readdir(wikiPath, { withFileTypes: true }, (err, items) => {
        if (err) return res.status(500).send("❌ Fehler beim Laden der Wiki-Dateien.");

        let categories = {};

        items.forEach(item => {
            if (item.isDirectory()) {
                const categoryName = item.name; // Ordnername = Kategorie
                const categoryPath = path.join(wikiPath, categoryName);

                // 🟢 Alle `.md`-Dateien im Ordner abrufen
                const files = fs.readdirSync(categoryPath)
                    .filter(file => file.endsWith('.md'))
                    .map(file => ({
                        title: file.replace('.md', ''), // Entferne .md für den Titel
                        link: `/wiki/${categoryName}/${file.replace('.md', '')}` // Erstelle den Link
                    }));

                if (files.length > 0) {
                    categories[categoryName] = files;
                }
            }
        });

        res.render('Wiki/index', { title: "Wiki", categories, query: "" });
    });
});

module.exports = router;
