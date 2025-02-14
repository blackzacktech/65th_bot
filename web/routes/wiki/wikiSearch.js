const express = require('express');
const db = require('../../../utils/db.js');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const wikiPath = path.join(process.cwd(), 'web/media/wiki');
require('dotenv').config();

// 📌 🔍 WIKI: Suchfunktion mit Kategorien
router.get('/wiki/search', (req, res) => {
    const query = req.query.q.toLowerCase();

    let categories = {};

    // 🔍 Durchsuche alle Kategorien (Ordner)
    fs.readdir(wikiPath, { withFileTypes: true }, (err, categoryDirs) => {
        if (err) return res.status(500).send("❌ Fehler beim Durchsuchen der Wiki-Dateien.");

        categoryDirs.forEach(category => {
            if (category.isDirectory()) {
                const categoryName = category.name;
                const categoryPath = path.join(wikiPath, categoryName);

                // 🔍 Durchsuche alle `.md`-Dateien im Ordner
                const files = fs.readdirSync(categoryPath)
                    .filter(file => file.endsWith('.md'))
                    .map(file => ({
                        title: file.replace('.md', ''),
                        link: `/wiki/${categoryName}/${file.replace('.md', '')}`
                    }));

                // 📜 Nur Treffer zur Kategorie hinzufügen
                const filteredFiles = files.filter(entry => entry.title.toLowerCase().includes(query));
                if (filteredFiles.length > 0) {
                    categories[categoryName] = filteredFiles;
                }
            }
        });

        res.render('Wiki/index', { title: "Wiki Suche", categories, query });
    });
});

module.exports = router;
