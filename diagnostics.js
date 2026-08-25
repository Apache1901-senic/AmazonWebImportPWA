"use strict";


// =======================================================
// Diagnose-Center
// =======================================================

const EXPECTED_CACHE_NAME =
    "amazon-csv-importer-v5";


// =======================================================
// Kleine Hilfsfunktion für den Show-Effekt
// =======================================================

function diagnosticSleep(milliseconds) {

    return new Promise(resolve => {

        setTimeout(
            resolve,
            milliseconds
        );
    });
}


// =======================================================
// Diagnosezeile erzeugen
// =======================================================

function createDiagnosticRow(
    container,
    id,
    label
) {

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "diagnostics-row";


    const labelElement =
        document.createElement(
            "div"
        );

    labelElement.className =
        "diagnostics-label";

    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            "div"
        );

    valueElement.className =
        "diagnostics-value";

    valueElement.id =
        `${id}-value`;

    valueElement.textContent =
        "Noch nicht geprüft";


    const statusElement =
        document.createElement(
            "div"
        );

    statusElement.className =
        "diagnostics-status waiting";

    statusElement.id =
        `${id}-status`;

    statusElement.textContent =
        "WARTET";


    // ---------------------------------------------------
    // Diagnosezeile zusammensetzen
    // ---------------------------------------------------

    row.appendChild(
        labelElement
    );

    row.appendChild(
        valueElement
    );

    row.appendChild(
        statusElement
    );


    container.appendChild(
        row
    );
}

// =======================================================
// Diagnoseoberfläche vorbereiten
// =======================================================

function buildDiagnosticsInterface() {

    const application =
        document.getElementById(
            "diagnosticsApplication"
        );

    const productArea =
        document.getElementById(
            "diagnosticsProducts"
        );

    const pwa =
        document.getElementById(
            "diagnosticsPwa"
        );

    const browser =
        document.getElementById(
            "diagnosticsBrowser"
        );


    // ---------------------------------------------------
    // Vorhandene Diagnosezeilen entfernen
    // ---------------------------------------------------

    application.innerHTML = "";
    productArea.innerHTML = "";
    pwa.innerHTML = "";
    browser.innerHTML = "";


    // ---------------------------------------------------
    // Anwendung
    // ---------------------------------------------------

    createDiagnosticRow(
        application,
        "diag-version",
        "Programmversion"
    );

    createDiagnosticRow(
        application,
        "diag-xlsx",
        "Excel-Engine"
    );

    createDiagnosticRow(
        application,
        "diag-fileapi",
        "Dateizugriff"
    );

    createDiagnosticRow(
        application,
        "diag-dragdrop",
        "Drag & Drop"
    );


    // ---------------------------------------------------
    // Produktstammdaten
    // ---------------------------------------------------

    createDiagnosticRow(
        productArea,
        "diag-products",
        "Produktstammdaten"
    );

    createDiagnosticRow(
        productArea,
        "diag-product-validity",
        "Datenintegrität"
    );

    createDiagnosticRow(
        productArea,
        "diag-duplicates",
        "Dublettenprüfung"
    );

    createDiagnosticRow(
        productArea,
        "diag-storage",
        "localStorage"
    );


    // ---------------------------------------------------
    // PWA
    // ---------------------------------------------------

    createDiagnosticRow(
        pwa,
        "diag-manifest",
        "Web-App-Manifest"
    );

    createDiagnosticRow(
        pwa,
        "diag-serviceworker",
        "Service Worker"
    );

    createDiagnosticRow(
        pwa,
        "diag-cache",
        "Offline-Cache"
    );

    createDiagnosticRow(
        pwa,
        "diag-secure",
        "Sichere Umgebung"
    );

    createDiagnosticRow(
        pwa,
        "diag-displaymode",
        "App-Modus"
    );

    createDiagnosticRow(
        pwa,
        "diag-network",
        "Netzwerkstatus"
    );


    // ---------------------------------------------------
    // Browser und System
    // ---------------------------------------------------

    createDiagnosticRow(
        browser,
        "diag-browser",
        "Browser"
    );

    createDiagnosticRow(
        browser,
        "diag-platform",
        "Betriebssystem"
    );

    createDiagnosticRow(
        browser,
        "diag-language",
        "Sprache"
    );

    createDiagnosticRow(
        browser,
        "diag-url",
        "Anwendungsadresse"
    );
}


// =======================================================
// Ergebnis einer Prüfung anzeigen
// =======================================================

