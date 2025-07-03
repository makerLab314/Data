// script.js

// !!! WICHTIG: Ersetze diese URL mit deiner eigenen Web App URL aus dem Google Apps Script !!!
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyxPpLr2mQy4r0BtjBEo-pTTdwPyvzducPiJdShRjrf97b-1u76jDrqAe1mE816nugLqw/exec';

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
            scrollDepth: Math.round(maxScroll * 100),

            // Erweiterte Fingerprinting-Daten
            canvasFingerprint: getCanvasFingerprint(),
            webglFingerprint: getWebglFingerprint(),
            audioFingerprint: await getAudioFingerprint(),
            fonts: getAvailableFonts(),
            plugins: getBrowserPlugins(),
            batteryStatus: await getBatteryStatus(),
            mediaDevices: await getMediaDevices(),
            speechSynthesisVoices: getSpeechSynthesisVoices(),
            gamepads: getGamepadInfo(),
            screenOrientation: getScreenOrientation(),
            doNotTrack: getDoNotTrack(),
            timezoneOffset: getTimezoneOffset(),
            languages: getLanguages(),
            architecture: getArchitecture(), // Attempt to get CPU architecture
            // localStorageEnabled: checkLocalStorage(), // Already effectively checked by FingerprintJS
            // sessionStorageEnabled: checkSessionStorage(), // Already effectively checked by FingerprintJS
            indexedDBEnabled: checkIndexedDB(),
            openDatabaseEnabled: checkOpenDatabase(), // For WebSQL
            cpuClass: navigator.cpuClass || 'N/A', // Older IE, might not be useful
            buildID: navigator.buildID || 'N/A', // Firefox specific
            productSub: navigator.productSub || 'N/A', // Browser rendering engine build number
            vendor: navigator.vendor || 'N/A', // Browser vendor
            vendorSub: navigator.vendorSub || 'N/A', // Browser vendor-specific details
            oscpu: navigator.oscpu || 'N/A', // OS and CPU info
            webdriver: navigator.webdriver || false, // Indicates if browser is controlled by automation
            maxTouchPoints: navigator.maxTouchPoints || 0,
            keyboardLayout: await getKeyboardLayout(),
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            colorGamut: getColorGamut(),
            forcedColors: window.matchMedia('(forced-colors: active)').matches,
            hdr: checkHDR(),
            installedThemes: getInstalledThemes(), // Very speculative, likely not possible reliably
            availableSensors: await getAvailableSensors(),
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => console.log('Antwort vom Server:', result))
    .catch(error => console.error('Fehler beim Senden der Daten:', error));
}

// --- Erweiterte Fingerprinting-Funktionen ---

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const txt = 'BrowserLeaks,com <canvas> 1.0';
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText(txt, 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText(txt, 4, 17);
        return canvas.toDataURL();
    } catch (e) {
        return 'N/A';
    }
}

function getWebglFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'N/A';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        let fingerprint = `Vendor: ${vendor}, Renderer: ${renderer}`;

        // Weitere WebGL-Parameter sammeln
        fingerprint += `, Version: ${gl.getParameter(gl.VERSION)}`;
        fingerprint += `, ShadingLanguageVersion: ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`;
        // AliasedLineWidthRange, AliasedPointSizeRange, MaxTextureSize, etc.
        // Diese können je nach Bedarf hinzugefügt werden, um die Eindeutigkeit zu erhöhen.
        return fingerprint;
    } catch (e) {
        return 'N/A';
    }
}

async function getAudioFingerprint() {
    try {
        const audioCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, audioCtx.currentTime);

        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
        compressor.knee.setValueAtTime(40, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

        oscillator.connect(compressor);
        compressor.connect(audioCtx.destination);
        oscillator.start(0);

        const buffer = await audioCtx.startRendering();
        const pcmData = buffer.getChannelData(0);
        let fingerprint = 0;
        for (let i = 0; i < pcmData.length; i++) {
            fingerprint += Math.abs(pcmData[i]);
        }
        return fingerprint.toString();
    } catch (e) {
        return 'N/A';
    }
}

