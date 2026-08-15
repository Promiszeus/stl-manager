# 🚀 STL-Manager

**STL-Manager** ist eine leistungsstarke, lokale Webanwendung zur Organisation, Vorschau und Verwaltung deiner 3D-Druckdateien (STL & 3MF) – inklusive integrierter Online-Modellsuche über alle großen Repositories!

---

## ✨ Funktionen & Highlights

* 📁 **Automatische Ordnerüberwachung:** Überwacht beliebig viele Ordner auf deiner Festplatte live und fügt neu heruntergeladene STL- und 3MF-Dateien sofort zur Bibliothek hinzu.
* 👁️ **Integrierter 3D-Viewer & Thumbnails:** Automatische Generierung hochauflösender 3D-Vorschauen und interaktiver 3D-Inspektor direkt im Browser.
* 🏷️ **Tag-System mit Farbwähler:** Kategorisiere Modelle mit Tags (inkl. anpassbarer Farben) und filtere gezielt nach Tags oder ungetaggten Dateien.
* 🔍 **Intelligenter Duplikate-Finder:** Findet echte Inhalts-Duplikate per MD5-Content-Hash, um Speicherplatz zu sparen.
* 🔪 **Multi-Slicer-Integration:** Öffne 3D-Dateien mit einem Klick direkt in deinem bevorzugten Slicer (*PrusaSlicer, Bambu Studio, OrcaSlicer, Cura etc.*).
* 🌐 **Multi-Plattform Online-Suche:** Durchsuche **MakerWorld**, **Printables**, **Cults 3D**, **Thingiverse**, **MakerOnline** und **Creality Cloud** gleichzeitig mit Schnellfiltern und nahtlosem Nachladen (*"Weitere Modelle laden"*).
* 🧩 **Chrome Extension:** Erkennt automatisch die Original-Webseite heruntergeladener Modelle und verknüpft sie mit der Bibliothek.
* ⚙️ **Flexible Port-Konfiguration:** Frei wählbarer Server-Port über `port.txt`.
* 🔄 **1-Klick Auto-Updater:** Automatisches Stoppen, Aktualisieren und Neustarten per `update.bat`.

---

## 🚀 Schnellstart

### 1. Normaler Start (mit Konsole)
Doppelklicke einfach auf die Datei **`run_portable.bat`**.
* Startet den Server portabel über das mitgelieferte Python.
* Öffnet automatisch die Weboberfläche im Browser unter `http://localhost:8000`.

---

### 2. Windows-Autostart (Lautlos im Hintergrund)
Möchtest du, dass der STL-Manager bei jedem Hochfahren von Windows automatisch und **völlig unsichtbar im Hintergrund** läuft?

1. Drücke auf deiner Tastatur die Tastenkombination **`Windows-Taste + R`**.
2. Gib **`shell:startup`** ein und drücke **Enter** (dies öffnet deinen persönlichen Windows-Autostart-Ordner).
3. Gehe in deinen `STL-Manager`-Ordner, mache einen **Rechtsklick auf die Datei `start-manger-hidden.vbs`** und wähle **"Verknüpfung erstellen"**.
4. Ziehe diese neu erstellte Verknüpfung in den geöffneten Autostart-Ordner.
5. **Fertig!** Ab sofort startet der STL-Manager bei jedem Windows-Start lautlos im Hintergrund.

---

## ⚙️ Port anpassen (`port.txt`)

Standardmäßig lauscht der Server auf Port `8000`. Wenn du einen anderen Port verwenden möchtest (z. B. `8080` oder `9000`):

1. Öffne die Datei **`port.txt`** im Hauptverzeichnis mit einem Texteditor.
2. Trage deinen Wunsch-Port ein (z. B. `8080`) und speichere die Datei.
3. Starte den Server neu – `run_portable.bat`, `stop_server.bat` und der Autostart verwenden automatisch den neuen Port!

---

## ⏹️ Server stoppen (`stop_server.bat`)

Doppelklicke auf **`stop_server.bat`**:
* Beendet alle aktiven STL-Manager- und Uvicorn-Prozesse.
* Schließt die Ports dynamisch und sprachunabhängig.

---

## 🔄 Updates (`update.bat`)

Um deinen STL-Manager auf den neuesten Stand zu bringen:

1. Doppelklicke auf **`update.bat`**.
2. Das Skript:
   - Stoppt den laufenden Server automatisch.
   - Lädt die neueste Version von GitHub herunter.
   - Aktualisiert fehlende Abhängigkeiten.
   - **Startet den Server automatisch neu!**
3. Deine gespeicherten Einstellungen, überwachten Ordner, Datenbank (`models.json`) und Tags bleiben dabei zu 100% erhalten.

---

## 🧩 Chrome Extension (STL-Manager Tracker)

Mit der Browser-Erweiterung wird bei jedem Download von MakerWorld, Printables, Thingiverse & Co. automatisch die passende Modellseite gespeichert:

1. Öffne Google Chrome (oder Brave / Edge).
2. Öffne `chrome://extensions` in der Adressleiste.
3. Aktiviere oben rechts den **Entwicklermodus** (*Developer mode*).
4. Klicke oben links auf **"Entpackte Erweiterung laden"** (*Load unpacked*).
5. Wähle den Ordner `chrome-extension` aus deinem STL-Manager-Verzeichnis aus.