function setDiagnosticResult(
    id,
    value,
    status = "ok"
) {

    const valueElement =
        document.getElementById(
            `${id}-value`
        );

    const statusElement =
        document.getElementById(
            `${id}-status`
        );


    // ---------------------------------------------------
    // Diagnoseelemente müssen vorhanden sein
    // ---------------------------------------------------

    if (
        !valueElement ||
        !statusElement
    ) {
        return;
    }


    // ---------------------------------------------------
    // Diagnosewert anzeigen
    // ---------------------------------------------------

    valueElement.textContent =
        value;


    // ---------------------------------------------------
    // Statusklasse setzen
    // ---------------------------------------------------

    statusElement.className =
        `diagnostics-status ${status}`;


    // ---------------------------------------------------
    // Statustext setzen
    // ---------------------------------------------------

    switch (status) {

        case "ok":

            statusElement.textContent =
                "OK";

            break;


        case "warning":

            statusElement.textContent =
                "WARNUNG";

            break;


        case "error":

            statusElement.textContent =
                "FEHLER";

            break;


        case "running":

            statusElement.textContent =
                "PRÜFT...";

            break;


        default:

            statusElement.textContent =
                status.toUpperCase();
    }
}

// =======================================================
// Browser bestimmen
// =======================================================

function detectBrowser() {

    const userAgent =
        navigator.userAgent;


    // ---------------------------------------------------
    // Microsoft Edge
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "Edg/"
        )
    ) {

        const match =
            userAgent.match(
                /Edg\/([\d.]+)/
            );


        return (
            "Microsoft Edge "
            + (match?.[1] ?? "")
        );
    }


    // ---------------------------------------------------
    // Google Chrome
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "Chrome/"
        ) &&
        !userAgent.includes(
            "Edg/"
        )
    ) {

        const match =
            userAgent.match(
                /Chrome\/([\d.]+)/
            );


        return (
            "Google Chrome "
            + (match?.[1] ?? "")
        );
    }


    // ---------------------------------------------------
    // Safari
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "Safari/"
        ) &&
        !userAgent.includes(
            "Chrome/"
        )
    ) {

        const match =
            userAgent.match(
                /Version\/([\d.]+)/
            );


        return (
            "Safari "
            + (match?.[1] ?? "")
        );
    }


    // ---------------------------------------------------
    // Firefox
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "Firefox/"
        )
    ) {

        const match =
            userAgent.match(
                /Firefox\/([\d.]+)/
            );


        return (
            "Firefox "
            + (match?.[1] ?? "")
        );
    }


    // ---------------------------------------------------
    // Unbekannter Browser
    // ---------------------------------------------------

    return userAgent;
}


// =======================================================
// Betriebssystem bestimmen
// =======================================================

function detectOperatingSystem() {

    const userAgent =
        navigator.userAgent;


    // ---------------------------------------------------
    // Windows
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "Windows"
        )
    ) {
        return "Windows";
    }


    // ---------------------------------------------------
    // macOS
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "Macintosh"
        ) ||
        userAgent.includes(
            "Mac OS"
        )
    ) {
        return "macOS";
    }


    // ---------------------------------------------------
    // Android
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "Android"
        )
    ) {
        return "Android";
    }


    // ---------------------------------------------------
    // iOS / iPadOS
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "iPhone"
        ) ||
        userAgent.includes(
            "iPad"
        )
    ) {
        return "iOS / iPadOS";
    }


    // ---------------------------------------------------
    // Linux
    // ---------------------------------------------------

    if (
        userAgent.includes(
            "Linux"
        )
    ) {
        return "Linux";
    }


    // ---------------------------------------------------
    // Betriebssystem nicht erkannt
    // ---------------------------------------------------

    return "Unbekannt";
}


// =======================================================
// localStorage testen
// =======================================================

function testLocalStorage() {

    const testKey =
        "__amazonImporterDiagnostic__";


    try {

        // ---------------------------------------------------
        // Testwert schreiben
        // ---------------------------------------------------

        localStorage.setItem(
            testKey,
            "OK"
        );


        // ---------------------------------------------------
        // Testwert wieder lesen
        // ---------------------------------------------------

        const value =
            localStorage.getItem(
                testKey
            );


        // ---------------------------------------------------
        // Testwert entfernen
        // ---------------------------------------------------

        localStorage.removeItem(
            testKey
        );


        return (
            value === "OK"
        );

    }
    catch {

        return false;
    }
}