function getAvailableFonts() {
    try {
        const defaultFonts = ['monospace', 'sans-serif', 'serif'];
        const fontList = [];
        const testString = "mmmmmmmmmmlli";
        const testSize = '72px';
        const h = document.getElementsByTagName("body")[0];
        const s = document.createElement("span");
        s.style.fontSize = testSize;
        s.innerHTML = testString;

        const defaultWidth = {};
        const defaultHeight = {};

        for (const font of defaultFonts) {
            s.style.fontFamily = font;
            h.appendChild(s);
            defaultWidth[font] = s.offsetWidth;
            defaultHeight[font] = s.offsetHeight;
            h.removeChild(s);
        }

        const commonFonts = [ /* Lange Liste von Schriftarten, z.B. von https://www.cssfontstack.com/ */
            'Arial', 'Arial Black', 'Bahnschrift', 'Calibri', 'Cambria', 'Candara', 'Century Gothic',
            'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Ebrima', 'Franklin Gothic Medium',
            'Gabriola', 'Gadugi', 'Georgia', 'Impact', 'Ink Free', 'Javanese Text', 'Leelawadee UI',
            'Lucida Console', 'Lucida Sans Unicode', 'Malgun Gothic', 'Marlett', 'Microsoft Himalaya',
            'Microsoft JhengHei', 'Microsoft New Tai Lue', 'Microsoft PhagsPa', 'Microsoft Sans Serif',
            'Microsoft Tai Le', 'Microsoft YaHei', 'Microsoft Yi Baiti', 'MingLiU-ExtB', 'Mongolian Baiti',
            'MS Gothic', 'MV Boli', 'Myanmar Text', 'Nirmala UI', 'Palatino Linotype', 'Segoe MDL2 Assets',
            'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Historic', 'Segoe UI Emoji',
            'Segoe UI Symbol', 'SimSun', 'Sitka', 'Sylfaen', 'Symbol', 'Tahoma', 'Times New Roman',
            'Trebuchet MS', 'Verdana', 'Webdings', 'Wingdings', 'Yu Gothic'
            // Fügen Sie hier weitere gängige Schriftarten hinzu
        ];

        for (const font of commonFonts) {
            let detected = false;
            for (const defaultFont of defaultFonts) {
                s.style.fontFamily = font + ',' + defaultFont; // Fallback
                h.appendChild(s);
                const matched = (s.offsetWidth !== defaultWidth[defaultFont] || s.offsetHeight !== defaultHeight[defaultFont]);
                h.removeChild(s);
                if (matched) {
                    detected = true;
                    break;
                }
            }
            if (detected) {
                fontList.push(font);
            }
        }
        return fontList.join(', ') || 'N/A';
    } catch (e) {
        return 'N/A';
    }
}

function getBrowserPlugins() {
    try {
        if (!navigator.plugins) return 'N/A';
        const plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            plugins.push(navigator.plugins[i].name);
        }
        return plugins.join(', ') || 'No plugins detected';
    } catch (e) {
        return 'N/A';
    }
}

async function getBatteryStatus() {
    try {
        if (!navigator.getBattery) return 'N/A (API not supported)';
        const battery = await navigator.getBattery();
        return `Level: ${battery.level * 100}%, Charging: ${battery.charging}`;
    } catch (e) {
        return 'N/A';
    }
}

async function getMediaDevices() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return 'N/A (API not supported)';
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const deviceList = devices.map(device => `${device.kind}: ${device.label || 'no label'} (ID: ${device.deviceId.substring(0,10)}...)`);
        return deviceList.join('; ') || 'No media devices found';
    } catch (e) {
        return 'N/A';
    }
}

function getSpeechSynthesisVoices() {
    try {
        if (!window.speechSynthesis || !window.speechSynthesis.getVoices) {
            return 'N/A (API not supported)';
        }
        // getVoices() ist oft asynchron beim ersten Aufruf
        return new Promise((resolve) => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length) {
                resolve(voices.map(voice => `${voice.name} (${voice.lang})`).join(', ') || 'No voices');
            } else {
                window.speechSynthesis.onvoiceschanged = () => {
                    const updatedVoices = window.speechSynthesis.getVoices();
                    resolve(updatedVoices.map(voice => `${voice.name} (${voice.lang})`).join(', ') || 'No voices');
                };
            }
        });
    } catch (e) {
        return 'N/A';
    }
}


function getGamepadInfo() {
    try {
        if (!navigator.getGamepads) return 'N/A (API not supported)';
        const gamepads = navigator.getGamepads();
        const activeGamepads = [];
        for (const gp of gamepads) {
            if (gp) {
                activeGamepads.push(`${gp.id} (${gp.buttons.length} buttons, ${gp.axes.length} axes)`);
            }
        }
        return activeGamepads.join('; ') || 'No gamepads connected';
    } catch (e) {
        return 'N/A';
    }
}

function getScreenOrientation() {
    try {
        return screen.orientation?.type || 'N/A';
    } catch (e) {
        return 'N/A';
    }
}

function getDoNotTrack() {
    try {
        const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
        if (dnt === '1' || dnt === 'yes') return 'Yes';
        if (dnt === '0' || dnt === 'no') return 'No';
        return 'Unspecified';
    } catch (e) {
        return 'N/A';
    }
}

function getTimezoneOffset() {
    try {
        return new Date().getTimezoneOffset();
    } catch (e) {
        return 'N/A';
    }
}

function getLanguages() {
    try {
        return navigator.languages ? navigator.languages.join(', ') : (navigator.language || 'N/A');
    } catch (e) {
        return 'N/A';
    }
}

