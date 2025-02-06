module.exports = {
    // ✅ Rollengruppen mit Berechtigungen
    freigabe1: ["1336470770754256988"],  // z. B. Moderatoren
    freigabe2: ["1336470809023352884"],  // z. B. Admins
    freigabe3: ["1336470833329213540"],  // z. B. Leader
    freigabe4: ["1336470865176432703"], // z. B. spezielle Rollen

    // ✅ Funktion zum Überprüfen der Berechtigung
    hasPermission(member, permissionLevel) {
        if (!this[permissionLevel]) return false; // Falls Freigabe nicht existiert

        const userRoles = member.roles.cache.map(role => role.id); // IDs holen!
        return userRoles.some(role => this[permissionLevel].includes(role));
    }
};