// =======================================================
// Produktstruktur prüfen
// =======================================================

function validateDiagnosticProducts() {

    // ---------------------------------------------------
    // Produktliste prüfen
    // ---------------------------------------------------

    if (
        !Array.isArray(products) ||
        products.length === 0
    ) {

        return {
            valid: false,
            message:
                "Keine Produktdaten vorhanden"
        };
    }


    // ---------------------------------------------------
    // Einzelne Produkte prüfen
    // ---------------------------------------------------

    for (
        let index = 0;
        index < products.length;
        index++
    ) {

        const product =
            products[index];


        // -----------------------------------------------
        // Pflichtfelder
        // -----------------------------------------------

        if (
            !product.productName ||
            !product.colourVariant ||
            !product.manufacturerCode ||
            !product.ean ||
            !product.sku ||
            !product.pack ||
            !product.asin
        ) {

            return {
                valid: false,
                message:
                    `Produkt ${index + 1}: Pflichtfeld fehlt`
            };
        }


        // -----------------------------------------------
        // EAN
        // -----------------------------------------------

        if (
            !/^\d{13}$/.test(
                product.ean
            ) ||
            !isValidEan13(
                product.ean
            )
        ) {

            return {
                valid: false,
                message:
                    `Ungültige EAN: ${product.ean}`
            };
        }


        // -----------------------------------------------
        // SKU
        // -----------------------------------------------

        if (
            !/^\d+$/.test(
                product.sku
            )
        ) {

            return {
                valid: false,
                message:
                    `Ungültige SKU: ${product.sku}`
            };
        }


        // -----------------------------------------------
        // ASIN
        // -----------------------------------------------

        if (
            !/^[A-Z0-9]{10}$/.test(
                product.asin
            )
        ) {

            return {
                valid: false,
                message:
                    `Ungültige ASIN: ${product.asin}`
            };
        }
    }


    // ---------------------------------------------------
    // Alle Produktdaten sind gültig
    // ---------------------------------------------------

    return {
        valid: true,
        message:
            `${products.length} Produkte geprüft`
    };
}


// =======================================================
// Progress
// =======================================================

function updateDiagnosticProgress(
    current,
    total
) {

    const progressBar =
        document.getElementById(
            "diagnosticsProgressBar"
        );


    // ---------------------------------------------------
    // Fortschritt in Prozent berechnen
    // ---------------------------------------------------

    const percent =
        Math.round(
            (current / total) * 100
        );


    // ---------------------------------------------------
    // Fortschrittsbalken aktualisieren
    // ---------------------------------------------------

    progressBar.style.width =
        `${percent}%`;
}

// =======================================================
// Systemtest
// =======================================================

