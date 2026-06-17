# Mitwirken an W-W

Vielen Dank, dass du dich für die Weiterentwicklung von **W-W** interessierst! Dieses Projekt lebt von der Community, und wir freuen uns über jede Hilfe – ob Bug-Reports, neue Features oder Verbesserungen an der Dokumentation.

## 🛠️ Entwicklungsumgebung einrichten

Das Projekt ist primär ein browserbasiertes RPG, nutzt aber eine Java-Komponente für das Backend.

1.  **Repository forken:** Erstelle eine Kopie des Projekts in deinem eigenen GitHub-Account.
2.  **Lokal klonen:**
    ```bash
    git clone https://github.com/dein-username/W-W.git
    ```
3.  **Frontend:** Öffne die `index.html` direkt im Browser (oder nutze die "Live Server"-Erweiterung in VS Code).
4.  **Backend:** Importiere das Projekt in eine Java-IDE (IntelliJ IDEA, Eclipse), um am Server-Teil zu arbeiten.

## 📜 Richtlinien für Code

*   **Modularität:** Wir verwenden moderne JavaScript-Module (ES6). Logik sollte in die entsprechenden Dateien (`combat.js`, `story.js`, `spieler.js`) aufgeteilt werden.
*   **Sprachunterstützung:** Neue Texte müssen sowohl in den deutschen als auch in den englischen Sprachdateien (innerhalb der `config.js` oder `utils.js` Lokalisierungs-Logik) hinzugefügt werden.
*   **Kommentare:** Bitte kommentiere komplexe Logik, besonders innerhalb der Kampfberechnungen oder bei neuen Quest-Typen.

## 🚀 Der Workflow für Beiträge

1.  Erstelle einen neuen **Branch** für deine Änderungen:
    ```bash
    git checkout -b feature/mein-neues-feature
    ```
2.  Nimm deine Änderungen vor und achte darauf, dass die `index.html` weiterhin fehlerfrei lädt.
3.  **Committe** deine Änderungen mit einer aussagekräftigen Nachricht:
    ```bash
    git commit -m "Add: Neue Spezialisierung 'Schattenpriester'"
    ```
4.  **Pushe** deinen Branch und öffne einen **Pull Request (PR)**.

## 🐞 Fehler melden
Nutze bitte die GitHub Issues, um Bugs zu melden. Beschreibe dabei genau, in welcher Ebene oder bei welcher Aktion der Fehler aufgetreten ist (idealerweise mit einem Screenshot der Browser-Konsole).

Viel Erfolg beim Coden! ⚔️