const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const marked = require('marked');
const DOMPurify = require('isomorphic-dompurify');

const router = express.Router();
const wikiPath = path.join(process.cwd(), 'web/media/wiki/');

// 📌 Einzelnen Wiki-Artikel anzeigen
router.get('/wiki/:category/:entry', (req, res) => {
    const { category, entry } = req.params;
    const categoryPath = path.join(wikiPath, category);
    const entryFile = path.join(categoryPath, `${entry}.md`);

    fs.readFile(entryFile, 'utf8', (err, content) => {
        if (err) {
            return res.status(404).send("❌ Dieser Wiki-Artikel existiert nicht.");
        }

        let metadata = {};
        let markdownContent = content;

        // 🔹 Extrahiere Metadaten, wenn das Dokument mit `---` beginnt
        const match = content.match(/^---\n([\s\S]+?)\n---\n/);
        if (match) {
            try {
                metadata = yaml.load(match[1]); // 📜 YAML-Parser für Metadaten
            } catch (err) {
                console.error("⚠️ Fehler beim Parsen der Metadaten:", err);
            }
            markdownContent = content.replace(match[0], ''); // Entferne den YAML-Header
        }

        // ✅ Markdown in HTML umwandeln & XSS-Schutz aktivieren
        let htmlContent = marked.parse(markdownContent);
        htmlContent = DOMPurify.sanitize(htmlContent);

        // 🔹 Entferne die erste <h1>-Überschrift, falls sie existiert (um doppelte Titel zu vermeiden)
        htmlContent = htmlContent.replace(/^<h1[^>]*>.*?<\/h1>/i, '');

        // 📌 **`wikiEntry` in die `render`-Funktion übergeben**
        res.render('Wiki/entry', { 
            title: metadata.title || entry.replace(/-/g, ' '), 
            content: htmlContent, 
            metadata,
            wikiEntry: { category, entry } // 👈 Hier wird `wikiEntry` definiert
        });
    });
});

module.exports = router;
