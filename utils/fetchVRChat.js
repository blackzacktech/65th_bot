const fetch = require('node-fetch');
const db = require('./db');

const WORLD_ID = 'wrld_23784c95-eb2a-4067-a355-31958bb85141';
const API_URL = `https://api.vrchat.cloud/api/1/worlds/${WORLD_ID}`;

async function fetchVRChatData() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0',
                'Accept': 'application/json',
                'Referer': 'https://vrchat.com/',
                'Origin': 'https://vrchat.com/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site'
            }
        });

        if (!response.ok) throw new Error(`❌ Fehler beim Abrufen der VRChat-Daten: ${response.statusText}`);

        const data = await response.json();

        // Falls `instances` leer ist, setzen wir es auf 0
        const instanceCount = Array.isArray(data.instances) ? data.instances.length : 0;

        // Tags & URLs als Strings speichern
        const tagsString = data.tags ? data.tags.join(', ') : '';
        const urlListString = data.urlList ? data.urlList.join(', ') : '';

         // ✅ Abrufen der signierten Bild-URL
         let finalImageUrl = data.imageUrl;
         if (finalImageUrl.startsWith("https://api.vrchat.cloud/api/1/file/")) {
             // 🔹 Fordere die vollständige URL mit Signatur an
             const imageResponse = await fetch(finalImageUrl, { method: 'HEAD' });
             if (imageResponse.ok) {
                 finalImageUrl = imageResponse.url; // 🔹 Die endgültige URL mit Key-Pair-ID & Signature
             } else {
                 // console.warn("⚠️ Fehler beim Abrufen der signierten Bild-URL, verwende Standard-URL.");
             }
         }

        // **Daten in die Datenbank speichern**
        db.run(`
            INSERT INTO Venator (
                world_id, name, authorId, authorName, description, capacity, favorites, featured, heat, imageUrl, 
                thumbnailImageUrl, occupants, instances, privateOccupants, publicOccupants, popularity, 
                recommendedCapacity, releaseStatus, publicationDate, updated_at, tags, urlList, visits, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(world_id) DO UPDATE SET
                name = excluded.name,
                authorId = excluded.authorId,
                authorName = excluded.authorName,
                description = excluded.description,
                capacity = excluded.capacity,
                favorites = excluded.favorites,
                featured = excluded.featured,
                heat = excluded.heat,
                imageUrl = excluded.imageUrl,
                thumbnailImageUrl = excluded.thumbnailImageUrl,
                occupants = excluded.occupants,
                instances = excluded.instances,
                privateOccupants = excluded.privateOccupants,
                publicOccupants = excluded.publicOccupants,
                popularity = excluded.popularity,
                recommendedCapacity = excluded.recommendedCapacity,
                releaseStatus = excluded.releaseStatus,
                publicationDate = excluded.publicationDate,
                updated_at = excluded.updated_at,
                tags = excluded.tags,
                urlList = excluded.urlList,
                visits = excluded.visits,
                version = excluded.version
        `, [
            data.id, data.name, data.authorId, data.authorName, data.description, data.capacity, data.favorites, 
            data.featured, data.heat, data.imageUrl, data.thumbnailImageUrl, data.occupants, instanceCount, 
            data.privateOccupants, data.publicOccupants, data.popularity, data.recommendedCapacity, 
            data.releaseStatus, data.publicationDate, data.updated_at, tagsString, urlListString, data.visits, data.version
        ]);

        // console.log('✅ VRChat-Daten erfolgreich aktualisiert.');

    } catch (err) {
        console.error('❌ Fehler beim Abrufen der VRChat-Daten:', err);
    }
}

module.exports = fetchVRChatData;
