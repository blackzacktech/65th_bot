const db = require('../utils/db');

console.log("🔄 Starte die Aktualisierung der Instructor-IDs...");

db.all(
    `SELECT id, ct_number FROM instructions`,
    [],
    async (err, rows) => {
        if (err) {
            console.error("❌ Fehler beim Abrufen der Einweisungen:", err);
            return;
        }

        for (const row of rows) {
            const { id, ct_number } = row;

            // 🔍 **Finde die zugehörige Discord-ID anhand der CT-Nummer**
            db.get(
                `SELECT user_id FROM main_server_users WHERE "Soldaten Name" LIKE ?`,
                [`%${ct_number}%`],
                (err, user) => {
                    if (err) {
                        console.error(`❌ Fehler beim Suchen der Discord-ID für ${ct_number}:`, err);
                        return;
                    }

                    if (!user) {
                        console.log(`⚠️ Keine Discord-ID für ${ct_number} gefunden. Überspringe...`);
                        return;
                    }

                    // 🔄 **Aktualisiere die Instructor-ID in der Datenbank**
                    db.run(
                        `UPDATE instructions SET instructor_user_id = ? WHERE id = ?`,
                        [user.user_id, id],
                        (err) => {
                            if (err) {
                                console.error(`❌ Fehler beim Aktualisieren der Instructor-ID für ${ct_number}:`, err);
                            } else {
                                console.log(`✅ Instructor-ID für ${ct_number} -> ${user.user_id} aktualisiert.`);
                            }
                        }
                    );
                }
            );
        }
    }
);
