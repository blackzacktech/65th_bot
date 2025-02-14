// start.js
const { spawn } = require('child_process');

function startBot() {
  console.log('Starte den Discord-Bot...');

  // Starte den Bot als Kindprozess
  const botProcess = spawn('node', ['./bot/bot.js'], { stdio: 'inherit' });

  // Wenn der Prozess beendet wird, prüfe den Exit-Code und starte neu
  botProcess.on('exit', (code, signal) => {
    if (signal) {
      console.log(`Bot wurde durch Signal ${signal} beendet.`);
    } else if (code !== 0) {
      console.log(`Bot ist mit Fehlercode ${code} abgestürzt. Starte neu...`);
      // Kurze Pause vor dem Neustart (z.B. 1 Sekunde)
      setTimeout(startBot, 1000);
    } else {
      console.log('Bot wurde normal beendet.');
    }
  });

  // Optional: Fehler abfangen
  botProcess.on('error', (err) => {
    console.error('Fehler beim Starten des Bots:', err);
    // Neustart versuchen, falls das Starten fehlschlägt
    setTimeout(startBot, 1000);
  });
}

// Bot starten und überwachen
startBot();
