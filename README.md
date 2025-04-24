
# 🌿 Plant Identifier Webapp

Eine moderne Webanwendung zur Pflanzenidentifikation mithilfe von Künstlicher Intelligenz. Nutzer können ein Pflanzenbild hochladen oder direkt mit der Kamera aufnehmen. Die App analysiert das Bild mit der **Google Gemini API** und liefert detaillierte Informationen zur Pflanze.

🔗 **Live-Demo:** [plant-identifier-webapp.vercel.app](https://plant-identifier-webapp.vercel.app)

---

## 🚀 Features

- 📷 **Bildaufnahme & Upload:** Unterstützt sowohl Kameraaufnahmen als auch das Hochladen von Bildern.
- 🤖 **KI-gestützte Pflanzenidentifikation:** Verwendet die Google Gemini API zur Analyse und Erkennung von Pflanzen.
- 📋 **Detaillierte Pflanzeninformationen:** Zeigt den deutschen und wissenschaftlichen Namen, Pflegehinweise (z. B. Wasserbedarf, Lichtverhältnisse), Herkunft, Wachstumsrate und weitere relevante Details an.
- 🗺️ **Kartenintegration:** Verwendet Leaflet zur Anzeige von Pflanzenstandorten oder Herkunftsregionen.
- 🎨 **Animiertes UI:** Setzt Anime.js für flüssige und ansprechende Animationen ein.

---

## 🛠️ Technologie-Stack

- **Frontend:** Next.js 15 (React Framework)
- **Styling:** Tailwind CSS
- **Karten:** Leaflet
- **Animationen:** Anime.js
- **Bildaufnahme:** `navigator.mediaDevices.getUserMedia()` API
- **KI-Service:** Google Gemini API

---

## ⚙️ Installation & Entwicklung

### Voraussetzungen

- Node.js (v16 oder höher)
- npm oder yarn
- Google Gemini API-Schlüssel

### Schritte

1. Repository klonen:

   ```bash
   git clone https://github.com/parwely/Plant-Identifier-Webapp.git
   cd Plant-Identifier-Webapp
   ```

2. Abhängigkeiten installieren:

   ```bash
   npm install
   # oder
   yarn install
   ```

3. Umgebungsvariablen konfigurieren:

   Erstelle eine `.env.local`-Datei im Projektverzeichnis mit folgendem Inhalt:

   ```env
   GEMINI_API_KEY=dein-google-api-schlüssel
   ```

4. Entwicklungsserver starten:

   ```bash
   npm run dev
   # oder
   yarn dev
   ```

   Die Anwendung ist nun unter `http://localhost:3000` erreichbar.

---

## 📁 Projektstruktur

```
├── app/                  # Hauptkomponenten und Seiten
├── public/               # Statische Assets
├── .config/              # Konfigurationsdateien
├── tailwind.config.ts    # Tailwind CSS-Konfiguration
├── next.config.js        # Next.js-Konfiguration
├── package.json          # Projektmetadaten und Abhängigkeiten
├── .env.local            # Umgebungsvariablen (nicht im Repository enthalten)
```

---

## 📷 Beispielausgabe

Nach dem Hochladen eines Pflanzenbildes zeigt die Anwendung beispielsweise:

- **Deutscher Name:** Gummibaum
- **Wissenschaftlicher Name:** *Ficus elastica*
- **Pflegehinweise:** Mäßig gießen, indirektes Licht, durchlässiger Boden
- **Herkunft:** Südostasien
- **Wachstumsrate:** Mittel
- **Besonderheiten:** Luftreinigende Eigenschaften, milchiger Pflanzensaft

---

## 🧠 KI-Integration

Die Anwendung nutzt die **Google Gemini API**, um hochgeladene Bilder zu analysieren und relevante Pflanzeninformationen zu extrahieren. Weitere Informationen zur API findest du in der [Google Gemini API-Dokumentation](https://ai.google.dev).
