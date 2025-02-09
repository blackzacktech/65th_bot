const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const loadRoutes = (directory) => {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);

        if (fs.statSync(fullPath).isDirectory()) {
            loadRoutes(fullPath); // Unterordner rekursiv laden
        } else if (file.endsWith('.js') && file !== 'index.js') {
            try {
                const route = require(fullPath);
                if (route && typeof route === 'function') {
                    router.use('/', route);  // Router korrekt einbinden
                    // console.log(`✅ Route geladen: ${fullPath}`);
                } else {
                    console.warn(`⚠️ Datei '${fullPath}' exportiert keinen gültigen Router.`);
                }
            } catch (error) {
                console.error(`❌ Fehler beim Laden der Datei '${fullPath}':`, error);
            }
        }
    });
};

loadRoutes(__dirname); // Alle Routen laden

module.exports = router;
