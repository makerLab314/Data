// script.js

// !!! WICHTIG: Ersetze diese URL mit deiner eigenen Web App URL aus dem Google Apps Script !!!
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVrYf7HX_Q5JS5gQZJ3qhSZtvcB9mXWoaAoS-lSrEnX28fZXiSk5YhhTwiv8_9SY8F/exec';

document.addEventListener('DOMContentLoaded', () => {
    // Starte die Matrix-Animation
    startMatrixAnimation();

    // Sammle und sende die Daten
    collectAndProcessData();
});

// --- Matrix Animation ---
function startMatrixAnimation() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}';
    const fontSize = 16;
    const columns = canvas.width / fontSize;

    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }

    function draw() {
        ctx.fillStyle = 'rgba(11, 12, 16, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ffcc'; // Neon Farbe
        ctx.font = fontSize + 'px arial';

        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(draw, 33);
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
}


// --- Datensammlung ---
async function collectAndProcessData() {
    const startTime = Date.now();
    let maxScroll = 0;

    // Scroll-Tiefe aufzeichnen
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
        }
    });

    try {
        // 1. FingerprintJS
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;

        // 2. IP & Geolocation API (ipapi.co ist oft umfangreicher im Free Tier)
        const geoResponse = await fetch('https://ipapi.co/json/');
        const geoData = await geoResponse.json();

        // 3. Alle Daten in einem Objekt sammeln
        const collectedData = {
            timestamp: new Date().toISOString(),
            visitorId: visitorId,
            ip: geoData.ip,
            city: geoData.city,
            region: geoData.region,
            country: geoData.country_name,
            loc: geoData.latitude + "," + geoData.longitude,
            org: geoData.org,
            postal: geoData.postal,
            timezone: geoData.timezone,
            // Security-Daten von der API (falls verfügbar)
            isVpn: geoData.security?.vpn ?? 'N/A',
            isProxy: geoData.security?.proxy ?? 'N/A',
            isTor: geoData.security?.tor ?? 'N/A',
            // Browser-Daten
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            // Bildschirm-Daten
            screenWidth: screen.width,
            screenHeight: screen.height,
            colorDepth: screen.colorDepth,
            devicePixelRatio: window.devicePixelRatio,
            // Browser-Fähigkeiten
            cookiesEnabled: navigator.cookieEnabled,
            isTouchDevice: 'ontouchstart' in window,
            prefersDarkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
            // Hardware-Daten
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory || 'N/A', // Nicht alle Browser unterstützen das
            // Netzwerk-Daten
            connectionType: navigator.connection?.type ?? 'N/A',
            connectionEffectiveType: navigator.connection?.effectiveType ?? 'N/A',
            // Verhaltensdaten (Momentaufnahme)
            timeOnPage: (Date.now() - startTime) / 1000,
            scrollDepth: Math.round(maxScroll * 100)
        };

        // Daten auf der Seite anzeigen
        displayData(collectedData);

        // Daten an Google Sheet senden
        sendDataToSheet(collectedData);

    } catch (error) {
        console.error("Fehler beim Sammeln der Daten:", error);
        document.querySelector('.footer-note').textContent = "Error establishing data stream.";
    }
}

// Funktion zum Anzeigen der Daten im Dashboard
function displayData(data) {
    for (const key in data) {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = data[key];
        }
    }
}

// Funktion zum Senden der Daten
// NEUE und VERBESSERTE sendDataToSheet Funktion in script.js

// DIAGNOSE-VERSION der sendDataToSheet Funktion in script.js

// FINALE, KORREKTE sendDataToSheet Funktion in script.js

function sendDataToSheet(data) {
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        // KEIN 'no-cors' mehr! Wir wollen die Antwort jetzt lesen können.
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json()) // Wir wandeln die Antwort des Servers in ein JSON-Objekt um.
    .then(result => {
        // Jetzt können wir die Antwort vom Server in der Konsole sehen!
        console.log('Antwort vom Server:', result);
    })
    .catch(error => {
        // Echte Fehler werden hier abgefangen.
        console.error('Fehler beim Senden der Daten:', error);
    });
}
