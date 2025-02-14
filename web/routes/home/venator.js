const express = require('express');
const db = require('../../../utils/db.js');
const router = express.Router();

//? 📌 Venator Base-Daten anzeigen
//? 🔗 /venator
router.get('/venator', (req, res) => {
    db.get(`SELECT * FROM Venator ORDER BY updated_at DESC LIMIT 1`, [], (err, venatorData) => {
        if (err) return res.status(500).send("❌ Fehler beim Laden der Venator Base-Daten.");

        res.render('Bot/venator', { title: "Venator", venatorData });
    });
});

//? 📌 Venator-Bild abrufen
//? 🔗 /venator-image
router.get('/venator-image', async (req, res) => {
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

module.exports = router;