function getArchitecture() {
    try {
        // Dies ist ein Hack und nicht zuverlässig oder standardisiert.
        // Versucht, Informationen aus dem User Agent String zu extrahieren.
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('x86_64') || ua.includes('x64')) return 'x86_64';
        if (ua.includes('i686') || ua.includes('x86')) return 'x86';
        if (ua.includes('armv7') || ua.includes('arm;')) return 'ARM'; // ARMv7 or generic ARM
        if (ua.includes('aarch64')) return 'ARM64';
        if (ua.includes('mips')) return 'MIPS';
        if (ua.includes('ppc')) return 'PowerPC';
        if (ua.includes('sparc')) return 'SPARC';
        return 'N/A';
    } catch (e) {
        return 'N/A';
    }
}

function checkIndexedDB() {
    try {
        return !!window.indexedDB ? 'Enabled' : 'Disabled';
    } catch (e) {
        return 'N/A';
    }
}

function checkOpenDatabase() { // WebSQL
    try {
        return !!window.openDatabase ? 'Enabled' : 'Disabled';
    } catch (e) {
        return 'N/A';
    }
}

async function getKeyboardLayout() {
    try {
        if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
            const keyboardLayoutMap = await navigator.keyboard.getLayoutMap();
            // Dies gibt eine Map zurück. Wir können versuchen, einige bekannte Tasten zu prüfen.
            // Z.B. die Taste neben '1' (kann '2' sein oder ein Sonderzeichen auf anderen Layouts)
            // Oder die Position von 'Q', 'W', 'Z', 'Y' etc.
            // Eine vollständige Layout-Erkennung ist komplex. Hier ein einfacher Indikator:
            let layoutSample = '';
            if (keyboardLayoutMap.get('KeyQ')) layoutSample += `Q:${keyboardLayoutMap.get('KeyQ')};`;
            if (keyboardLayoutMap.get('KeyW')) layoutSample += `W:${keyboardLayoutMap.get('KeyW')};`;
            if (keyboardLayoutMap.get('BracketLeft')) layoutSample += `[:${keyboardLayoutMap.get('BracketLeft')};`;
             return layoutSample || 'Map available, specific layout N/A';
        }
        return 'N/A (API not supported or no layout map)';
    } catch (e) {
        return 'N/A';
    }
}

function getColorGamut() {
    try {
        if (window.matchMedia('(color-gamut: srgb)').matches) return 'sRGB';
        if (window.matchMedia('(color-gamut: p3)').matches) return 'P3';
        if (window.matchMedia('(color-gamut: rec2020)').matches) return 'Rec2020';
        return 'Unknown';
    } catch (e) {
        return 'N/A';
    }
}

function checkHDR() {
    try {
        // Es gibt keine direkte JS API, um HDR-Fähigkeit des Monitors zu prüfen.
        // `colorGamut` kann ein indirekter Hinweis sein.
        // Einige experimentelle APIs könnten existieren oder vorgeschlagen werden, aber nichts Standardisiertes.
        return 'N/A (No direct API)';
    } catch (e) {
        return 'N/A';
    }
}


function getInstalledThemes() {
    // Es gibt keine standardisierte Möglichkeit, installierte Browser-Themes per JavaScript zu erkennen.
    // Dies ist aus Datenschutz- und Sicherheitsgründen stark eingeschränkt.
    // Man könnte versuchen, auf Änderungen in berechneten CSS-Werten von Browser-UI-Elementen zu schließen,
    // aber das ist extrem unzuverlässig und browser-spezifisch.
    return 'N/A (Not detectable via standard APIs)';
}

async function getAvailableSensors() {
    let sensorInfo = [];
    try {
        // Generic Sensor API permission check (example with Accelerometer)
        if ('permissions' in navigator) {
            const accPermission = await navigator.permissions.query({ name: 'accelerometer' });
            if (accPermission.state === 'granted' || accPermission.state === 'prompt') {
                 if (typeof Accelerometer === 'function') sensorInfo.push('Accelerometer');
            }
            const gyrPermission = await navigator.permissions.query({ name: 'gyroscope' });
            if (gyrPermission.state === 'granted' || gyrPermission.state === 'prompt') {
                 if (typeof Gyroscope === 'function') sensorInfo.push('Gyroscope');
            }
            const magPermission = await navigator.permissions.query({ name: 'magnetometer' });
             if (magPermission.state === 'granted' || magPermission.state === 'prompt') {
                 if (typeof Magnetometer === 'function') sensorInfo.push('Magnetometer');
            }
            const ambLightPermission = await navigator.permissions.query({ name: 'ambient-light-sensor' });
            if (ambLightPermission.state === 'granted' || ambLightPermission.state === 'prompt') {
                 if (typeof AmbientLightSensor === 'function') sensorInfo.push('AmbientLightSensor');
            }
        }

        // DeviceOrientationEvent (ältere API, aber breiter unterstützt für Bewegung)
        if (window.DeviceMotionEvent || window.DeviceOrientationEvent) {
            if (!sensorInfo.includes('DeviceMotion/Orientation')) {
                 sensorInfo.push('DeviceMotion/Orientation (event-based)');
            }
        }


        return sensorInfo.length > 0 ? sensorInfo.join(', ') : 'No specific sensors detected or permission denied';
    } catch (e) {
        return `N/A (Error: ${e.message})`;
    }
}