async function runSystemDiagnostics() {

    const button =
        document.getElementById(
            "runDiagnostics"
        );

    const overallIcon =
        document.getElementById(
            "diagnosticsOverallIcon"
        );

    const overallTitle =
        document.getElementById(
            "diagnosticsOverallTitle"
        );

    const overallText =
        document.getElementById(
            "diagnosticsOverallText"
        );


    // ---------------------------------------------------
    // Diagnose vorbereiten
    // ---------------------------------------------------

    button.disabled = true;

    buildDiagnosticsInterface();


    overallIcon.className =
        "diagnostics-overall-icon running";

    overallTitle.textContent =
        "Selbstdiagnose läuft";

    overallText.textContent =
        "Systemkomponenten werden geprüft ...";


    let warningCount = 0;
    let errorCount = 0;
    let currentTest = 0;


    const TOTAL_TESTS = 16;


    // ---------------------------------------------------
    // Fortschritt einen Schritt weiterführen
    // ---------------------------------------------------

    async function step() {

        currentTest++;


        updateDiagnosticProgress(
            currentTest,
            TOTAL_TESTS
        );


        await diagnosticSleep(
            120
        );
    }


    // ===================================================
    // 1. Programmversion
    // ===================================================

    setDiagnosticResult(
        "diag-version",
        APP_INFO.version,
        "ok"
    );

    await step();


    // ===================================================
    // 2. Excel-Engine
    // ===================================================

    if (
        typeof XLSX !== "undefined"
    ) {

        setDiagnosticResult(
            "diag-xlsx",
            "SheetJS geladen – Excel-Export bereit",
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-xlsx",
            "XLSX-Engine nicht verfügbar",
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 3. File API
    // ===================================================

    if (
        window.File &&
        window.FileReader &&
        window.Blob
    ) {

        setDiagnosticResult(
            "diag-fileapi",
            "File API verfügbar",
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-fileapi",
            "File API nicht vollständig verfügbar",
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 4. Drag & Drop
    // ===================================================

    if (
        "ondrop" in window &&
        "ondragover" in window
    ) {

        setDiagnosticResult(
            "diag-dragdrop",
            "Drag & Drop unterstützt",
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-dragdrop",
            "Drag & Drop nicht erkannt",
            "warning"
        );

        warningCount++;
    }


    await step();


    // ===================================================
    // 5. Produktstammdaten
    // ===================================================

    if (
        Array.isArray(products) &&
        products.length > 0
    ) {

        setDiagnosticResult(
            "diag-products",
            `${products.length} Produkte geladen`,
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-products",
            "Keine Produktdaten geladen",
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 6. Produktintegrität
    // ===================================================

    const productValidation =
        validateDiagnosticProducts();


    if (
        productValidation.valid
    ) {

        setDiagnosticResult(
            "diag-product-validity",
            productValidation.message,
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-product-validity",
            productValidation.message,
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 7. Dubletten
    // ===================================================

    const duplicates =
        findDuplicateProductFields(
            products
        );


    if (
        duplicates.length === 0
    ) {

        setDiagnosticResult(
            "diag-duplicates",
            "Keine doppelten ASIN / SKU / EAN",
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-duplicates",
            `${duplicates.length} Dubletten erkannt`,
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 8. localStorage
    // ===================================================

    if (
        testLocalStorage()
    ) {

        setDiagnosticResult(
            "diag-storage",
            "localStorage verfügbar",
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-storage",
            "localStorage nicht verfügbar",
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 9. Manifest
    // ===================================================

    try {

        const response =
            await fetch(
                "./manifest.json"
            );


        if (
            response.ok
        ) {

            setDiagnosticResult(
                "diag-manifest",
                "manifest.json erreichbar",
                "ok"
            );

        }
        else {

            throw new Error();
        }

    }
    catch {

        setDiagnosticResult(
            "diag-manifest",
            "Manifest nicht erreichbar",
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 10. Service Worker
    // ===================================================

    if (
        "serviceWorker" in navigator
    ) {

        const registration =
            await navigator
                .serviceWorker
                .getRegistration();


        if (registration) {

            const state =
                registration.active?.state
                ?? "registriert";


            setDiagnosticResult(
                "diag-serviceworker",
                `Aktiv – Status: ${state}`,
                "ok"
            );

        }
        else {

            setDiagnosticResult(
                "diag-serviceworker",
                "Unterstützt, aber nicht registriert",
                "warning"
            );

            warningCount++;
        }

    }
    else {

        setDiagnosticResult(
            "diag-serviceworker",
            "Nicht unterstützt",
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 11. Offline-Cache
    // ===================================================

    if (
        "caches" in window
    ) {

        const cacheNames =
            await caches.keys();


        if (
            cacheNames.includes(
                EXPECTED_CACHE_NAME
            )
        ) {

            const cache =
                await caches.open(
                    EXPECTED_CACHE_NAME
                );


            const requests =
                await cache.keys();


            setDiagnosticResult(
                "diag-cache",
                `${EXPECTED_CACHE_NAME} – ${requests.length} Dateien`,
                "ok"
            );

        }
        else {

            setDiagnosticResult(
                "diag-cache",
                "Erwarteter Offline-Cache nicht gefunden",
                "warning"
            );

            warningCount++;
        }

    }
    else {

        setDiagnosticResult(
            "diag-cache",
            "Cache API nicht verfügbar",
            "error"
        );

        errorCount++;
    }


    await step();


    // ===================================================
    // 12. Sicherer Browser-Kontext
    // ===================================================

    if (
        window.isSecureContext
    ) {

        setDiagnosticResult(
            "diag-secure",
            "Sicherer Browser-Kontext",
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-secure",
            "Kein sicherer Browser-Kontext",
            "warning"
        );

        warningCount++;
    }


    await step();


    // ===================================================
    // 13. App-Modus
    // ===================================================

    const standalone =
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches;


    if (standalone) {

        setDiagnosticResult(
            "diag-displaymode",
            "Installierte PWA / Standalone",
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-displaymode",
            "Browser-Modus",
            "ok"
        );
    }


    await step();


    // ===================================================
    // 14. Netzwerkstatus
    // ===================================================

    if (
        navigator.onLine
    ) {

        setDiagnosticResult(
            "diag-network",
            "Online",
            "ok"
        );

    }
    else {

        setDiagnosticResult(
            "diag-network",
            "Offline – Cachebetrieb",
            "ok"
        );
    }


    await step();


    // ===================================================
    // 15. Browser
    // ===================================================

    setDiagnosticResult(
        "diag-browser",
        detectBrowser(),
        "ok"
    );


    await step();


    // ===================================================
    // 16. Betriebssystem
    // ===================================================

    setDiagnosticResult(
        "diag-platform",
        detectOperatingSystem(),
        "ok"
    );


    await step();


    // ===================================================
    // Zusätzliche Informationen
    //
    // Diese Werte sind reine Informationen und zählen
    // deshalb nicht als eigene Systemtests.
    // ===================================================

    setDiagnosticResult(
        "diag-language",
        navigator.language,
        "ok"
    );


    setDiagnosticResult(
        "diag-url",
        window.location.href,
        "ok"
    );


    // ===================================================
    // Gesamtergebnis
    // ===================================================

    if (
        errorCount > 0
    ) {

        overallIcon.className =
            "diagnostics-overall-icon error";

        overallTitle.textContent =
            "Systemfehler erkannt";

        overallText.textContent =
            `${errorCount} Fehler und ${warningCount} Warnungen gefunden.`;

    }
    else if (
        warningCount > 0
    ) {

        overallIcon.className =
            "diagnostics-overall-icon warning";

        overallTitle.textContent =
            "System funktionsfähig";

        overallText.textContent =
            `Keine kritischen Fehler. ${warningCount} Warnungen vorhanden.`;

    }
    else {

        overallIcon.className =
            "diagnostics-overall-icon success";

        overallTitle.textContent =
            "Alle Systeme bereit";

        overallText.textContent =
            "Selbstdiagnose erfolgreich abgeschlossen.";
    }


    // ---------------------------------------------------
    // Fortschritt sicher auf 100 % setzen
    // ---------------------------------------------------

    updateDiagnosticProgress(
        TOTAL_TESTS,
        TOTAL_TESTS
    );


    button.disabled = false;
}

// =======================================================
// Diagnose-Center öffnen
// =======================================================

function openDiagnosticsCenter() {

    const dialog =
        document.getElementById(
            "diagnosticsDialog"
        );


    // ---------------------------------------------------
    // Diagnoseoberfläche zurücksetzen
    // ---------------------------------------------------

    buildDiagnosticsInterface();


    // ---------------------------------------------------
    // Fortschrittsbalken zurücksetzen
    // ---------------------------------------------------

    const progressBar =
        document.getElementById(
            "diagnosticsProgressBar"
        );


    progressBar.style.width =
        "0%";


    // ---------------------------------------------------
    // Gesamtstatus zurücksetzen
    // ---------------------------------------------------

    const overallIcon =
        document.getElementById(
            "diagnosticsOverallIcon"
        );


    overallIcon.className =
        "diagnostics-overall-icon";


    document
        .getElementById(
            "diagnosticsOverallTitle"
        )
        .textContent =
            "System bereit für Diagnose";


    document
        .getElementById(
            "diagnosticsOverallText"
        )
        .textContent =
            "Starte den Systemtest.";


    // ---------------------------------------------------
    // Diagnose-Center öffnen
    // ---------------------------------------------------

    dialog.showModal();
}

// =======================================================
// Events
// =======================================================

const diagnosticsDialog =
    document.getElementById(
        "diagnosticsDialog"
    );


// -------------------------------------------------------
// Diagnose-Center öffnen
// -------------------------------------------------------

document
    .getElementById(
        "menuDiagnostics"
    )
    .addEventListener(
        "click",
        openDiagnosticsCenter
    );


// -------------------------------------------------------
// Systemdiagnose starten
// -------------------------------------------------------

document
    .getElementById(
        "runDiagnostics"
    )
    .addEventListener(
        "click",
        runSystemDiagnostics
    );


// -------------------------------------------------------
// Diagnose-Center oben schließen
// -------------------------------------------------------

document
    .getElementById(
        "closeDiagnostics"
    )
    .addEventListener(
        "click",
        () => {

            diagnosticsDialog.close();
        }
    );


// -------------------------------------------------------
// Diagnose-Center unten schließen
// -------------------------------------------------------

document
    .getElementById(
        "closeDiagnosticsBottom"
    )
    .addEventListener(
        "click",
        () => {

            diagnosticsDialog.close();
        }
    );