# 🚗 Deutsche Fahrschul-App - Native iOS Version

Eine vollständige deutsche Fahrschul-App mit komplettem Ausbildungsbaum, erstellt mit Capacitor für native iOS-Performance.

## ✨ Features

### 📋 Vollständiger Ausbildungsbaum
- **Grundstufe** - Einweisung und Bedienung
- **Aufbaustufe** - Umweltschonendes, vorausschauendes Fahren
- **Leistungsstufe** - Schwierige Verkehrssituationen
- **Grundfahraufgaben** - Rückwärtsfahren, Einparken, etc.
- **Überlandfahrten** - Landstraßenfahren
- **Autobahn** - Autobahnfahren  
- **Dämmerung/Dunkelheit** - Beleuchtungseinrichtungen
- **Reife- und Teststufe** - Prüfungsvorbereitung
- **Situative Bausteine** - Mit vollständiger verschachtelter Struktur
- **Fahrerassistenzsysteme** - Separate blaue Kategorie
- **Beim Fahrer** - Sitzeinstellung, etc.
- **Heizung und Lüftung**
- **Betriebs- und Verkehrssicherheit**
- **Witterung** - Fahren bei verschiedenen Bedingungen

### 🔄 Intelligente Fortschrittsverfolgung
- **Gewichtete Berechnung:** 
  - `/` (einmal) = 25%
  - `×` (zweimal) = 60% 
  - `⊗` (dreimal) = 100%
- Dynamische Übungsfahrten (hinzufügen/entfernen mit + und × Buttons)
- Deutsche Datumsformate (DD.MM.YYYY)
- Echtzeit-Fortschrittsbalken für jede Kategorie

### 📱 Native iOS Features
- **Offline-Funktionalität** - Funktioniert ohne Internet
- **Native Speicherung** - Verwendet Capacitor Preferences für sichere Datenspeicherung
- **iOS-optimierte UI** - Safe Area Support, Touch-optimierte Buttons
- **Installierbar** - Kann als echte iOS-App installiert werden

## 🏗️ Technische Details

### Tech Stack
- **Frontend:** HTML5, JavaScript, Tailwind CSS
- **Native Bridge:** Capacitor
- **Speicherung:** Capacitor Preferences (iOS Keychain)
- **Build System:** Node.js, npm/yarn

### Projektstruktur
```
/app/
├── www/                    # Web Assets
│   ├── index.html         # Haupt-App-Datei
│   ├── capacitor.js       # Capacitor Web Bundle
│   └── manifest.json      # PWA Manifest
├── ios/                   # Native iOS Projekt
│   └── App/
│       └── App/
│           ├── public/    # Kopierte Web Assets
│           └── ...        # Xcode Projekt-Dateien
├── capacitor.config.json  # Capacitor Konfiguration
└── package.json          # Node.js Dependencies
```

## 🚀 Installation & Build

### Voraussetzungen
```bash
# Node.js (v16+)
node --version

# Capacitor CLI
npm install -g @capacitor/cli
```

### Development
```bash
# Dependencies installieren
npm install

# Web Assets synchronisieren
npm run capacitor:sync

# iOS Projekt öffnen (erfordert macOS + Xcode)
npm run ios:open
```

### Für iOS Build (.ipa erstellen)
```bash
# 1. Xcode öffnen
npm run ios:open

# 2. In Xcode:
# - Team/Developer Account konfigurieren
# - Product > Archive
# - Distribute App > Development/Ad Hoc
# - .ipa Datei wird erstellt
```

## 📦 Distribution

### Option 1: Development Installation
1. `.ipa` Datei erstellen (siehe oben)
2. Mit iTunes/Xcode auf Gerät installieren
3. In iOS Einstellungen: Allgemein > Geräteverwaltung > App vertrauen

### Option 2: TestFlight (App Store Connect)
1. Apple Developer Account erforderlich
2. App bei App Store Connect registrieren
3. Archive zu TestFlight hochladen
4. Beta-Tester einladen

### Option 3: Enterprise Distribution
1. Apple Enterprise Developer Account
2. In-House Distribution Profile
3. Direct Installation über Website

## 🎯 Demo-Daten

Die App kommt mit 3 Demo-Fahrschülern:
- **Anna Schmidt** - Fortgeschrittene Schülerin
- **Daniel Daft** - Theorieprüfung bestanden
- **Test Schüler** - Anfänger

## 🔧 Konfiguration

### App-Einstellungen (capacitor.config.json)
```json
{
  "appId": "com.fahrschule.app",
  "appName": "Deutsche Fahrschul-App",
  "webDir": "www",
  "ios": {
    "contentInset": "automatic",
    "allowsLinkPreview": false,
    "presentationStyle": "fullscreen"
  }
}
```

### iOS-spezifische Features
- Keychain-verschlüsselte Datenspeicherung
- Safe Area Support für alle iPhone-Modelle
- Touch-optimierte UI-Elemente (min. 44px)
- Automatische Content-Anpassung

## 🐛 Troubleshooting

### Häufige Probleme
1. **"CocoaPods not installed"**
   ```bash
   sudo gem install cocoapods
   pod setup
   ```

2. **"xcodebuild not found"**
   - Xcode aus App Store installieren
   - Command Line Tools: `xcode-select --install`

3. **App startet nicht**
   - iOS Simulator zurücksetzen
   - Clean Build: Product > Clean Build Folder

### Logs & Debugging
```bash
# Capacitor Logs
npx cap doctor

# iOS Simulator Logs
xcrun simctl spawn booted log stream --predicate 'subsystem contains "com.fahrschule.app"'
```

## 📄 Lizenz

MIT License - Siehe LICENSE Datei für Details.

## 🤝 Support

Bei Fragen oder Problemen:
1. GitHub Issues erstellen
2. Logs aus Xcode/iOS Simulator beifügen
3. iOS-Version und Gerät angeben

---

**🚗 Viel Erfolg bei der Fahrausbildung! 🚗**
