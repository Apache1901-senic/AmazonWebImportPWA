"use strict";

// =======================================================
// Zentrale Versionsinformationen
// =======================================================

const APP_INFO = {

    name: "Amazon CSV Importer",

    version: "1.2.2",

    buildDate: "2026-09-03",

    author: ".::ST:HU::.",

    changelog: [

        {
            version: "1.2.2",
            date: "2026-09-03",
            changes: [
                "Diagnose-Center um Firebase-, Firestore- und Synchronisationsprüfung erweitert",
                "Direkter Start eines neuen Importvorgangs über „Neuer Import“ ergänzt",
                "Benutzerführung bei JSON-Sicherungen verbessert",
                "Hinweise zum Speichern von JSON-Sicherungen verständlicher gestaltet",
                "Kleinere Bedienungs- und Layoutverbesserungen vorgenommen",
                "Abschließende Funktions- und Mehr-PC-Tests erfolgreich durchgeführt"
            ]
        },

        {
            version: "1.2.1",
            date: "2026-09-03",
            changes: [
                "Sicherungsabfrage vor dem JSON-Import hinzugefügt",
                "Direkte JSON-Sicherung vor dem Ersetzen der Produktdaten möglich",
                "Hilfe und Programmdokumentation vollständig überarbeitet",
                "Dokumentation für Offline-Betrieb und automatische Synchronisation ergänzt",
                "Dokumentation für Mehr-PC-Betrieb und Konfliktbehandlung ergänzt"
            ]
        },

        {
            version: "1.2.0",
            date: "2026-09-02",
            changes: [
                "Live-Synchronisation zwischen mehreren Computern integriert",
                "Sichere Erkennung paralleler Produktänderungen implementiert",
                "Konfliktfenster für unterschiedliche lokale und zentrale Produktdaten hinzugefügt",
                "Auswahl zwischen lokalem und zentralem Datenstand bei Konflikten",
                "Sichere Versionierung des zentralen Produktdatenbestands bei gleichzeitigem Zugriff mehrerer Computer",
                "Sicherer Server-Abgleich nach dem Offline-Betrieb integriert",
                "Automatische Wiederaufnahme der Synchronisation nach Wiederherstellung der Verbindung",
                "Build-Kennung zur Kontrolle des veröffentlichten Programmstands ergänzt",
                "Mehr-PC- und Offline-Konflikttests erfolgreich abgeschlossen"
            ]
        },

        {
            version: "1.1.0",
            date: "2026-08-28",
            changes: [
                "Zentrale Produktdaten über Firebase Firestore integriert",
                "Firebase-Anmeldung und Abmeldung hinzugefügt",
                "Automatische Synchronisation der Produktdaten zwischen mehreren Computern",
                "Offline-Änderungen werden lokal gespeichert und später synchronisiert",
                "Synchronisationsstatus und Benutzerhinweise ergänzt",
                "Produktdaten-Versionierung für den zentralen Datenbestand eingeführt"
            ]
        },

        {
            version: "1.0.1",
            date: "2026-08-26",
            changes: [
                "Code-Cleanup und umfangreiche Funktionstests",
                "Import- und Fehlerdiagnose überarbeitet",
                "JSON-Sicherung und Wiederherstellung getestet",
                "PWA- und Offline-Betrieb erfolgreich getestet",
                "Veröffentlichung über GitHub Pages eingerichtet"
            ]
        },

        {
            version: "1.0.0",
            date: "2026-08-18",
            changes: [
                "Erste PWA-Version",
                "CSV-Import per Dateiauswahl und Drag & Drop",
                "SKU/EAN-Zuordnung mit Konfliktprüfung",
                "Excel-Export mit Output und Summary",
                "Produktverwaltung mit Suche, Neu, Bearbeiten und Löschen",
                "Produktdaten in localStorage",
                "JSON Import und Export",
                "Dublettenprüfung für ASIN, SKU und EAN",
                "EAN-13-Prüfziffernkontrolle",
                "Offline-Betrieb über Service Worker",
                "Selbstheilender Offline-Cache",
                "Installierbare PWA",
                "System-Diagnose-Center"
            ]
        }

    ]

};


// =======================================================
// Build-Kennung
// =======================================================

window.APP_BUILD =
    "2026-09-03-01";


console.log(
    `Amazon CSV Importer – Build ${window.APP_BUILD} geladen`
);