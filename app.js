"use strict";


// =======================================================
// Einstellungen
// =======================================================

const COUNT_SEPARATOR = "-";
const COUNT_WIDTH = 4;

const PRODUCT_STORAGE_KEY =
    "amazonCsvImporter_products";

const PRODUCT_VERSION_STORAGE_KEY =
    "amazonCsvImporter_products_version";

const PRODUCT_PENDING_STORAGE_KEY =
    "amazonCsvImporter_products_pending";

const PRODUCT_BASELINE_STORAGE_KEY =
    "amazonCsvImporter_products_baseline";


let selectedProductIndex = null;
let editProductIndex = null;

let exportOutputRows = [];
let exportSummary = null;

let products = [];

let serviceWorkerReady = false;


// =======================================================
// Produkt-Stammdaten speichern
// =======================================================

function saveProductsToStorage() {

    localStorage.setItem(
        PRODUCT_STORAGE_KEY,
        JSON.stringify(products)
    );


    // ---------------------------------------------------
    // Produktanzahl in der Statusleiste aktualisieren
    // ---------------------------------------------------

    updateProductCountStatus();
}

// =======================================================
// Lokale Produktdaten-Version lesen
// =======================================================

function getLocalProductDataVersion() {

    const storedVersion =
        localStorage.getItem(
            PRODUCT_VERSION_STORAGE_KEY
        );


    if (storedVersion === null) {

        return 0;
    }


    const version =
        Number(storedVersion);


    if (!Number.isFinite(version)) {

        return 0;
    }


    return version;
}

// =======================================================
// Datenversion in der Statusleiste aktualisieren
// =======================================================

function updateDataVersionStatus() {

    const statusElement =
        document.getElementById(
            "statusDataVersion"
        );


    if (!statusElement) {
        return;
    }


    const version =
        getLocalProductDataVersion();


    statusElement.textContent =
        version;
}

// =======================================================
// Datenversion beim Programmstart anzeigen
// =======================================================

updateDataVersionStatus();



// =======================================================
// Produktanzahl in der Statusleiste aktualisieren
// =======================================================

function updateProductCountStatus() {

    const statusElement =
        document.getElementById(
            "statusProductCount"
        );


    if (!statusElement) {
        return;
    }


    statusElement.textContent =
        products.length;

    updateFailSafeStatus();
}


// =======================================================
// Lokale Produktdaten-Version speichern
// =======================================================

function setLocalProductDataVersion(
    version
) {

    localStorage.setItem(
        PRODUCT_VERSION_STORAGE_KEY,
        String(version)
    );


    // ---------------------------------------------------
    // Statusleiste aktualisieren
    // ---------------------------------------------------

    updateDataVersionStatus();
}



// =======================================================
// Prüfen, ob lokale Produktänderungen ausstehen
// =======================================================

function hasPendingProductChanges() {

    return (
        localStorage.getItem(
            PRODUCT_PENDING_STORAGE_KEY
        ) === "true"
    );
}

// =======================================================
// Daten-Synchronisationsstatus aktualisieren
// =======================================================

function updateDataSyncStatus() {

    const statusValue =
        document.getElementById(
            "statusDataSync"
        );


    const statusLight =
        document.getElementById(
            "statusDataLight"
        );


    if (
        !statusValue ||
        !statusLight
    ) {
        return;
    }


    // ---------------------------------------------------
    // Offline
    // ---------------------------------------------------

    if (!navigator.onLine) {

        statusValue.textContent =
            "OFFLINE";


        statusLight.className =
             "status-light offline";


        return;
    }


    // ---------------------------------------------------
    // Lokale Änderungen warten auf Synchronisation
    // ---------------------------------------------------

    if (
        hasPendingProductChanges()
    ) {

        statusValue.textContent =
            "AUSSTEHEND";


        statusLight.className =
            "status-light pending";


        return;
    }


    // ---------------------------------------------------
    // Alles synchron
    // ---------------------------------------------------

    statusValue.textContent =
        "SYNCHRON";


    statusLight.className =
        "status-light online";
}

// =======================================================
// Firestore-Status aktualisieren
// =======================================================

function updateFirestoreStatus(
    status
) {

    const statusValue =
        document.getElementById(
            "statusFirestore"
        );


    const statusLight =
        document.getElementById(
            "statusFirestoreLight"
        );


    if (
        !statusValue ||
        !statusLight
    ) {
        return;
    }


    switch (status) {

        case "connecting":

            statusValue.textContent =
                "VERBINDET…";

            statusLight.className =
                "status-light pending";

            break;


        case "connected":

            statusValue.textContent =
                "VERBUNDEN";

            statusLight.className =
                "status-light online";

            break;


        case "disconnected":

            statusValue.textContent =
                "NICHT VERBUNDEN";

            statusLight.className =
                "status-light offline";

            break;

    }
}


window.updateFirestoreStatus =
    updateFirestoreStatus;




// =======================================================
// Auf Änderungen der Internetverbindung reagieren
// =======================================================

window.addEventListener(
    "online",
    () => {

        updateSystemStatus();
        updateDataSyncStatus();    
        updateFirestoreStatus(
            "connecting"
        );

        
    }
);

window.addEventListener(
    "offline",
    () => {

        updateSystemStatus();
        updateDataSyncStatus();
        updateFirestoreStatus(
            "disconnected"
        );
    }
);


// =======================================================
// Systemstatus nach vollständigem Programmstart anzeigen
// =======================================================

window.addEventListener(
    "load",
    () => {

        updateSystemStatus();
        updateDataSyncStatus();
    }
);


window.hasPendingProductChanges =
    hasPendingProductChanges;

    function markProductChangesPending() {

    const wasAlreadyPending =
        hasPendingProductChanges();


    localStorage.setItem(
        PRODUCT_PENDING_STORAGE_KEY,
        "true"
    );


    updateDataSyncStatus();


    console.log(
        "Lokale Produktänderungen warten auf Synchronisation."
    );


    // ---------------------------------------------------
    // Offline-Hinweis nur bei tatsächlichem Offline-Betrieb
    // ---------------------------------------------------

    if (
        !navigator.onLine &&
        !wasAlreadyPending &&
        typeof showNotification === "function"
    ) {

        showNotification(
            "warning",
            "Offline gespeichert",
            "Die Änderung wurde lokal gespeichert und wird synchronisiert, sobald die Verbindung wieder verfügbar ist.",
            5000
        );
    }
}



    function clearPendingProductChanges() {

        const wasPending =
            hasPendingProductChanges();


        localStorage.removeItem(
            PRODUCT_PENDING_STORAGE_KEY
        );


        // ---------------------------------------------------
        // Statusleiste aktualisieren
        // ---------------------------------------------------

        updateDataSyncStatus();


        console.log(
            "Lokale Produktänderungen sind vollständig synchronisiert."
        );


        // ---------------------------------------------------
        // Benutzer über abgeschlossene Synchronisation informieren
        // ---------------------------------------------------

        if (
            wasPending &&
            typeof showNotification === "function"
        ) {

            showNotification(
                "success",
                "Synchronisation abgeschlossen",
                "Die lokal gespeicherten Änderungen wurden erfolgreich mit Firestore synchronisiert.",
                5000
            );
        }
    }
    


    // =======================================================
    // Produktdaten bei Bedarf aus Firestore synchronisieren
    // =======================================================

    async function syncProductsFromFirestoreIfNeeded() {
        // ---------------------------------------------------
        // Lokale Offline-Änderungen haben Vorrang
        // ---------------------------------------------------
    const localChangesExist =
        hasPendingProductChanges() ||
        hasLocalProductChangesComparedToBaseline();


    if (
        localChangesExist
    ) {

        // Pending-Markierung gegebenenfalls selbst reparieren
        if (
            !hasPendingProductChanges()
        ) {

            markProductChangesPending();

            console.log(
                "Lokale Änderungen wurden anhand der Baseline erkannt. "
                + "Pending-Markierung wurde wiederhergestellt."
            );
        }


        console.log(
            "Lokale Änderungen warten auf Synchronisation. "
            + "Cloud-Download wird zunächst übersprungen."
        );


        return false;
    }
    // ---------------------------------------------------
    // Prüfen, ob Firebase-Funktionen verfügbar sind
    // ---------------------------------------------------

    if (
        typeof window.getProductDataVersion !== "function" ||
        typeof window.loadProductsFromFirestore !== "function"
    ) {

        console.log(
            "Firebase-Synchronisation noch nicht verfügbar."
        );

        return false;
    }


    try {

        // ---------------------------------------------------
        // Versionsstände lesen
        // ---------------------------------------------------

        const localVersion =
            getLocalProductDataVersion();


        const cloudVersion =
            await window.getProductDataVersion();


        console.log(
            "Produktdaten-Versionen:",
            {
                lokal: localVersion,
                firebase: cloudVersion
            }
        );


        // ---------------------------------------------------
        // Keine zentrale Version vorhanden
        // ---------------------------------------------------

        if (
            cloudVersion === null ||
            cloudVersion === undefined
        ) {

            console.log(
                "Keine zentrale Produktdaten-Version vorhanden."
            );

            return false;
        }


        // ---------------------------------------------------
        // Lokaler Stand ist bereits aktuell
        // ---------------------------------------------------

        if (
            cloudVersion <= localVersion
        ) {

            console.log(
                "Lokale Produktdaten sind bereits aktuell."
            );

            return true;
        }


        // ---------------------------------------------------
        // Neueren Datenstand aus Firestore laden
        // ---------------------------------------------------

        console.log(
            "Neuere Produktdaten in Firebase gefunden."
        );


        const cloudProducts =
            await window.loadProductsFromFirestore();


        if (
            !Array.isArray(cloudProducts) ||
            cloudProducts.length === 0
        ) {

            console.error(
                "Zentrale Produktliste ist leer oder konnte nicht geladen werden."
            );

            return false;
        }


        // ---------------------------------------------------
        // Daten vor Übernahme prüfen
        // ---------------------------------------------------

        const validation =
            validateProductList(
                cloudProducts
            );


        if (!validation.valid) {

            console.error(
                "Zentrale Produktliste ist ungültig:",
                validation.message
            );

            return false;
        }


        const duplicates =
            findDuplicateProductFields(
                cloudProducts
            );


        if (
            duplicates.length > 0
        ) {

            console.error(
                "Zentrale Produktliste enthält Dubletten:",
                duplicates
            );

            return false;
        }


        // ---------------------------------------------------
        // Zentrale Produktdaten lokal übernehmen
        // ---------------------------------------------------

        products =
            structuredClone(
                cloudProducts
            );


        saveProductsToStorage();


        setLocalProductDataVersion(
            cloudVersion
        );


        // ---------------------------------------------------
        // Erfolgreich übernommenen Cloud-Stand als neue
        // Vergleichsbasis speichern
        // ---------------------------------------------------

        saveProductBaseline(
            products
        );


        clearPendingProductChanges();


        // ---------------------------------------------------
        // Produktliste aktualisieren, falls geöffnet
        // ---------------------------------------------------

        const productsDialog =
            document.getElementById(
                "productsDialog"
            );


        if (
            productsDialog &&
            productsDialog.open
        ) {

            renderProductList();
        }


        console.log(
            `${products.length} Produktdaten wurden aus Firebase übernommen.`
        );

        console.log(
            `Lokale Produktdaten-Version wurde auf ${cloudVersion} aktualisiert.`
        );


        return true;

    }
    catch (error) {

        // ---------------------------------------------------
        // Ganz wichtig:
        // Firebase-Fehler dürfen die lokale App nicht stoppen
        // ---------------------------------------------------

        console.warn(
            "Firebase-Synchronisation nicht möglich. "
            + "Die lokalen Produktdaten werden weiter verwendet.",
            error
        );


        return false;
    }
}

// =======================================================
// Letzten synchronisierten Produktstand speichern
// =======================================================

function saveProductBaseline(
    productList
) {

    if (
        !Array.isArray(productList)
    ) {
        return;
    }


    localStorage.setItem(
        PRODUCT_BASELINE_STORAGE_KEY,
        JSON.stringify(productList)
    );


    console.log(
        "Synchronisierter Produktstand wurde lokal gespeichert."
    );
}


// =======================================================
// Letzten synchronisierten Produktstand laden
// =======================================================

function loadProductBaseline() {

    const storedBaseline =
        localStorage.getItem(
            PRODUCT_BASELINE_STORAGE_KEY
        );


    if (!storedBaseline) {
        return null;
    }


    try {

        const baseline =
            JSON.parse(
                storedBaseline
            );


        return Array.isArray(baseline)
            ? baseline
            : null;

    }
    catch (error) {

        console.error(
            "Synchronisierter Produktstand konnte nicht gelesen werden:",
            error
        );


        return null;
    }
}

// Für Test und spätere Verwendung bereitstellen
window.syncProductsFromFirestoreIfNeeded =
    syncProductsFromFirestoreIfNeeded;


// =======================================================
// Produkt-Stammdaten laden
// =======================================================

function loadProducts() {

    const storedProducts =
        localStorage.getItem(
            PRODUCT_STORAGE_KEY
        );


    // ---------------------------------------------------
    // Bereits gespeicherte Produktliste vorhanden
    // ---------------------------------------------------

    if (storedProducts) {

        try {

            const parsed =
                JSON.parse(storedProducts);


            if (Array.isArray(parsed)) {

                products = parsed;


                updateProductCountStatus();


                console.log(
                    "Produktliste aus localStorage geladen:",
                    products.length
                );


                return;
            }

        }
        catch (error) {

            console.error(
                "Gespeicherte Produktliste konnte nicht gelesen werden:",
                error
            );
        }
    }


    // ---------------------------------------------------
    // Keine gültigen gespeicherten Daten:
    // Standard-Produktliste übernehmen
    // ---------------------------------------------------

    products =
        structuredClone(
            DEFAULT_PRODUCTS
        );


    saveProductsToStorage();


    console.log(
        "Standard-Produktliste wurde in localStorage angelegt:",
        products.length
    );
}


// Beim Programmstart Produktdaten laden
loadProducts();


// =======================================================
// EAN normalisieren
// =======================================================

function normalizeEan13(ean) {

    if (!ean) {
        return null;
    }


    let digits =
        ean.replace(/\D/g, "");


    // Führende Null(en) entfernen
    digits =
        digits.replace(/^0+/, "");


    if (digits.length !== 13) {
        return null;
    }


    return digits;
}


// =======================================================
// Amazon-Dateiname analysieren
// =======================================================

function parseAmazonFilename(filename) {

    // Auch versehentliche Endungen wie .csv.csv entfernen
    const name =
        filename.replace(
            /(?:\.csv)+$/i,
            ""
        );


    const parts =
        name.split("_");


    // Erwartetes Amazon-Format:
    //
    // TCodes_PID..._SKU_AMAZON-EAN.csv
    if (parts.length < 4) {

        return {
            sku: null,
            amazonEan: null,
            ean: null
        };
    }


    // Vorletzter Bestandteil = SKU
    const sku =
        parts[parts.length - 2];


    // Letzter Bestandteil = Amazon-EAN
    const amazonEan =
        parts[parts.length - 1];


    // ---------------------------------------------------
    // Dateinamen-Struktur prüfen
    //
    // SKU:
    // nur Ziffern
    //
    // Amazon-EAN:
    // genau 14 Ziffern
    // ---------------------------------------------------

    const validSku =
        /^\d+$/.test(sku);


    const validAmazonEan =
        /^\d{14}$/.test(amazonEan);


    if (
        !validSku ||
        !validAmazonEan
    ) {

        return {
            sku: null,
            amazonEan: null,
            ean: null
        };
    }


    // ---------------------------------------------------
    // Amazon-EAN normalisieren
    //
    // Beispiel:
    //
    // 04260476940095
    //        ↓
    // 4260476940095
    // ---------------------------------------------------

    const ean =
        normalizeEan13(
            amazonEan
        );


    if (!ean) {

        return {
            sku,
            amazonEan,
            ean: null
        };
    }


    return {
        sku,
        amazonEan,
        ean
    };
}


// =======================================================
// Produkt über SKU suchen
// =======================================================

function findProductBySku(sku) {

    if (!sku) {
        return null;
    }


    return (
        products.find(
            product =>
                product.sku === sku
        )
        ?? null
    );
}


// =======================================================
// Produkt über EAN suchen
// =======================================================

function findProductByEan(ean) {

    if (!ean) {
        return null;
    }


    return (
        products.find(
            product =>
                product.ean === ean
        )
        ?? null
    );
}


// =======================================================
// Produkt sicher auflösen
// =======================================================

function resolveProduct(sku, ean) {

    const bySku =
        findProductBySku(sku);

    const byEan =
        findProductByEan(ean);


    // ---------------------------------------------------
    // SKU und EAN zeigen auf unterschiedliche Produkte
    // ---------------------------------------------------

    if (
        bySku &&
        byEan &&
        bySku.asin !== byEan.asin
    ) {

        return {
            product: null,
            method: null,
            status: "SKU/EAN-Konflikt",

            conflictDetails: {
                skuProduct: bySku,
                eanProduct: byEan
            }
        };
    }


    // ---------------------------------------------------
    // SKU und EAN stimmen überein
    // ---------------------------------------------------

    if (
        bySku &&
        byEan
    ) {

        return {
            product: bySku,
            method: "SKU + EAN",
            status: "OK",
            conflictDetails: null
        };
    }


    // ---------------------------------------------------
    // Nur SKU gefunden
    // ---------------------------------------------------

    if (bySku) {

        return {
            product: bySku,
            method: "SKU",
            status: "OK",
            conflictDetails: null
        };
    }


    // ---------------------------------------------------
    // Nur EAN gefunden
    // ---------------------------------------------------

    if (byEan) {

        return {
            product: byEan,
            method: "EAN",
            status: "OK",
            conflictDetails: null
        };
    }


    // ---------------------------------------------------
    // Kein Produkt gefunden
    // ---------------------------------------------------

    return {
        product: null,
        method: null,
        status: "Nicht gefunden",
        conflictDetails: null
    };
}


// =======================================================
// Produktstände vergleichen
// =======================================================

function compareProductStates(
    baselineProducts,
    localProducts,
    cloudProducts
) {

    const result = {
        unchanged: [],
        localChanged: [],
        cloudChanged: [],
        conflicts: []
    };


    // ---------------------------------------------------
    // Hilfsfunktion:
    // Produktlisten nach ASIN abbilden
    // ---------------------------------------------------

    function createProductMap(
        productList
    ) {

        const map = new Map();


        if (
            !Array.isArray(productList)
        ) {
            return map;
        }


        for (
            const product of productList
        ) {

            if (
                product &&
                product.asin
            ) {

                map.set(
                    product.asin,
                    product
                );
            }
        }


        return map;
    }


    // ---------------------------------------------------
    // Hilfsfunktion:
    // Zwei Produkte vollständig vergleichen
    // ---------------------------------------------------

    function productsAreEqual(
        productA,
        productB
    ) {

        if (
            !productA ||
            !productB
        ) {
            return false;
        }


        return (
            productA.productName === productB.productName &&
            productA.colourVariant === productB.colourVariant &&
            productA.manufacturerCode === productB.manufacturerCode &&
            productA.ean === productB.ean &&
            productA.sku === productB.sku &&
            productA.pack === productB.pack &&
            productA.asin === productB.asin
        );
    }


    const baselineMap =
        createProductMap(
            baselineProducts
        );


    const localMap =
        createProductMap(
            localProducts
        );


    const cloudMap =
        createProductMap(
            cloudProducts
        );


    // ---------------------------------------------------
    // Alle bekannten ASINs sammeln
    // ---------------------------------------------------

    const allAsins =
        new Set([
            ...baselineMap.keys(),
            ...localMap.keys(),
            ...cloudMap.keys()
        ]);


    // ---------------------------------------------------
    // Jeden Datensatz vergleichen
    // ---------------------------------------------------

    for (
        const asin of allAsins
    ) {

        const baselineProduct =
            baselineMap.get(
                asin
            );


        const localProduct =
            localMap.get(
                asin
            );


        const cloudProduct =
            cloudMap.get(
                asin
            );


        const localWasChanged =
            !productsAreEqual(
                baselineProduct,
                localProduct
            );


        const cloudWasChanged =
            !productsAreEqual(
                baselineProduct,
                cloudProduct
            );


        // -----------------------------------------------
        // Beide unverändert
        // -----------------------------------------------

        if (
            !localWasChanged &&
            !cloudWasChanged
        ) {

            result.unchanged.push({
                asin,
                baselineProduct,
                localProduct,
                cloudProduct
            });

            continue;
        }


        // -----------------------------------------------
        // Nur lokal geändert
        // -----------------------------------------------

        if (
            localWasChanged &&
            !cloudWasChanged
        ) {

            result.localChanged.push({
                asin,
                baselineProduct,
                localProduct,
                cloudProduct
            });

            continue;
        }


        // -----------------------------------------------
        // Nur zentral geändert
        // -----------------------------------------------

        if (
            !localWasChanged &&
            cloudWasChanged
        ) {

            result.cloudChanged.push({
                asin,
                baselineProduct,
                localProduct,
                cloudProduct
            });

            continue;
        }


        // -----------------------------------------------
        // Beide geändert
        //
        // Wenn beide inzwischen identisch sind,
        // besteht kein echter Konflikt.
        // -----------------------------------------------

        if (
            productsAreEqual(
                localProduct,
                cloudProduct
            )
        ) {

            result.unchanged.push({
                asin,
                baselineProduct,
                localProduct,
                cloudProduct
            });

            continue;
        }


        // -----------------------------------------------
        // Echter Konflikt
        // -----------------------------------------------

        result.conflicts.push({
            asin,
            baselineProduct,
            localProduct,
            cloudProduct
        });
    }


    return result;
}

// =======================================================
// Sicheren Merge aus Baseline, lokal und Cloud erstellen
// =======================================================

function buildMergedProductState(
    baselineProducts,
    localProducts,
    cloudProducts
) {

    const comparison =
        compareProductStates(
            baselineProducts,
            localProducts,
            cloudProducts
        );


    const mergedProducts = [];


    // ---------------------------------------------------
    // Unveränderte Produkte
    // ---------------------------------------------------

    for (
        const item of comparison.unchanged
    ) {

        const product =
            item.localProduct ||
            item.cloudProduct ||
            item.baselineProduct;


        if (product) {

            mergedProducts.push(
                structuredClone(
                    product
                )
            );
        }
    }


    // ---------------------------------------------------
    // Nur lokal geändert
    // ---------------------------------------------------

    for (
        const item of comparison.localChanged
    ) {

        if (
            item.localProduct
        ) {

            mergedProducts.push(
                structuredClone(
                    item.localProduct
                )
            );
        }
    }


    // ---------------------------------------------------
    // Nur zentral geändert
    // ---------------------------------------------------

    for (
        const item of comparison.cloudChanged
    ) {

        if (
            item.cloudProduct
        ) {

            mergedProducts.push(
                structuredClone(
                    item.cloudProduct
                )
            );
        }
    }


    // ---------------------------------------------------
    // Konflikte werden NICHT automatisch übernommen
    // ---------------------------------------------------

    return {
        products:
            mergedProducts,

        conflicts:
            comparison.conflicts,

        comparison
    };
}


// =======================================================
// Konfliktentscheidung in Merge übernehmen
// =======================================================

function resolveProductConflict(
    mergeResult,
    conflict,
    useLocalVersion
) {

    if (
        !mergeResult ||
        !Array.isArray(
            mergeResult.products
        ) ||
        !conflict
    ) {

        return false;
    }


    const selectedProduct =
        useLocalVersion
            ? conflict.localProduct
            : conflict.cloudProduct;


    if (
        !selectedProduct
    ) {

        return false;
    }


    // ---------------------------------------------------
    // Gewählte Version hinzufügen
    // ---------------------------------------------------

    mergeResult.products.push(
        structuredClone(
            selectedProduct
        )
    );


    // ---------------------------------------------------
    // Konflikt aus Konfliktliste entfernen
    // ---------------------------------------------------

    mergeResult.conflicts =
        mergeResult.conflicts.filter(
            item =>
                item.asin !== conflict.asin
        );


    return true;
}


// =======================================================
// Vollständig aufgelösten Merge lokal übernehmen
// =======================================================

function applyMergedProductsLocally(
    mergeResult
) {

    if (
        !mergeResult ||
        !Array.isArray(
            mergeResult.products
        )
    ) {

        console.error(
            "Merge-Ergebnis ist ungültig."
        );

        return false;
    }


    // ---------------------------------------------------
    // Offene Konflikte dürfen nicht mehr vorhanden sein
    // ---------------------------------------------------

    if (
        Array.isArray(
            mergeResult.conflicts
        ) &&
        mergeResult.conflicts.length > 0
    ) {

        console.warn(
            "Merge kann noch nicht übernommen werden. "
            + "Es bestehen noch ungelöste Konflikte."
        );

        return false;
    }


    // ---------------------------------------------------
    // Produktliste prüfen
    // ---------------------------------------------------

    const validation =
        validateProductList(
            mergeResult.products
        );


    if (!validation.valid) {

        console.error(
            "Zusammengeführte Produktliste ist ungültig:",
            validation.message
        );

        return false;
    }


    const duplicates =
        findDuplicateProductFields(
            mergeResult.products
        );


    if (
        duplicates.length > 0
    ) {

        console.error(
            "Zusammengeführte Produktliste enthält Dubletten:",
            duplicates
        );

        return false;
    }


    // ---------------------------------------------------
    // Lokal übernehmen
    // ---------------------------------------------------

    products =
        structuredClone(
            mergeResult.products
        );


    saveProductsToStorage();


    // ---------------------------------------------------
    // Produktliste ggf. aktualisieren
    // ---------------------------------------------------

    const productsDialog =
        document.getElementById(
            "productsDialog"
        );


    if (
        productsDialog &&
        productsDialog.open
    ) {

        renderProductList();
    }


    console.log(
        `${products.length} zusammengeführte Produktdaten wurden lokal übernommen.`
    );


    return true;
}

// =======================================================
// Offene lokale Änderungen mit Firestore abgleichen
// =======================================================

async function reconcilePendingProductChanges() {

    if (
        !hasPendingProductChanges() &&
        !hasLocalProductChangesComparedToBaseline()
    ) {

        console.log(
            "Keine ausstehenden lokalen Produktänderungen vorhanden."
        );

        return true;
    }


    if (
        !navigator.onLine ||
        typeof window.loadProductsFromFirestore !== "function"
    ) {

        console.log(
            "Produktabgleich derzeit nicht möglich."
        );

        return false;
    }


    try {

        // ---------------------------------------------------
        // Baseline prüfen
        // ---------------------------------------------------

        const baselineProducts =
            loadProductBaseline();


        if (
            !Array.isArray(
                baselineProducts
            )
        ) {

            console.warn(
                "Kein synchronisierter Ausgangsstand vorhanden."
            );

            return false;
        }


        // ---------------------------------------------------
        // Aktuellen Cloud-Stand laden
        // ---------------------------------------------------

        const cloudProducts =
            await window.loadProductsFromFirestore(
                true
            );


        if (
            !Array.isArray(
                cloudProducts
            ) ||
            cloudProducts.length === 0
        ) {

            console.warn(
                "Zentraler Produktstand konnte nicht geladen werden."
            );

            return false;
        }


        // ---------------------------------------------------
        // Sicheren Merge erzeugen
        // ---------------------------------------------------

        // ---------------------------------------------------
// Diagnose für Mehr-PC-Konflikte
// ---------------------------------------------------

console.log(
    "=== RECONCILE DIAGNOSE ==="
);


for (
    const localProduct of products
) {

    const asin =
        localProduct.asin;


    const baselineProduct =
        baselineProducts.find(
            product =>
                product.asin === asin
        );


    const cloudProduct =
        cloudProducts.find(
            product =>
                product.asin === asin
        );


    if (
        JSON.stringify(baselineProduct) !==
            JSON.stringify(localProduct)
        ||
        JSON.stringify(baselineProduct) !==
            JSON.stringify(cloudProduct)
    ) {

        console.log(
            "KONFLIKT-SNAPSHOT:",
            {
                asin: asin,

                baseline:
                    baselineProduct?.colourVariant ?? null,

                lokal:
                    localProduct?.colourVariant ?? null,

                cloud:
                    cloudProduct?.colourVariant ?? null
            }
        );
    }
}


console.log(
    "=========================="
);

        const mergeResult =
            buildMergedProductState(
                baselineProducts,
                products,
                cloudProducts
            );


        console.log({
            unveraendert:
                mergeResult.comparison.unchanged.length,

            lokalGeaendert:
                mergeResult.comparison.localChanged.length,

            cloudGeaendert:
                mergeResult.comparison.cloudChanged.length,

            konflikte:
                mergeResult.conflicts.length
        });


        // ---------------------------------------------------
        // Echter Konflikt vorhanden
        // ---------------------------------------------------

        if (
            mergeResult.conflicts.length > 0
        ) {

            console.log(
                `${mergeResult.conflicts.length} Produktkonflikt(e) gefunden.`
            );


            showProductConflictDialog(
                mergeResult.conflicts[0],
                mergeResult
            );


            return false;
        }


        // ---------------------------------------------------
        // Keine Konflikte:
        // Merge lokal übernehmen
        // ---------------------------------------------------

        const applied =
            applyMergedProductsLocally(
                mergeResult
            );


        if (!applied) {
            return false;
        }


        console.log(
            "Produktdaten wurden konfliktfrei zusammengeführt."
        );


        // ---------------------------------------------------
        // Konfliktfreien Merge vollständig synchronisieren
        // ---------------------------------------------------

        const finalized =
            await finalizeProductMerge(
                mergeResult
            );


        if (!finalized) {

            console.warn(
                "Der konfliktfrei zusammengeführte Produktstand "
                + "konnte noch nicht zentral gespeichert werden."
            );


            // Pending bleibt bestehen
            return false;
        }


        console.log(
            "Konfliktfreie Produktsynchronisation wurde vollständig abgeschlossen."
        );


        return true;

    }
    catch (error) {

        console.warn(
            "Produktabgleich konnte nicht durchgeführt werden.",
            error
        );


        return false;
    }
}


window.reconcilePendingProductChanges =
    reconcilePendingProductChanges;

    
// =======================================================
// Prüfen, ob lokale Produktänderungen vorhanden sind
// =======================================================

function hasLocalProductChangesComparedToBaseline() {

    const baseline =
        loadProductBaseline();


    // Ohne Baseline können wir keinen sicheren
    // Vergleich durchführen.
    if (
        !Array.isArray(baseline)
    ) {

        return hasPendingProductChanges();
    }


    const comparison =
        compareProductStates(
            baseline,
            products,
            baseline
        );


    return (
        comparison.localChanged.length > 0 ||
        comparison.conflicts.length > 0
    );
}

window.hasLocalProductChangesComparedToBaseline =
    hasLocalProductChangesComparedToBaseline;

// =======================================================
// Unterschiede zwischen zwei Produkten ermitteln
// =======================================================

function getProductDifferences(
    localProduct,
    cloudProduct
) {

    const fieldNames = {
        productName: "Produktname",
        colourVariant: "Farbvariante",
        manufacturerCode: "Herstellercode",
        ean: "EAN",
        sku: "SKU",
        pack: "Pack",
        asin: "ASIN"
    };


    const differences = [];


    for (
        const field of Object.keys(
            fieldNames
        )
    ) {

        const localValue =
            localProduct?.[field] ?? "";


        const cloudValue =
            cloudProduct?.[field] ?? "";


        if (
            localValue !== cloudValue
        ) {

            differences.push({
                field,
                label:
                    fieldNames[field],

                localValue,
                cloudValue
            });
        }
    }


    return differences;
}

// =======================================================
// Produktkonflikt anzeigen
// =======================================================
let currentProductConflict = null;
let currentProductMergeResult = null;

function showProductConflictDialog(
    conflict,
    mergeResult
) {

    if (
        !conflict ||
        !mergeResult
    ) {
        return;
    }


    currentProductConflict =
        conflict;


    currentProductMergeResult =
        mergeResult;


    const dialog =
        document.getElementById(
            "productConflictDialog"
        );


    const asinElement =
        document.getElementById(
            "productConflictAsin"
        );


    const differencesElement =
        document.getElementById(
            "productConflictDifferences"
        );


    const differences =
        getProductDifferences(
            conflict.localProduct,
            conflict.cloudProduct
        );


    asinElement.textContent =
        conflict.asin ?? "-";


    differencesElement.innerHTML = "";


    for (
        const difference of differences
    ) {

        const field =
            document.createElement(
                "div"
            );


        field.className =
            "product-conflict-field";


        field.innerHTML = `
            <div class="product-conflict-field-title">
                ${difference.label}
            </div>

            <div class="product-conflict-columns">

                <div class="product-conflict-column">

                    <span class="product-conflict-column-label">
                        DIESER RECHNER
                    </span>

                    <div class="product-conflict-value"></div>

                </div>

                <div class="product-conflict-column">

                    <span class="product-conflict-column-label">
                        ZENTRALER STAND
                    </span>

                    <div class="product-conflict-value"></div>

                </div>

            </div>
        `;


        const valueElements =
            field.querySelectorAll(
                ".product-conflict-value"
            );


        valueElements[0].textContent =
            difference.localValue || "(leer)";


        valueElements[1].textContent =
            difference.cloudValue || "(leer)";


        differencesElement.appendChild(
            field
        );
    }


    dialog.showModal();
}

// =======================================================
// Verständliche Import-Diagnose erzeugen
// =======================================================

function buildImportDiagnosis(
    filename,
    parsed,
    resolution
) {

    // ---------------------------------------------------
    // SKU/EAN-Konflikt
    // ---------------------------------------------------

    if (
        resolution.status === "SKU/EAN-Konflikt" &&
        resolution.conflictDetails
    ) {

        const skuProduct =
            resolution
                .conflictDetails
                .skuProduct;


        const eanProduct =
            resolution
                .conflictDetails
                .eanProduct;


        return (
            `SKU ${parsed.sku} gehört laut Stammdaten zu `
            + `${skuProduct.productName} / ${skuProduct.colourVariant} `
            + `(ASIN ${skuProduct.asin}). `
            + `EAN ${parsed.ean} gehört dagegen zu `
            + `${eanProduct.productName} / ${eanProduct.colourVariant} `
            + `(ASIN ${eanProduct.asin}). `
            + `Die Datei wurde deshalb nicht importiert.`
        );
    }


    // ---------------------------------------------------
    // Dateiname konnte nicht interpretiert werden
    // ---------------------------------------------------

    if (
        !parsed.sku &&
        !parsed.amazonEan
    ) {

        return (
            `Der Dateiname „${filename}“ entspricht nicht dem erwarteten `
            + `Amazon-Dateiformat. SKU und EAN konnten nicht erkannt werden. `
            + `Bitte prüfe den Dateinamen.`
        );
    }


    // ---------------------------------------------------
    // SKU erkannt, Amazon-EAN jedoch ungültig
    // ---------------------------------------------------

    if (
        parsed.sku &&
        parsed.amazonEan &&
        !parsed.ean
    ) {

        return (
            `Die SKU ${parsed.sku} wurde erkannt. `
            + `Die Amazon-EAN ${parsed.amazonEan} konnte jedoch nicht `
            + `in eine gültige 13-stellige EAN umgewandelt werden. `
            + `Bitte prüfe den Dateinamen.`
        );
    }


    // ---------------------------------------------------
    // SKU und EAN erkannt,
    // aber kein Produkt in den Stammdaten gefunden
    // ---------------------------------------------------

    if (
        parsed.sku &&
        parsed.ean
    ) {

        return (
            `SKU ${parsed.sku} und EAN ${parsed.ean} wurden im Dateinamen erkannt, `
            + `sind aber in den Produktstammdaten nicht vorhanden. `
            + `Bitte prüfe die Produktliste unter „Daten → Produktliste“.`
        );
    }


    // ---------------------------------------------------
    // Nur SKU vorhanden
    // ---------------------------------------------------

    if (
        parsed.sku &&
        !parsed.ean
    ) {

        return (
            `Die SKU ${parsed.sku} wurde erkannt, konnte aber keinem `
            + `Produkt in den Stammdaten zugeordnet werden.`
        );
    }


    // ---------------------------------------------------
    // Nur EAN vorhanden
    // ---------------------------------------------------

    if (
        !parsed.sku &&
        parsed.ean
    ) {

        return (
            `Die EAN ${parsed.ean} wurde erkannt, konnte aber keinem `
            + `Produkt in den Stammdaten zugeordnet werden.`
        );
    }


    // ---------------------------------------------------
    // Sicherheits-Fallback
    // ---------------------------------------------------

    return (
        "Die Datei konnte keinem Produkt zugeordnet werden. "
        + "Bitte prüfe Dateiname und Produktstammdaten."
    );
}

// =======================================================
// CSV-Datei lesen
// =======================================================

// =======================================================
// CSV-Datei lesen
// =======================================================

async function readTcodesFromFile(file) {

    const text =
        await file.text();


    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
}


// =======================================================
// Count formatieren
// =======================================================

function formatCountNumber(number) {

    return String(number)
        .padStart(
            COUNT_WIDTH,
            "0"
        );
}


// =======================================================
// Tabellenzelle erzeugen
// =======================================================

function addCell(row, value) {

    const cell =
        document.createElement("td");


    cell.textContent =
        value ?? "";


    row.appendChild(cell);
}


// =======================================================
// Kontrollzeile für erkannte Datei erzeugen
// =======================================================

function addControlRow(
    file,
    parsed,
    resolution,
    tcodeCount
) {

    const resultBody =
        document.getElementById(
            "resultBody"
        );


    const row =
        document.createElement("tr");


    addCell(
        row,
        file.name
    );

    addCell(
        row,
        parsed.sku ?? "Nicht erkannt"
    );

    addCell(
        row,
        parsed.amazonEan ?? "Nicht erkannt"
    );

    addCell(
        row,
        parsed.ean ?? "Nicht erkannt"
    );

    addCell(
        row,
        resolution.product?.asin ?? "Nicht gefunden"
    );

    addCell(
        row,
        tcodeCount
    );


    // ---------------------------------------------------
    // Statusanzeige
    // ---------------------------------------------------

    const statusCell =
        document.createElement("td");


    const badge =
        document.createElement("span");


    badge.classList.add(
        "status-badge"
    );


    if (
        resolution.status === "OK"
    ) {

        row.classList.add(
            "status-ok"
        );


        badge.classList.add(
            "ok"
        );


        badge.textContent =
            resolution.method === "SKU + EAN"
                ? "OK"
                : `OK (${resolution.method})`;

    }
    else if (
        resolution.status === "SKU/EAN-Konflikt"
    ) {

        row.classList.add(
            "status-warning"
        );


        badge.classList.add(
            "warning"
        );


        badge.textContent =
            "SKU/EAN-Konflikt";

    }
    else {

        row.classList.add(
            "status-error"
        );


        badge.classList.add(
            "error"
        );


        badge.textContent =
            "Nicht gefunden";
    }


    statusCell.appendChild(
        badge
    );


    row.appendChild(
        statusCell
    );


    resultBody.appendChild(
        row
    );
}


// =======================================================
// Output-Zeile erzeugen
// =======================================================

function addOutputRow(
    product,
    tcode,
    current,
    total
) {

    const outputBody =
        document.getElementById(
            "outputBody"
        );


    const row =
        document.createElement("tr");


    const count =
        formatCountNumber(current)
        + COUNT_SEPARATOR
        + formatCountNumber(total);


    addCell(
        row,
        product.productName
    );

    addCell(
        row,
        product.colourVariant
    );

    addCell(
        row,
        product.manufacturerCode
    );

    addCell(
        row,
        product.ean
    );

    addCell(
        row,
        product.sku
    );

    addCell(
        row,
        product.pack
    );

    addCell(
        row,
        tcode
    );

    addCell(
        row,
        product.asin
    );

    addCell(
        row,
        count
    );


    outputBody.appendChild(
        row
    );


    exportOutputRows.push({
        product: product.productName,
        colourVariant: product.colourVariant,
        manufacturerCode: product.manufacturerCode,
        ean: product.ean,
        sku: product.sku,
        pack: product.pack,
        tcode,
        asin: product.asin,
        count,
        isEndRow: false
    });
}


// =======================================================
// END-Zeile erzeugen
// =======================================================

function addEndRow(
    product,
    total
) {

    const outputBody =
        document.getElementById(
            "outputBody"
        );


    const row =
        document.createElement("tr");


    row.style.fontWeight =
        "bold";

    row.style.backgroundColor =
        "#dddddd";


    addCell(row, "");
    addCell(
        row,
        `${product.colourVariant} END`
    );
    addCell(row, "");
    addCell(row, "");
    addCell(row, "");
    addCell(row, total);
    addCell(row, "");
    addCell(row, "");
    addCell(row, "");


    outputBody.appendChild(
        row
    );


    exportOutputRows.push({
        product: "",
        colourVariant:
            `${product.colourVariant} END`,
        manufacturerCode: "",
        ean: "",
        sku: "",
        pack: total,
        tcode: "",
        asin: "",
        count: "",
        isEndRow: true
    });
}


// =======================================================
// Problemzeile im Summary erzeugen
// =======================================================

function addSummaryProblemRow(
    filename,
    sku,
    ean,
    status,
    diagnosis
) {

    const summaryBody =
        document.getElementById(
            "summaryBody"
        );


    const row =
        document.createElement("tr");


    addCell(
        row,
        filename
    );

    addCell(
        row,
        sku ?? ""
    );

    addCell(
        row,
        ean ?? ""
    );

    addCell(
        row,
        status
    );

    addCell(
        row,
        diagnosis ?? ""
    );


    summaryBody.appendChild(
        row
    );
}


// =======================================================
// Summary anzeigen
// =======================================================

function renderSummary(stats) {

    const summaryStats =
        document.getElementById(
            "summaryStats"
        );


    summaryStats.innerHTML = "";


    const lines = [
        [
            "Ausgewählte CSV-Dateien",
            stats.selectedFiles
        ],
        [
            "Dateien erfolgreich zugeordnet",
            stats.resolvedFiles
        ],
        [
            "Davon über SKU + EAN zugeordnet",
            stats.resolvedByBoth
        ],
        [
            "Davon nur über SKU zugeordnet",
            stats.resolvedBySku
        ],
        [
            "Davon nur über EAN zugeordnet",
            stats.resolvedByEan
        ],
        [
            "Dateien nicht gefunden",
            stats.notFound
        ],
        [
            "Dateien mit SKU/EAN-Konflikt",
            stats.conflicts
        ],
        [
            "Importierte T-Codes",
            stats.importedTcodes
        ],
        [
            "Dateien ohne T-Codes",
            stats.emptyFiles
        ]
    ];


    const table =
        document.createElement("table");


    table.border = "1";
    table.cellPadding = "8";


    for (
        const [label, value]
        of lines
    ) {

        const row =
            document.createElement("tr");


        addCell(
            row,
            label
        );

        addCell(
            row,
            value
        );


        table.appendChild(
            row
        );
    }


    summaryStats.appendChild(
        table
    );
}


// =======================================================
// Zentrale Dateiverarbeitung
//
// Diese Funktion wird sowohl vom normalen Dateidialog
// als auch von Drag & Drop verwendet.
// =======================================================

async function processFiles(files) {

    files =
        Array.from(files);


    // Nur CSV-Dateien zulassen
    files = files.filter(file =>
        file.name.toLowerCase().endsWith(".csv")
    );


    if (files.length === 0) {

        alert(
            "Bitte mindestens eine CSV-Datei auswählen."
        );

        return;
    }


    // Ergebnisbereiche anzeigen
    document
        .querySelectorAll(".result-section")
        .forEach(section => {

            section.classList.add("visible");

        });


    const resultBody =
        document.getElementById("resultBody");

    const outputBody =
        document.getElementById("outputBody");

    const summaryBody =
        document.getElementById("summaryBody");

    const exportButton =
        document.getElementById("exportButton");


    // Alte Ergebnisse löschen
    resultBody.innerHTML = "";
    outputBody.innerHTML = "";
    summaryBody.innerHTML = "";

    exportOutputRows = [];
    exportSummary = null;

    exportButton.disabled = true;


    // ---------------------------------------------------
    // Statistik
    // ---------------------------------------------------

    const stats = {
        selectedFiles: files.length,
        resolvedFiles: 0,
        resolvedByBoth: 0,
        resolvedBySku: 0,
        resolvedByEan: 0,
        notFound: 0,
        conflicts: 0,
        emptyFiles: 0,
        importedTcodes: 0
    };


    // ---------------------------------------------------
    // Problemdateien
    // ---------------------------------------------------

    const summaryProblems = [];


    // ---------------------------------------------------
    // Erfolgreiche Dateien
    // ---------------------------------------------------

    const importedFiles = [];


    // ---------------------------------------------------
    // Dateien analysieren
    // ---------------------------------------------------

    for (const file of files) {

        const parsed =
            parseAmazonFilename(file.name);


        const resolution =
            resolveProduct(
                parsed.sku,
                parsed.ean
            );


        const tcodes =
            await readTcodesFromFile(file);


        // ------------------------------------------------
        // Datei enthält keine T-Codes
        // ------------------------------------------------

        if (tcodes.length === 0) {

            stats.emptyFiles++;


            const diagnosis =
                `Die Datei „${file.name}“ enthält keine T-Codes. `
                + `Sie wurde deshalb nicht importiert.`;


            summaryProblems.push({
                filename: file.name,
                sku: parsed.sku ?? "",
                ean: parsed.ean ?? "",
                status: "Keine T-Codes",
                diagnosis
            });


            addSummaryProblemRow(
                file.name,
                parsed.sku,
                parsed.ean,
                "Keine T-Codes",
                diagnosis
            );


            continue;
        }


        // ------------------------------------------------
        // Kontrolltabelle
        // ------------------------------------------------

        addControlRow(
            file,
            parsed,
            resolution,
            tcodes.length
        );


        // ------------------------------------------------
        // SKU/EAN-Konflikt
        // ------------------------------------------------

        if (
            resolution.status === "SKU/EAN-Konflikt"
        ) {

            stats.conflicts++;


            const diagnosis =
                buildImportDiagnosis(
                    file.name,
                    parsed,
                    resolution
                );


            summaryProblems.push({
                filename: file.name,
                sku: parsed.sku ?? "",
                ean: parsed.ean ?? "",
                status: resolution.status,
                diagnosis
            });


            addSummaryProblemRow(
                file.name,
                parsed.sku,
                parsed.ean,
                resolution.status,
                diagnosis
            );


            continue;
        }


        // ------------------------------------------------
        // Produkt nicht gefunden
        // ------------------------------------------------

        if (!resolution.product) {

            stats.notFound++;


            const diagnosis =
                buildImportDiagnosis(
                    file.name,
                    parsed,
                    resolution
                );


            summaryProblems.push({
                filename: file.name,
                sku: parsed.sku ?? "",
                ean: parsed.ean ?? "",
                status: resolution.status,
                diagnosis
            });


            addSummaryProblemRow(
                file.name,
                parsed.sku,
                parsed.ean,
                resolution.status,
                diagnosis
            );


            continue;
        }


        // ------------------------------------------------
        // Erfolgreich zugeordnet
        // ------------------------------------------------

        stats.resolvedFiles++;


        if (
            resolution.method === "SKU + EAN"
        ) {

            stats.resolvedByBoth++;

        }
        else if (
            resolution.method === "SKU"
        ) {

            stats.resolvedBySku++;

        }
        else if (
            resolution.method === "EAN"
        ) {

            stats.resolvedByEan++;

        }


        stats.importedTcodes +=
            tcodes.length;


        importedFiles.push({
            file,
            parsed,
            product: resolution.product,
            resolutionMethod: resolution.method,
            tcodes
        });
    }


    // ---------------------------------------------------
    // Nach ASIN sortieren
    // ---------------------------------------------------

    importedFiles.sort(
        (a, b) =>
            a.product.asin.localeCompare(
                b.product.asin
            )
    );


    // ---------------------------------------------------
    // Gesamtzahl pro ASIN
    // ---------------------------------------------------

    const totalPerAsin =
        new Map();


    for (const item of importedFiles) {

        const asin =
            item.product.asin;

        const previous =
            totalPerAsin.get(asin) ?? 0;


        totalPerAsin.set(
            asin,
            previous + item.tcodes.length
        );
    }


    // ---------------------------------------------------
    // Laufender Zähler
    // ---------------------------------------------------

    const currentPerAsin =
        new Map();

    let previousProduct = null;


    // ---------------------------------------------------
    // Output erzeugen
    // ---------------------------------------------------

    for (const item of importedFiles) {

        const product =
            item.product;

        const asin =
            product.asin;


        // ASIN-Wechsel -> END-Zeile
        if (
            previousProduct &&
            previousProduct.asin !== asin
        ) {

            const previousTotal =
                totalPerAsin.get(
                    previousProduct.asin
                ) ?? 0;


            addEndRow(
                previousProduct,
                previousTotal
            );
        }


        const total =
            totalPerAsin.get(asin) ?? 0;


        if (
            !currentPerAsin.has(asin)
        ) {

            currentPerAsin.set(
                asin,
                0
            );
        }


        for (const tcode of item.tcodes) {

            let current =
                currentPerAsin.get(asin) ?? 0;


            current++;


            currentPerAsin.set(
                asin,
                current
            );


            addOutputRow(
                product,
                tcode,
                current,
                total
            );
        }


        previousProduct =
            product;
    }


    // ---------------------------------------------------
    // Letzte END-Zeile
    // ---------------------------------------------------

    if (previousProduct) {

        const total =
            totalPerAsin.get(
                previousProduct.asin
            ) ?? 0;


        addEndRow(
            previousProduct,
            total
        );
    }


    // ---------------------------------------------------
    // Summary anzeigen
    // ---------------------------------------------------

    renderSummary(stats);

    renderImportStatus(stats);

    compactImportArea(
        stats.selectedFiles
    );


    // ---------------------------------------------------
    // Keine Problemdateien
    // ---------------------------------------------------

    if (
        stats.notFound === 0 &&
        stats.conflicts === 0 &&
        stats.emptyFiles === 0
    ) {

        const row =
            document.createElement("tr");


        addCell(
            row,
            "Keine nicht zugeordneten oder fehlerhaften Dateien."
        );

        addCell(row, "");
        addCell(row, "");
        addCell(row, "OK");
        addCell(row, "");


        summaryBody.appendChild(row);
    }


    // ---------------------------------------------------
    // Summary für Excel speichern
    // ---------------------------------------------------

    exportSummary = {
        stats: { ...stats },
        problems: summaryProblems
    };


    // Export aktivieren
    exportButton.disabled =
        exportOutputRows.length === 0;


    console.log(
        "Importierte Dateien:",
        importedFiles
    );

    console.log(
        "Summary:",
        stats
    );
}


// =======================================================
// Normaler Dateidialog
// =======================================================

async function handleFiles(event) {

    await processFiles(
        event.target.files
    );
}


// =======================================================
// Excel-Export
// =======================================================

function exportToExcel() {

    if (
        exportOutputRows.length === 0 ||
        !exportSummary
    ) {

        alert(
            "Es sind noch keine Importdaten vorhanden."
        );

        return;
    }


    const workbook =
        XLSX.utils.book_new();


    // ===================================================
    // OUTPUT
    // ===================================================

    const outputData = [
        [
            "Product",
            "Colour Variant",
            "Manufacturer Code",
            "EAN (Barcode)",
            "SKU",
            "Pack",
            "T-Code",
            "ASIN",
            "Count"
        ]
    ];


    for (const item of exportOutputRows) {

        outputData.push([
            item.product,
            item.colourVariant,
            item.manufacturerCode,
            item.ean,
            item.sku,
            item.pack,
            item.tcode,
            item.asin,
            item.count
        ]);
    }


    const outputSheet =
        XLSX.utils.aoa_to_sheet(
            outputData
        );


    // ---------------------------------------------------
    // Spaltenbreiten
    // ---------------------------------------------------

    outputSheet["!cols"] = [
        { wch: 24 },
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 12 },
        { wch: 10 },
        { wch: 38 },
        { wch: 16 },
        { wch: 14 }
    ];


    // ---------------------------------------------------
    // EAN und Count als Text formatieren
    // ---------------------------------------------------

    for (
        let row = 1;
        row < outputData.length;
        row++
    ) {

        const eanAddress =
            XLSX.utils.encode_cell({
                r: row,
                c: 3
            });


        const eanCell =
            outputSheet[eanAddress];


        if (eanCell) {

            eanCell.t = "s";

            eanCell.v =
                String(
                    eanCell.v ?? ""
                );
        }


        const countAddress =
            XLSX.utils.encode_cell({
                r: row,
                c: 8
            });


        const countCell =
            outputSheet[countAddress];


        if (countCell) {

            countCell.t = "s";

            countCell.v =
                String(
                    countCell.v ?? ""
                );
        }
    }


    XLSX.utils.book_append_sheet(
        workbook,
        outputSheet,
        "Output"
    );


    // ===================================================
    // SUMMARY
    // ===================================================

    const stats =
        exportSummary.stats;


    const summaryData = [
        [
            "Import-Zusammenfassung",
            ""
        ],
        [
            "",
            ""
        ],
        [
            "Ausgewählte Dateien",
            stats.selectedFiles
        ],
        [
            "Erfolgreich zugeordnet",
            stats.resolvedFiles
        ],
        [
            "Zuordnung über SKU + EAN",
            stats.resolvedByBoth
        ],
        [
            "Zuordnung nur über SKU",
            stats.resolvedBySku
        ],
        [
            "Zuordnung nur über EAN",
            stats.resolvedByEan
        ],
        [
            "Nicht gefunden",
            stats.notFound
        ],
        [
            "SKU/EAN-Konflikte",
            stats.conflicts
        ],
        [
            "Dateien ohne T-Codes",
            stats.emptyFiles
        ],
        [
            "Importierte T-Codes",
            stats.importedTcodes
        ],
        [
            "",
            ""
        ],
        [
            "Dateiname",
            "SKU",
            "EAN",
            "Status",
            "Diagnose"
        ]
    ];


    // ---------------------------------------------------
    // Problemdateien
    // ---------------------------------------------------

    if (
        exportSummary.problems.length === 0
    ) {

        summaryData.push([
            "Keine nicht zugeordneten oder fehlerhaften Dateien.",
            "",
            "",
            "OK",
            ""
        ]);

    }
    else {

        for (
            const problem
            of exportSummary.problems
        ) {

            summaryData.push([
                problem.filename,
                problem.sku,
                problem.ean,
                problem.status,
                problem.diagnosis
            ]);
        }
    }


    const summarySheet =
        XLSX.utils.aoa_to_sheet(
            summaryData
        );


    // ---------------------------------------------------
    // Spaltenbreiten
    // ---------------------------------------------------

    summarySheet["!cols"] = [
        { wch: 62 },
        { wch: 14 },
        { wch: 18 },
        { wch: 24 },
        { wch: 90 }
    ];


    XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
    );


    // ===================================================
    // Dateiname erzeugen
    // ===================================================

    const now =
        new Date();


    const pad =
        number =>
            String(number)
                .padStart(
                    2,
                    "0"
                );


    const filename =
        "Amazon_Output_"
        + now.getFullYear()
        + pad(now.getMonth() + 1)
        + pad(now.getDate())
        + "_"
        + pad(now.getHours())
        + pad(now.getMinutes())
        + pad(now.getSeconds())
        + ".xlsx";


    // ===================================================
    // Excel-Datei herunterladen
    // ===================================================

    XLSX.writeFile(
        workbook,
        filename,
        {
            bookType: "xlsx"
        }
    );
}


function resetApplication() {

    // Dateiauswahl zurücksetzen
    const fileInput =
        document.getElementById("fileInput");

    fileInput.value = "";


    // Tabellen leeren
    document.getElementById("resultBody").innerHTML = "";
    document.getElementById("outputBody").innerHTML = "";
    document.getElementById("summaryBody").innerHTML = "";
    document.getElementById("summaryStats").innerHTML = "";


    // Exportdaten löschen
    exportOutputRows = [];
    exportSummary = null;


    // Excel-Button deaktivieren
    document.getElementById(
        "exportButton"
    ).disabled = true;


    // Ergebnisbereiche wieder ausblenden
    document
        .querySelectorAll(".result-section")
        .forEach(section => {

            section.classList.remove(
                "visible"
            );

        });

    const importStatusBar =
    document.getElementById("importStatusBar");

    importStatusBar.innerHTML = "";

    importStatusBar.classList.remove(
        "visible",
        "success",
        "warning"
    );

    // Importbereich wieder vollständig anzeigen
        const dropZone =
            document.getElementById("dropZone");

        const completedInfo =
            document.getElementById(
                "importCompletedInfo"
            );


        dropZone.classList.remove(
            "compact"
        );

        completedInfo.textContent = "";
}

// =======================================================
// Produktliste anzeigen
// =======================================================

function renderProductList(filterText = "") {

    const productBody =
        document.getElementById(
            "productBody"
        );

    const productCount =
        document.getElementById(
            "productCount"
        );

    const productEdit =
        document.getElementById(
            "productEdit"
        );

    const productDelete =
        document.getElementById(
            "productDelete"
        );


    // ---------------------------------------------------
    // Aktuelle Anzeige und Auswahl zurücksetzen
    // ---------------------------------------------------

    productBody.innerHTML = "";

    selectedProductIndex = null;

    productEdit.disabled = true;
    productDelete.disabled = true;


    // ---------------------------------------------------
    // Suchbegriff vorbereiten
    // ---------------------------------------------------

    const search =
        filterText
            .trim()
            .toLowerCase();


    // ---------------------------------------------------
    // Produktliste filtern
    //
    // Der ursprüngliche Index wird mitgeführt,
    // damit Bearbeiten und Löschen weiterhin auf das
    // richtige Produkt in "products" zugreifen.
    // ---------------------------------------------------

    const filteredProducts =
        products
            .map((product, index) => ({
                product,
                index
            }))
            .filter(item => {

                if (!search) {
                    return true;
                }


                const product =
                    item.product;


                return (
                    product.productName
                        .toLowerCase()
                        .includes(search)
                    ||
                    product.colourVariant
                        .toLowerCase()
                        .includes(search)
                    ||
                    product.manufacturerCode
                        .toLowerCase()
                        .includes(search)
                    ||
                    product.ean
                        .toLowerCase()
                        .includes(search)
                    ||
                    product.sku
                        .toLowerCase()
                        .includes(search)
                    ||
                    product.pack
                        .toLowerCase()
                        .includes(search)
                    ||
                    product.asin
                        .toLowerCase()
                        .includes(search)
                );
            });


    // ---------------------------------------------------
    // Tabellenzeilen erzeugen
    // ---------------------------------------------------

    for (const item of filteredProducts) {

        const product =
            item.product;


        const row =
            document.createElement("tr");


        addCell(
            row,
            product.productName
        );

        addCell(
            row,
            product.colourVariant
        );

        addCell(
            row,
            product.manufacturerCode
        );

        addCell(
            row,
            product.ean
        );

        addCell(
            row,
            product.sku
        );

        addCell(
            row,
            product.pack
        );

        addCell(
            row,
            product.asin
        );


        // -----------------------------------------------
        // Produkt auswählen
        // -----------------------------------------------

        row.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        "#productBody tr"
                    )
                    .forEach(productRow => {

                        productRow.classList.remove(
                            "selected"
                        );
                    });


                row.classList.add(
                    "selected"
                );


                selectedProductIndex =
                    item.index;


                productEdit.disabled = false;
                productDelete.disabled = false;
            }
        );


        productBody.appendChild(
            row
        );

        // -----------------------------------------------
        // Produkt per Doppelklick bearbeiten
        // -----------------------------------------------

        row.addEventListener(
            "dblclick",
            () => {

                selectedProductIndex =
                    item.index;


                openEditProduct();
            }
        );
    }


    // ---------------------------------------------------
    // Anzahl anzeigen
    // ---------------------------------------------------

    productCount.textContent =
        `${filteredProducts.length} von ${products.length} Produkten`;
}


// =======================================================
// Produktdialog öffnen
// =======================================================

function openProductList() {

    const productsDialog =
        document.getElementById(
            "productsDialog"
        );

    const productSearch =
        document.getElementById(
            "productSearch"
        );


    // ---------------------------------------------------
    // Produktliste vorbereiten
    // ---------------------------------------------------

    productSearch.value = "";

    renderProductList();


    // ---------------------------------------------------
    // Dialog öffnen und Suche aktivieren
    // ---------------------------------------------------

    productsDialog.showModal();

    productSearch.focus();
}

function clearProductForm() {

    document.getElementById(
        "editProductName"
    ).value = "";

    document.getElementById(
        "editColourVariant"
    ).value = "";

    document.getElementById(
        "editManufacturerCode"
    ).value = "";

    document.getElementById(
        "editEan"
    ).value = "";

    document.getElementById(
        "editSku"
    ).value = "";

    document.getElementById(
        "editPack"
    ).value = "";

    document.getElementById(
        "editAsin"
    ).value = "";
}


function fillProductForm(product) {

    document.getElementById(
        "editProductName"
    ).value =
        product.productName;


    document.getElementById(
        "editColourVariant"
    ).value =
        product.colourVariant;


    document.getElementById(
        "editManufacturerCode"
    ).value =
        product.manufacturerCode;


    document.getElementById(
        "editEan"
    ).value =
        product.ean;


    document.getElementById(
        "editSku"
    ).value =
        product.sku;


    document.getElementById(
        "editPack"
    ).value =
        product.pack;


    document.getElementById(
        "editAsin"
    ).value =
        product.asin;
}


function openNewProduct() {

    editProductIndex = null;


    document.getElementById(
        "productEditTitle"
    ).textContent =
        "Neues Produkt";


    clearProductForm();


    document.getElementById(
        "productEditDialog"
    ).showModal();
}


function openEditProduct() {

    if (
        selectedProductIndex === null
    ) {
        return;
    }


    editProductIndex =
        selectedProductIndex;


    const product =
        products[editProductIndex];


    document.getElementById(
        "productEditTitle"
    ).textContent =
        "Produkt bearbeiten";


    fillProductForm(
        product
    );


    document.getElementById(
        "productEditDialog"
    ).showModal();
}

// =======================================================
// Dublettenprüfung für Produktliste
// =======================================================

function findDuplicateProductFields(productList) {

    const duplicates = [];

    const fieldsToCheck = [
        {
            key: "asin",
            label: "ASIN"
        },
        {
            key: "sku",
            label: "SKU"
        },
        {
            key: "ean",
            label: "EAN"
        }
    ];


    for (const field of fieldsToCheck) {

        const seen =
            new Map();


        productList.forEach(
            (product, index) => {

                const value =
                    String(
                        product[field.key] ?? ""
                    )
                        .trim()
                        .toUpperCase();


                if (!value) {
                    return;
                }


                if (
                    seen.has(value)
                ) {

                    duplicates.push({
                        field: field.label,
                        value,
                        firstIndex:
                            seen.get(value),
                        secondIndex:
                            index
                    });

                }
                else {

                    seen.set(
                        value,
                        index
                    );
                }
            }
        );
    }


    return duplicates;
}


// =======================================================
// Formularvalidierung
// =======================================================

function clearProductValidation() {

    document
        .querySelectorAll(
            ".product-form input"
        )
        .forEach(input => {

            input.classList.remove(
                "invalid"
            );
        });
}


function markInvalid(inputId) {

    const input =
        document.getElementById(
            inputId
        );


    input.classList.add(
        "invalid"
    );


    input.focus();
}
// =======================================================
// EAN-13 Prüfziffer validieren
// =======================================================

function isValidEan13(ean) {

    // ---------------------------------------------------
    // EAN muss genau 13 Ziffern enthalten
    // ---------------------------------------------------

    if (
        !/^\d{13}$/.test(ean)
    ) {
        return false;
    }


    let sum = 0;


    // ---------------------------------------------------
    // Prüfsumme aus den ersten 12 Ziffern berechnen
    //
    // Position 1, 3, 5, ...  -> Faktor 1
    // Position 2, 4, 6, ...  -> Faktor 3
    // ---------------------------------------------------

    for (
        let index = 0;
        index < 12;
        index++
    ) {

        const digit =
            Number(
                ean[index]
            );


        const factor =
            index % 2 === 0
                ? 1
                : 3;


        sum +=
            digit * factor;
    }


    // ---------------------------------------------------
    // Erwartete Prüfziffer berechnen
    // ---------------------------------------------------

    const checkDigit =
        (10 - (sum % 10)) % 10;


    return (
        checkDigit ===
        Number(ean[12])
    );
}

function validateProductForm(product) {

    clearProductValidation();


    // ---------------------------------------------------
    // Produktname
    // ---------------------------------------------------

    if (!product.productName) {

        markInvalid(
            "editProductName"
        );

        alert(
            "Bitte einen Produktnamen eintragen."
        );

        return false;
    }


    // ---------------------------------------------------
    // Colour Variant
    // ---------------------------------------------------

    if (!product.colourVariant) {

        markInvalid(
            "editColourVariant"
        );

        alert(
            "Bitte eine Colour Variant eintragen."
        );

        return false;
    }


    // ---------------------------------------------------
    // Manufacturer Code
    // ---------------------------------------------------

    if (!product.manufacturerCode) {

        markInvalid(
            "editManufacturerCode"
        );

        alert(
            "Bitte einen Manufacturer Code eintragen."
        );

        return false;
    }


    // ---------------------------------------------------
    // EAN: Format
    // ---------------------------------------------------

    if (
        !/^\d{13}$/.test(
            product.ean
        )
    ) {

        markInvalid(
            "editEan"
        );

        alert(
            "Die EAN muss genau 13 Ziffern enthalten."
        );

        return false;
    }


    // ---------------------------------------------------
    // EAN: Prüfziffer
    // ---------------------------------------------------

    if (
        !isValidEan13(
            product.ean
        )
    ) {

        markInvalid(
            "editEan"
        );

        alert(
            "Die EAN ist ungültig.\n\n"
            + "Die Prüfziffer stimmt nicht."
        );

        return false;
    }


    // ---------------------------------------------------
    // SKU
    // ---------------------------------------------------

    if (
        !/^\d+$/.test(
            product.sku
        )
    ) {

        markInvalid(
            "editSku"
        );

        alert(
            "Die SKU darf nur aus Ziffern bestehen."
        );

        return false;
    }


    // ---------------------------------------------------
    // Pack
    // ---------------------------------------------------

    if (!product.pack) {

        markInvalid(
            "editPack"
        );

        alert(
            "Bitte Pack eintragen."
        );

        return false;
    }


    // ---------------------------------------------------
    // ASIN
    // ---------------------------------------------------

    if (
        !/^[A-Z0-9]{10}$/.test(
            product.asin
        )
    ) {

        markInvalid(
            "editAsin"
        );

        alert(
            "Die ASIN muss genau 10 Zeichen enthalten "
            + "und darf nur aus Buchstaben und Ziffern bestehen."
        );

        return false;
    }


    return true;
}

async function saveProductFromForm() {

    const product = {

        productName:
            document.getElementById(
                "editProductName"
            )
                .value
                .trim(),

        colourVariant:
            document.getElementById(
                "editColourVariant"
            )
                .value
                .trim(),

        manufacturerCode:
            document.getElementById(
                "editManufacturerCode"
            )
                .value
                .trim(),

        ean:
            document.getElementById(
                "editEan"
            )
                .value
                .trim(),

        sku:
            document.getElementById(
                "editSku"
            )
                .value
                .trim(),

        pack:
            document.getElementById(
                "editPack"
            )
                .value
                .trim(),

        asin:
            document.getElementById(
                "editAsin"
            )
                .value
                .trim()
                .toUpperCase()
    };


    // ---------------------------------------------------
    // Formulardaten prüfen
    // ---------------------------------------------------

    if (
        !validateProductForm(
            product
        )
    ) {
        return;
    }


    // ---------------------------------------------------
    // Temporäre Produktliste für Dublettenprüfung
    // ---------------------------------------------------

    const testProducts =
        structuredClone(
            products
        );


    if (
        editProductIndex === null
    ) {

        testProducts.push(
            product
        );

    }
    else {

        testProducts[editProductIndex] =
            product;
    }


    // ---------------------------------------------------
    // Dublettenprüfung
    // ---------------------------------------------------

    const duplicates =
        findDuplicateProductFields(
            testProducts
        );


    if (
        duplicates.length > 0
    ) {

        const first =
            duplicates[0];


        alert(
            "Das Produkt kann nicht gespeichert werden.\n\n"
            + `${first.field} doppelt vorhanden:\n`
            + `${first.value}`
        );


        return;
    }


    // ---------------------------------------------------
    // Produkt übernehmen
    // ---------------------------------------------------

    if (
        editProductIndex === null
    ) {

        products.push(
            product
        );

    }
    else {

        products[editProductIndex] =
            product;
    }


    // ---------------------------------------------------
    // Produktdaten lokal speichern
    // ---------------------------------------------------

    saveProductsToStorage();


    // ---------------------------------------------------
    // Produktdaten bei Online-Verbindung zentral speichern
    // ---------------------------------------------------

    if (
        navigator.onLine &&
        typeof window.saveProductListToFirestore === "function"
    ) {

        const newVersion =
            await window.saveProductListToFirestore(
                products
            );


        if (
            newVersion !== null
        ) {

            setLocalProductDataVersion(
                newVersion
            );


            // ---------------------------------------------------
            // Erfolgreich synchronisierten Stand als neue
            // Vergleichsbasis speichern
            // ---------------------------------------------------

            saveProductBaseline(
                products
            );


            clearPendingProductChanges();


            console.log(
                `Lokale Produktdaten-Version wurde auf ${newVersion} aktualisiert.`
            );
        }
        else {

            markProductChangesPending();
        }
    }
    else {

        markProductChangesPending();


        console.log(
            "Produktänderung wurde nur lokal gespeichert."
        );
    }


    // ---------------------------------------------------
    // Dialog schließen
    // ---------------------------------------------------

    document.getElementById(
        "productEditDialog"
    ).close();


    // ---------------------------------------------------
    // Produktliste aktualisieren
    // ---------------------------------------------------

    const searchText =
        document.getElementById(
            "productSearch"
        ).value;


    renderProductList(
        searchText
    );

    showNotification(
        "success",
        "Produkt gespeichert",
        `${product.productName} wurde erfolgreich gespeichert.`
    );
}

// =======================================================
// ASIN automatisch in Großbuchstaben umwandeln
// =======================================================

const editAsin =
    document.getElementById(
        "editAsin"
    );


editAsin.addEventListener(
    "input",
    event => {

        event.target.value =
            event.target.value
                .toUpperCase();
    }
);


async function deleteSelectedProduct() {

    if (
        selectedProductIndex === null
    ) {
        return;
    }


    const product =
        products[selectedProductIndex];


    // ---------------------------------------------------
    // Löschung bestätigen
    // ---------------------------------------------------

    const confirmed =
        confirm(
            `Produkt wirklich löschen?\n\n`
            + `${product.productName}\n`
            + `${product.colourVariant}\n`
            + `ASIN: ${product.asin}`
        );


    if (!confirmed) {
        return;
    }


    // ---------------------------------------------------
    // Produkt entfernen
    // ---------------------------------------------------

    products.splice(
        selectedProductIndex,
        1
    );


    // ---------------------------------------------------
    // Produktdaten lokal speichern
    // ---------------------------------------------------

    saveProductsToStorage();


    // ---------------------------------------------------
    // Produktdaten bei Online-Verbindung zentral speichern
    // ---------------------------------------------------

    if (
        navigator.onLine &&
        typeof window.saveProductListToFirestore === "function"
    ) {

        const newVersion =
            await window.saveProductListToFirestore(
                products
            );


        if (
            newVersion !== null
        ) {

            setLocalProductDataVersion(
                newVersion
            );


            // ---------------------------------------------------
            // Erfolgreich synchronisierten Stand als neue
            // Vergleichsbasis speichern
            // ---------------------------------------------------

            saveProductBaseline(
                products
            );


            clearPendingProductChanges();


            console.log(
                `Lokale Produktdaten-Version wurde auf ${newVersion} aktualisiert.`
            );
        }
        else {

            markProductChangesPending();


            console.log(
                "Produktlöschung konnte noch nicht zentral synchronisiert werden."
            );
        }
    }
    else {

        markProductChangesPending();


        console.log(
            "Produktlöschung wurde nur lokal gespeichert."
        );
    }


    // ---------------------------------------------------
    // Auswahl zurücksetzen
    // ---------------------------------------------------

    selectedProductIndex = null;


    // ---------------------------------------------------
    // Produktliste aktualisieren
    // ---------------------------------------------------

    const searchText =
        document.getElementById(
            "productSearch"
        ).value;


    renderProductList(
        searchText
    );

    showNotification(
        "success",
        "Produkt gelöscht",
        `${product.productName} wurde gelöscht.`
    );
}

// =======================================================
// Produktliste als JSON exportieren
// =======================================================

function exportProductsJson() {

    if (
        !Array.isArray(products) ||
        products.length === 0
    ) {

        alert(
            "Es sind keine Produktdaten zum Exportieren vorhanden."
        );

        return;
    }


    // ---------------------------------------------------
    // Produktdaten als JSON erzeugen
    // ---------------------------------------------------

    const json =
        JSON.stringify(
            products,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type: "application/json;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    // ---------------------------------------------------
    // Dateiname mit Zeitstempel erzeugen
    // ---------------------------------------------------

    const now =
        new Date();


    const pad =
        number =>
            String(number)
                .padStart(
                    2,
                    "0"
                );


    const filename =
        "products_"
        + now.getFullYear()
        + pad(now.getMonth() + 1)
        + pad(now.getDate())
        + "_"
        + pad(now.getHours())
        + pad(now.getMinutes())
        + pad(now.getSeconds())
        + ".json";


    // ---------------------------------------------------
    // JSON-Datei herunterladen
    // ---------------------------------------------------

    const link =
        document.createElement("a");


    link.href =
        url;

    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();

    link.remove();


    // Temporäre Objekt-URL wieder freigeben
    URL.revokeObjectURL(
        url
    );

    // ---------------------------------------------------
    // Erfolgreichen Export anzeigen
    // ---------------------------------------------------

    showNotification(
        "success",
        "JSON exportiert",
        `${products.length} Produkte wurden erfolgreich als JSON-Datei exportiert.`,
        5000
    );
}

// =======================================================
// Einzelnen Produktdatensatz prüfen
// =======================================================

function isValidProduct(product) {

    // ---------------------------------------------------
    // Produkt muss ein Objekt sein
    // ---------------------------------------------------

    if (
        typeof product !== "object" ||
        product === null
    ) {
        return false;
    }


    // ---------------------------------------------------
    // Erforderliche Felder prüfen
    // ---------------------------------------------------

    const requiredFields = [
        "productName",
        "colourVariant",
        "manufacturerCode",
        "ean",
        "sku",
        "pack",
        "asin"
    ];


    for (const field of requiredFields) {

        if (
            typeof product[field] !== "string"
        ) {
            return false;
        }
    }


    // ---------------------------------------------------
    // ASIN darf nicht leer sein
    // ---------------------------------------------------

    if (
        !product.asin.trim()
    ) {
        return false;
    }


    return true;
}
// =======================================================
// Gesamte Produktliste prüfen
// =======================================================

function validateProductList(data) {

    // ---------------------------------------------------
    // Produktliste muss ein Array sein
    // ---------------------------------------------------

    if (
        !Array.isArray(data)
    ) {

        return {
            valid: false,
            message:
                "Die JSON-Datei enthält keine Produktliste."
        };
    }


    // ---------------------------------------------------
    // Produktliste darf nicht leer sein
    // ---------------------------------------------------

    if (
        data.length === 0
    ) {

        return {
            valid: false,
            message:
                "Die Produktliste ist leer."
        };
    }


    // ---------------------------------------------------
    // Jeden Datensatz prüfen
    // ---------------------------------------------------

    for (
        let index = 0;
        index < data.length;
        index++
    ) {

        if (
            !isValidProduct(
                data[index]
            )
        ) {

            return {
                valid: false,
                message:
                    `Datensatz ${index + 1} hat ein ungültiges Format.`
            };
        }
    }


    // ---------------------------------------------------
    // Produktliste ist grundsätzlich gültig
    // ---------------------------------------------------

    return {
        valid: true,
        message: ""
    };
}

// =======================================================
// Produktliste aus JSON importieren
// =======================================================

async function importProductsJson(file) {

    if (!file) {
        return;
    }


    try {

        // ---------------------------------------------------
        // JSON-Datei lesen
        // ---------------------------------------------------

        const text =
            await file.text();


        const importedData =
            JSON.parse(
                text
            );


        // ---------------------------------------------------
        // Grundstruktur prüfen
        // ---------------------------------------------------

        const validation =
            validateProductList(
                importedData
            );


        if (
            !validation.valid
        ) {

            alert(
                "Die Produktliste konnte nicht importiert werden.\n\n"
                + validation.message
            );

            return;
        }


        // ---------------------------------------------------
        // Dubletten prüfen
        // ---------------------------------------------------

        const duplicates =
            findDuplicateProductFields(
                importedData
            );


        if (
            duplicates.length > 0
        ) {

            const first =
                duplicates[0];


            alert(
                "Die Produktliste konnte nicht importiert werden.\n\n"
                + `${first.field} doppelt vorhanden:\n`
                + `${first.value}`
            );

            return;
        }


        // ---------------------------------------------------
        // Sicherheitsabfrage
        // ---------------------------------------------------

        const confirmed =
            confirm(
                "Die aktuelle Produktliste wird vollständig ersetzt.\n\n"
                + `Neue Produktliste: ${importedData.length} Produkte\n\n`
                + "Möchtest du fortfahren?"
            );


        if (!confirmed) {
            return;
        }


        // ---------------------------------------------------
        // Produktdaten übernehmen
        // ---------------------------------------------------

        products =
            structuredClone(
                importedData
            );


        // ---------------------------------------------------
        // Produktdaten lokal speichern
        // ---------------------------------------------------

        saveProductsToStorage();


        // ---------------------------------------------------
        // Produktdaten bei Online-Verbindung zentral speichern
        // ---------------------------------------------------

        if (
            navigator.onLine &&
            typeof window.saveProductListToFirestore === "function"
        ) {

            const newVersion =
                await window.saveProductListToFirestore(
                    products
                );


            if (
                newVersion !== null
            ) {

                setLocalProductDataVersion(
                    newVersion
                );


                // ---------------------------------------------------
                // Erfolgreich synchronisierten Stand als neue
                // Vergleichsbasis speichern
                // ---------------------------------------------------

                saveProductBaseline(
                    products
                );


                clearPendingProductChanges();


                console.log(
                    `Lokale Produktdaten-Version wurde auf ${newVersion} aktualisiert.`
                );
            }
            else {

                markProductChangesPending();


                console.log(
                    "Importierte Produktdaten konnten noch nicht zentral synchronisiert werden."
                );
            }
        }
        else {

            markProductChangesPending();


            console.log(
                "Importierte Produktdaten wurden nur lokal gespeichert."
            );
        }


        // ---------------------------------------------------
        // Suche zurücksetzen
        // ---------------------------------------------------

        const productSearch =
            document.getElementById(
                "productSearch"
            );


        productSearch.value = "";


        // ---------------------------------------------------
        // Produktliste aktualisieren
        // ---------------------------------------------------

        renderProductList();


        showNotification(
            "success",
            "JSON importiert",
            `${products.length} Produkte wurden erfolgreich übernommen.`
        );

    }
    catch (error) {

        console.error(
            "Fehler beim JSON-Import:",
            error
        );


        alert(
            "Die JSON-Datei konnte nicht gelesen werden.\n\n"
            + error.message
        );
    }
}

// =======================================================
// Produktliste auf Standard zurücksetzen
// =======================================================

async function resetProductsToDefaults() {

    // ---------------------------------------------------
    // Zurücksetzen bestätigen
    // ---------------------------------------------------

    const confirmed =
        confirm(
            "Möchtest du die Produktliste wirklich auf den Standard zurücksetzen?\n\n"
            + "Alle aktuell gespeicherten Änderungen werden dabei überschrieben."
        );


    if (!confirmed) {
        return;
    }


    // ---------------------------------------------------
    // Standard-Produktdaten übernehmen
    // ---------------------------------------------------

    products =
        structuredClone(
            DEFAULT_PRODUCTS
        );


    // ---------------------------------------------------
    // Produktdaten lokal speichern
    // ---------------------------------------------------

    saveProductsToStorage();


    // ---------------------------------------------------
    // Produktdaten bei Online-Verbindung zentral speichern
    // ---------------------------------------------------

    if (
        navigator.onLine &&
        typeof window.saveProductListToFirestore === "function"
    ) {

        const newVersion =
            await window.saveProductListToFirestore(
                products
            );


        if (
            newVersion !== null
        ) {

            setLocalProductDataVersion(
                newVersion
            );


            // ---------------------------------------------------
            // Erfolgreich synchronisierten Stand als neue
            // Vergleichsbasis speichern
            // ---------------------------------------------------

            saveProductBaseline(
                products
            );


            clearPendingProductChanges();


            console.log(
                `Lokale Produktdaten-Version wurde auf ${newVersion} aktualisiert.`
            );
        }
        else {

            markProductChangesPending();


            console.log(
                "Standard-Produktdaten konnten noch nicht zentral synchronisiert werden."
            );
        }
    }
    else {

        markProductChangesPending();


        console.log(
            "Standard-Produktdaten wurden nur lokal wiederhergestellt."
        );
    }


    // ---------------------------------------------------
    // Suche zurücksetzen
    // ---------------------------------------------------

    const productSearch =
        document.getElementById(
            "productSearch"
        );


    productSearch.value = "";


    // ---------------------------------------------------
    // Auswahl und Bearbeitungsstatus zurücksetzen
    // ---------------------------------------------------

    selectedProductIndex = null;
    editProductIndex = null;


    // ---------------------------------------------------
    // Produktliste aktualisieren
    // ---------------------------------------------------

    renderProductList();


    showNotification(
        "success",
        "Standard wiederhergestellt",
        `${products.length} Standard-Produkte wurden wiederhergestellt.`
    );
}


// =======================================================
// Produkt-Merge finalisieren
// =======================================================

async function finalizeProductMerge(
    mergeResult
) {

    if (
        !mergeResult ||
        !Array.isArray(
            mergeResult.products
        ) ||
        mergeResult.conflicts.length > 0
    ) {

        console.error(
            "Produkt-Merge ist noch nicht vollständig aufgelöst."
        );

        return false;
    }


    if (
        !navigator.onLine ||
        typeof window.saveProductListToFirestore !== "function"
    ) {

        console.warn(
            "Produktdaten können derzeit nicht zentral gespeichert werden."
        );

        return false;
    }


    try {

        const newVersion =
            await window.saveProductListToFirestore(
                mergeResult.products
            );


        if (
            newVersion === null ||
            newVersion === undefined
        ) {

            console.warn(
                "Zentrale Speicherung wurde nicht bestätigt."
            );

            return false;
        }


        // ---------------------------------------------------
        // Erst jetzt gilt alles als vollständig synchronisiert
        // ---------------------------------------------------

        products =
            structuredClone(
                mergeResult.products
            );


        saveProductsToStorage();


        setLocalProductDataVersion(
            newVersion
        );


        saveProductBaseline(
            products
        );


        clearPendingProductChanges();


        console.log(
            `Produktdaten wurden vollständig synchronisiert. Version ${newVersion}.`
        );


        return true;

    }
    catch (error) {

        console.warn(
            "Abschluss der Produktsynchronisation fehlgeschlagen.",
            error
        );


        return false;
    }
}



// =======================================================
// Toast-Benachrichtigung anzeigen
// =======================================================

function showNotification(
    type,
    title,
    message,
    duration = 4000
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {
        return;
    }

    // ---------------------------------------------------
// Toast in den aktuell geöffneten Dialog verschieben
// ---------------------------------------------------

const openDialogs =
    document.querySelectorAll(
        "dialog[open]"
    );


const activeDialog =
    openDialogs.length > 0
        ? openDialogs[
            openDialogs.length - 1
        ]
        : null;


if (activeDialog) {

    if (
        container.parentElement !== activeDialog
    ) {

        if (
            container.matches(
                ":popover-open"
            )
        ) {

            container.hidePopover();
        }


                activeDialog.appendChild(
                    container
                );
            }
        }
        else {

            if (
                container.parentElement !== document.body
            ) {

                if (
                    container.matches(
                        ":popover-open"
                    )
                ) {

                    container.hidePopover();
                }


                document.body.appendChild(
                    container
                );
            }
        }

    if (
    !container.matches(
        ":popover-open"
        )
    ) {

        container.showPopover();
    }


    const validTypes = [
        "success",
        "warning",
        "error",
        "info"
    ];


    if (
        !validTypes.includes(type)
    ) {
        type = "info";
    }


    const icons = {
        success: "✓",
        warning: "!",
        error: "×",
        info: "i"
    };


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    const icon =
        document.createElement(
            "div"
        );

    icon.className =
        "toast-icon";

    icon.textContent =
        icons[type];


    const content =
        document.createElement(
            "div"
        );

    content.className =
        "toast-content";


    const titleElement =
        document.createElement(
            "div"
        );

    titleElement.className =
        "toast-title";

    titleElement.textContent =
        title;


    const messageElement =
        document.createElement(
            "div"
        );

    messageElement.className =
        "toast-message";

    messageElement.textContent =
        message;


    content.appendChild(
        titleElement
    );

    content.appendChild(
        messageElement
    );


    const closeButton =
        document.createElement(
            "button"
        );

    closeButton.type =
        "button";

    closeButton.className =
        "toast-close";

    closeButton.setAttribute(
        "aria-label",
        "Meldung schließen"
    );

    closeButton.textContent =
        "×";


    toast.appendChild(
        icon
    );

    toast.appendChild(
        content
    );

    toast.appendChild(
        closeButton
    );


    container.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "visible"
            );
        }
    );


    let removeTimer = null;


    function removeToast() {

        if (
            toast.classList.contains(
                "removing"
            )
        ) {
            return;
        }


        toast.classList.add(
            "removing"
        );


        window.setTimeout(
            () => {

                toast.remove();
            },
            200
        );
    }


    closeButton.addEventListener(
        "click",
        removeToast
    );


    if (
        duration > 0
    ) {

        removeTimer =
            window.setTimeout(
                removeToast,
                duration
            );
    }


    toast.addEventListener(
        "mouseenter",
        () => {

            if (
                removeTimer !== null
            ) {

                clearTimeout(
                    removeTimer
                );

                removeTimer =
                    null;
            }
        }
    );


    toast.addEventListener(
        "mouseleave",
        () => {

            if (
                duration > 0 &&
                removeTimer === null
            ) {

                removeTimer =
                    window.setTimeout(
                        removeToast,
                        duration
                    );
            }
        }
    );
}


window.showNotification =
    showNotification;


// =======================================================
// Kompakte Import-Statusleiste
// =======================================================

function renderImportStatus(stats) {

    const statusBar =
        document.getElementById(
            "importStatusBar"
        );


    // ---------------------------------------------------
    // Anzahl der Problemdateien
    // ---------------------------------------------------

    const problemCount =
        stats.conflicts
        + stats.notFound
        + stats.emptyFiles;


    statusBar.innerHTML = "";


    // ---------------------------------------------------
    // Statustexte erzeugen
    // ---------------------------------------------------

    const fileText =
        stats.selectedFiles === 1
            ? "1 Datei"
            : `${stats.selectedFiles} Dateien`;


    const problemText =
        problemCount === 1
            ? "1 Problem"
            : `${problemCount} Probleme`;


    const tcodeText =
        stats.importedTcodes === 1
            ? "1 T-Code"
            : `${stats.importedTcodes} T-Codes`;


    const items = [
        fileText,
        `${stats.resolvedFiles} OK`,
        problemText,
        tcodeText
    ];


    // ---------------------------------------------------
    // Statusfelder erzeugen
    // ---------------------------------------------------

    for (const text of items) {

        const item =
            document.createElement(
                "span"
            );


        item.classList.add(
            "import-status-item"
        );


        item.textContent =
            text;


        // -----------------------------------------------
        // Problemfeld anklickbar machen
        // -----------------------------------------------

        if (
            text === problemText &&
            problemCount > 0
        ) {

            item.classList.add(
                "import-status-problem"
            );


            item.title =
                "Zu den Problemen springen";


            item.addEventListener(
                "click",
                () => {

                    const summarySection =
                        document.getElementById(
                            "summarySection"
                        );


                    if (summarySection) {

                        summarySection.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }
                    else {

                        console.error(
                            "Summary-Bereich mit id='summarySection' wurde nicht gefunden."
                        );
                    }
                }
            );
        }


        statusBar.appendChild(
            item
        );
    }


    // ---------------------------------------------------
    // Statusfarbe setzen
    // ---------------------------------------------------

    statusBar.classList.remove(
        "success",
        "warning"
    );


    if (
        problemCount === 0
    ) {

        statusBar.classList.add(
            "success"
        );

    }
    else {

        statusBar.classList.add(
            "warning"
        );
    }


    // ---------------------------------------------------
    // Statusleiste anzeigen
    // ---------------------------------------------------

    statusBar.classList.add(
        "visible"
    );
}

// =======================================================
// Importbereich kompakt anzeigen
// =======================================================

function compactImportArea(fileCount) {

    const dropZone =
        document.getElementById(
            "dropZone"
        );

    const completedInfo =
        document.getElementById(
            "importCompletedInfo"
        );


    // ---------------------------------------------------
    // Abschlusstext erzeugen
    // ---------------------------------------------------

    const fileText =
        fileCount === 1
            ? "1 CSV-Datei verarbeitet"
            : `${fileCount} CSV-Dateien verarbeitet`;


    completedInfo.textContent =
        `✓ ${fileText}`;


    // ---------------------------------------------------
    // Importbereich verkleinern
    // ---------------------------------------------------

    dropZone.classList.add(
        "compact"
    );
}

// =======================================================
// Versionsinfo im Footer anzeigen
// =======================================================

function renderAppInfo() {

    const footer =
        document.getElementById(
            "footerAppInfo"
        );


    footer.textContent =
        `${APP_INFO.name} · Version ${APP_INFO.version}`;
}


// =======================================================
// Info-Dialog mit Anwendungsdaten füllen
// =======================================================

function fillAboutDialog() {

    document.getElementById(
        "aboutAppName"
    ).textContent =
        APP_INFO.name;


    document.getElementById(
        "aboutVersion"
    ).textContent =
        `Version: ${APP_INFO.version}`;


    document.getElementById(
        "aboutBuildDate"
    ).textContent =
        `Build-Datum: ${APP_INFO.buildDate}`;


    document.getElementById(
        "aboutAuthor"
    ).textContent =
        `Autor: ${APP_INFO.author}`;
}


// =======================================================
// Versionsinfo beim Programmstart anzeigen
// =======================================================

renderAppInfo();

function renderChangelog() {

    const container =
        document.getElementById(
            "changelogContent"
        );


    container.innerHTML = "";


    // ---------------------------------------------------
    // Releases erzeugen
    // ---------------------------------------------------

    for (
        const release
        of APP_INFO.changelog
    ) {

        const section =
            document.createElement(
                "section"
            );


        section.className =
            "changelog-release";


        // -----------------------------------------------
        // Versionsnummer
        // -----------------------------------------------

        const title =
            document.createElement(
                "h3"
            );


        title.textContent =
            `Version ${release.version}`;


        // -----------------------------------------------
        // Veröffentlichungsdatum
        // -----------------------------------------------

        const date =
            document.createElement(
                "div"
            );


        date.className =
            "changelog-date";


        date.textContent =
            release.date;


        // -----------------------------------------------
        // Änderungen
        // -----------------------------------------------

        const list =
            document.createElement(
                "ul"
            );


        for (
            const change
            of release.changes
        ) {

            const item =
                document.createElement(
                    "li"
                );


            item.textContent =
                change;


            list.appendChild(
                item
            );
        }


        // -----------------------------------------------
        // Release zusammensetzen
        // -----------------------------------------------

        section.appendChild(
            title
        );

        section.appendChild(
            date
        );

        section.appendChild(
            list
        );


        container.appendChild(
            section
        );
    }
}


// =======================================================
// Systemstatus aktualisieren
// =======================================================

function updateSystemStatus() {

    const statusValue =
        document.getElementById(
            "statusSystem"
        );


    const statusLight =
        document.getElementById(
            "statusSystemLight"
        );


    if (
        !statusValue ||
        !statusLight
    ) {
        return;
    }


    if (navigator.onLine) {

        statusValue.textContent =
            "ONLINE";


        statusLight.className =
            "status-light online";
    }
    else {

        statusValue.textContent =
            "OFFLINE";


        statusLight.className =
            "status-light offline";
    }
}


// =======================================================
// Status der Ausfallsicherheit aktualisieren
// =======================================================

function updateFailSafeStatus() {

    const statusValue =
        document.getElementById(
            "statusFailSafe"
        );


    const statusLight =
        document.getElementById(
            "statusFailSafeLight"
        );


    if (
        !statusValue ||
        !statusLight
    ) {
        return;
    }


    const localProductsAvailable =
        Array.isArray(products) &&
        products.length > 0;


    if (
        serviceWorkerReady &&
        localProductsAvailable
    ) {

        statusValue.textContent =
            "OFFLINE BEREIT";


        statusLight.className =
            "status-light ready";
    }
    else {

        statusValue.textContent =
            "NICHT BEREIT";


        statusLight.className =
            "status-light offline";
    }
}


// Für die Service-Worker-Registrierung bereitstellen
window.setServiceWorkerReady =
    ready => {

        serviceWorkerReady =
            ready === true;


        updateFailSafeStatus();
    };





// =======================================================
// Events
// =======================================================

// =======================================================
// Firebase-Login
// =======================================================

const firebaseLoginDialog =
    document.getElementById(
        "firebaseLoginDialog"
    );


const firebaseLoginEmail =
    document.getElementById(
        "firebaseLoginEmail"
    );


const firebaseLoginPassword =
    document.getElementById(
        "firebaseLoginPassword"
    );


const firebaseLoginSubmit =
    document.getElementById(
        "firebaseLoginSubmit"
    );


const firebaseLoginError =
    document.getElementById(
        "firebaseLoginError"
    );


async function submitFirebaseLogin() {

    const email =
        firebaseLoginEmail
            .value
            .trim();


    const password =
        firebaseLoginPassword
            .value;


    // ---------------------------------------------------
    // Eingaben prüfen
    // ---------------------------------------------------

    if (
        !email ||
        !password
    ) {

        firebaseLoginError.textContent =
            "Bitte E-Mail-Adresse und Passwort eingeben.";

        firebaseLoginError.hidden =
            false;


        return;
    }


    // ---------------------------------------------------
    // Fehlermeldung zurücksetzen
    // ---------------------------------------------------

    firebaseLoginError.hidden =
        true;

    firebaseLoginError.textContent =
        "";


    // ---------------------------------------------------
    // Button während der Anmeldung sperren
    // ---------------------------------------------------

    firebaseLoginSubmit.disabled =
        true;

    firebaseLoginSubmit.textContent =
        "Anmeldung läuft…";


    try {

        if (
            typeof window.firebaseLogin !== "function"
        ) {

            firebaseLoginError.textContent =
                "Firebase-Anmeldung ist momentan nicht verfügbar.";

            firebaseLoginError.hidden =
                false;


            return;
        }


        const result =
            await window.firebaseLogin(
                email,
                password
            );


        if (
            !result ||
            !result.success
        ) {

            let message =
                "Die Anmeldung ist fehlgeschlagen.";


            const errorCode =
                result?.error?.code;


            if (
                errorCode === "auth/invalid-credential" ||
                errorCode === "auth/wrong-password" ||
                errorCode === "auth/user-not-found"
            ) {

                message =
                    "E-Mail-Adresse oder Passwort ist nicht korrekt.";
            }
            else if (
                errorCode === "auth/too-many-requests"
            ) {

                message =
                    "Zu viele Anmeldeversuche. Bitte später erneut versuchen.";
            }
            else if (
                errorCode === "auth/network-request-failed"
            ) {

                message =
                    "Keine Verbindung zu Firebase möglich.";
            }


            firebaseLoginError.textContent =
                message;

            firebaseLoginError.hidden =
                false;


            return;
        }


        // ---------------------------------------------------
        // Anmeldung erfolgreich
        // ---------------------------------------------------

        firebaseLoginPassword.value =
            "";


        firebaseLoginDialog.close();


        showNotification(
            "success",
            "Anmeldung erfolgreich",
            "Die Verbindung zu Firestore wurde hergestellt.",
            4000
        );

    }
    finally {

        firebaseLoginSubmit.disabled =
            false;

        firebaseLoginSubmit.textContent =
            "Anmelden";
    }
}


firebaseLoginSubmit.addEventListener(
    "click",
    submitFirebaseLogin
);


firebaseLoginPassword.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            submitFirebaseLogin();
        }
    }
);

// =======================================================
// Firebase-Login-Dialog anzeigen
// =======================================================

function showFirebaseLoginDialog() {

    const dialog =
        document.getElementById(
            "firebaseLoginDialog"
        );


    const email =
        document.getElementById(
            "firebaseLoginEmail"
        );


    const password =
        document.getElementById(
            "firebaseLoginPassword"
        );


    const error =
        document.getElementById(
            "firebaseLoginError"
        );


    if (!dialog) {
        return;
    }


    email.value = "";
    password.value = "";

    error.hidden = true;
    error.textContent = "";


    if (!dialog.open) {

        dialog.showModal();
    }


    window.setTimeout(
        () => {

            email.focus();
        },
        0
    );
}


window.showFirebaseLoginDialog =
    showFirebaseLoginDialog;



// =======================================================
// Firebase abmelden
// =======================================================

document
    .getElementById(
        "menuFirebaseLogout"
    )
    .addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Möchtest du Firebase wirklich abmelden?\n\n"
                    + "Die lokal gespeicherten Produktdaten bleiben erhalten."
                );


            if (!confirmed) {
                return;
            }


            if (
                typeof window.firebaseLogout !== "function"
            ) {

                showNotification(
                    "error",
                    "Abmeldung nicht möglich",
                    "Firebase ist momentan nicht verfügbar."
                );

                return;
            }


            const result =
                await window.firebaseLogout();


            if (
                !result ||
                !result.success
            ) {

                showNotification(
                    "error",
                    "Abmeldung fehlgeschlagen",
                    "Firebase konnte nicht abgemeldet werden."
                );

                return;
            }


            updateFirestoreStatus(
                "disconnected"
            );


            showNotification(
                "info",
                "Firebase abgemeldet",
                "Die lokalen Produktdaten bleiben weiterhin verfügbar."
            );
        }
    );

// -------------------------------------------------------
// Dateiauswahl
// -------------------------------------------------------

document
    .getElementById(
        "fileInput"
    )
    .addEventListener(
        "change",
        handleFiles
    );


// -------------------------------------------------------
// Excel-Export
// -------------------------------------------------------

document
    .getElementById(
        "exportButton"
    )
    .addEventListener(
        "click",
        exportToExcel
    );


// -------------------------------------------------------
// Neuer Import
// -------------------------------------------------------

document
    .getElementById(
        "menuNew"
    )
    .addEventListener(
        "click",
        resetApplication
    );


document
    .getElementById(
        "productConflictUseCloud"
    )
    .addEventListener(
        "click",
        async () => {

            if (
                !currentProductConflict ||
                !currentProductMergeResult
            ) {
                return;
            }


            const success =
                resolveProductConflict(
                    currentProductMergeResult,
                    currentProductConflict,
                    false
                );


            if (!success) {

                console.error(
                    "Konflikt konnte nicht mit dem zentralen Stand aufgelöst werden."
                );

                return;
            }


            console.log(
                "Zentraler Stand wurde für den aktuellen Konflikt ausgewählt."
            );


            // ---------------------------------------------------
            // Gibt es noch weitere Konflikte?
            // ---------------------------------------------------

            if (
                currentProductMergeResult.conflicts.length > 0
            ) {

                const nextConflict =
                    currentProductMergeResult.conflicts[0];


                showProductConflictDialog(
                    nextConflict,
                    currentProductMergeResult
                );


                return;
            }


            // ---------------------------------------------------
            // Alle Konflikte gelöst:
            // Merge lokal übernehmen
            // ---------------------------------------------------

            const applied =
                applyMergedProductsLocally(
                    currentProductMergeResult
                );


            if (!applied) {

                console.error(
                    "Zusammengeführte Produktdaten konnten nicht lokal übernommen werden."
                );

                return;
            }


            console.log(
                "Alle Produktkonflikte wurden aufgelöst."
            );


            console.log({
                produkte:
                    currentProductMergeResult.products.length,

                verbleibendeKonflikte:
                    currentProductMergeResult.conflicts.length
            });


            // ---------------------------------------------------
            // Zusammengeführten Stand zentral speichern
            // ---------------------------------------------------

            const finalized =
                await finalizeProductMerge(
                    currentProductMergeResult
                );


            if (!finalized) {

                console.warn(
                    "Der zusammengeführte Produktstand konnte noch nicht zentral gespeichert werden."
                );

                productConflictDialog.close();

                return;
            }


            console.log(
                "Produktsynchronisation wurde vollständig abgeschlossen."
            );


            currentProductConflict =
                null;

            currentProductMergeResult =
                null;


            productConflictDialog.close();
        }
    );


document
    .getElementById(
        "productConflictUseLocal"
    )
    .addEventListener(
        "click",
        async () => {

            if (
                !currentProductConflict ||
                !currentProductMergeResult
            ) {
                return;
            }


            const success =
                resolveProductConflict(
                    currentProductMergeResult,
                    currentProductConflict,
                    true
                );


            if (!success) {

                console.error(
                    "Konflikt konnte nicht mit dem lokalen Stand aufgelöst werden."
                );

                return;
            }


            console.log(
                "Lokaler Stand wurde für den aktuellen Konflikt ausgewählt."
            );


            // ---------------------------------------------------
            // Gibt es noch weitere Konflikte?
            // ---------------------------------------------------

            if (
                currentProductMergeResult.conflicts.length > 0
            ) {

                const nextConflict =
                    currentProductMergeResult.conflicts[0];


                showProductConflictDialog(
                    nextConflict,
                    currentProductMergeResult
                );


                return;
            }


            // ---------------------------------------------------
            // Alle Konflikte gelöst:
            // Merge lokal übernehmen
            // ---------------------------------------------------

            const applied =
                applyMergedProductsLocally(
                    currentProductMergeResult
                );


            if (!applied) {

                console.error(
                    "Zusammengeführte Produktdaten konnten nicht lokal übernommen werden."
                );

                return;
            }


            console.log(
                "Alle Produktkonflikte wurden aufgelöst."
            );


            console.log({
                produkte:
                    currentProductMergeResult.products.length,

                verbleibendeKonflikte:
                    currentProductMergeResult.conflicts.length
            });


            // ---------------------------------------------------
            // Zusammengeführten Stand zentral speichern
            // ---------------------------------------------------

            const finalized =
                await finalizeProductMerge(
                    currentProductMergeResult
                );


            if (!finalized) {

                console.warn(
                    "Der zusammengeführte Produktstand konnte noch nicht zentral gespeichert werden."
                );

                productConflictDialog.close();

                return;
            }


            console.log(
                "Produktsynchronisation wurde vollständig abgeschlossen."
            );


            currentProductConflict =
                null;

            currentProductMergeResult =
                null;


            productConflictDialog.close();
        }
    );
// =======================================================
// Produktkonflikt-Dialog schließen
// =======================================================

const productConflictDialog =
    document.getElementById(
        "productConflictDialog"
    );


document
    .getElementById(
        "closeProductConflict"
    )
    .addEventListener(
        "click",
        () => {

            productConflictDialog.close();
        }
    );


document
    .getElementById(
        "productConflictCancel"
    )
    .addEventListener(
        "click",
        () => {

            productConflictDialog.close();
        }
    );

// -------------------------------------------------------
// Hilfe- und Info-Dialoge
// -------------------------------------------------------

const helpDialog =
    document.getElementById(
        "helpDialog"
    );


const aboutDialog =
    document.getElementById(
        "aboutDialog"
    );


document
    .getElementById(
        "menuHelp"
    )
    .addEventListener(
        "click",
        () => {

            helpDialog.showModal();
        }
    );


document
    .getElementById(
        "closeHelp"
    )
    .addEventListener(
        "click",
        () => {

            helpDialog.close();
        }
    );


document
    .getElementById(
        "menuAbout"
    )
    .addEventListener(
        "click",
        () => {

            fillAboutDialog();

            aboutDialog.showModal();
        }
    );


document
    .getElementById(
        "closeAbout"
    )
    .addEventListener(
        "click",
        () => {

            aboutDialog.close();
        }
    );


// -------------------------------------------------------
// Produktverwaltung
// -------------------------------------------------------

document
    .getElementById(
        "productNew"
    )
    .addEventListener(
        "click",
        openNewProduct
    );


document
    .getElementById(
        "productEdit"
    )
    .addEventListener(
        "click",
        openEditProduct
    );


document
    .getElementById(
        "productDelete"
    )
    .addEventListener(
        "click",
        deleteSelectedProduct
    );


document
    .getElementById(
        "productEditCancel"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "productEditDialog"
                )
                .close();
        }
    );


document
    .getElementById(
        "productEditSave"
    )
    .addEventListener(
        "click",
        saveProductFromForm
    );


document
    .getElementById(
        "productResetDefaults"
    )
    .addEventListener(
        "click",
        resetProductsToDefaults
    );


// =======================================================
// JSON Import / Export Produktliste
// =======================================================

const productJsonFileInput =
    document.getElementById(
        "productJsonFileInput"
    );


// -------------------------------------------------------
// Produktliste als JSON exportieren
// -------------------------------------------------------

document
    .getElementById(
        "productExportJson"
    )
    .addEventListener(
        "click",
        exportProductsJson
    );


// -------------------------------------------------------
// JSON-Datei für Import auswählen
// -------------------------------------------------------

document
    .getElementById(
        "productImportJson"
    )
    .addEventListener(
        "click",
        () => {

            // Wert zurücksetzen, damit auch dieselbe
            // Datei erneut ausgewählt werden kann
            productJsonFileInput.value = "";

            productJsonFileInput.click();
        }
    );


// -------------------------------------------------------
// Ausgewählte JSON-Datei importieren
// -------------------------------------------------------

productJsonFileInput
    .addEventListener(
        "change",
        async event => {

            const file =
                event.target.files[0];


            await importProductsJson(
                file
            );
        }
    );



// =======================================================
// Produktliste
// =======================================================

const productsDialog =
    document.getElementById(
        "productsDialog"
    );

/*
const productSearch =
    document.getElementById(
        "productSearch"
    );
*/

// -------------------------------------------------------
// Produktliste öffnen
// -------------------------------------------------------

document
    .getElementById(
        "menuProducts"
    )
    .addEventListener(
        "click",
        openProductList
    );


// -------------------------------------------------------
// Produktliste schließen
// -------------------------------------------------------

document
    .getElementById(
        "closeProducts"
    )
    .addEventListener(
        "click",
        () => {

            productsDialog.close();
        }
    );


// -------------------------------------------------------
// Produktliste während der Eingabe filtern
// -------------------------------------------------------

productSearch.addEventListener(
    "input",
    event => {

        renderProductList(
            event.target.value
        );
    }
);

// =======================================================
// Drag & Drop
// =======================================================

// =======================================================
// Drag & Drop
// =======================================================

const dropZone =
    document.getElementById(
        "dropZone"
    );


if (dropZone) {

    // ---------------------------------------------------
    // Browser-Standardverhalten verhindern
    // ---------------------------------------------------

    [
        "dragenter",
        "dragover",
        "dragleave",
        "drop"
    ].forEach(eventName => {

        dropZone.addEventListener(
            eventName,
            event => {

                event.preventDefault();
                event.stopPropagation();
            }
        );
    });


    // ---------------------------------------------------
    // Drag-&-Drop-Hervorhebung einschalten
    // ---------------------------------------------------

    [
        "dragenter",
        "dragover"
    ].forEach(eventName => {

        dropZone.addEventListener(
            eventName,
            () => {

                dropZone.classList.add(
                    "drag-over"
                );
            }
        );
    });


    // ---------------------------------------------------
    // Drag-&-Drop-Hervorhebung ausschalten
    // ---------------------------------------------------

    [
        "dragleave",
        "drop"
    ].forEach(eventName => {

        dropZone.addEventListener(
            eventName,
            () => {

                dropZone.classList.remove(
                    "drag-over"
                );
            }
        );
    });


    // ---------------------------------------------------
    // Abgelegte Dateien verarbeiten
    // ---------------------------------------------------

    dropZone.addEventListener(
        "drop",
        async event => {

            const files =
                event.dataTransfer.files;


            await processFiles(
                files
            );
        }
    );

}
else {

    console.error(
        "Drag-&-Drop-Bereich mit id='dropZone' wurde nicht gefunden."
    );
}

// =======================================================
// Service Worker registrieren
// =======================================================



if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        async () => {

            try {

                const registration =
                    await navigator
                        .serviceWorker
                        .register(
                            "./service-worker.js"
                        );


                console.log(
                    "Service Worker registriert:",
                    registration.scope
                );

                if (
                    typeof window.setServiceWorkerReady === "function"
                ) {

                    window.setServiceWorkerReady(
                        true
                    );
                }

            }
            catch (error) {

                console.error(
                    "Service Worker konnte nicht registriert werden:",
                    error
                );

                if (
                    typeof window.setServiceWorkerReady === "function"
                ) {

                    window.setServiceWorkerReady(
                        false
                    );
                }
            }
        }
    );
}


// =======================================================
// Changelog
// =======================================================

const changelogDialog =
    document.getElementById(
        "changelogDialog"
    );


// -------------------------------------------------------
// Changelog öffnen
// -------------------------------------------------------

document
    .getElementById(
        "menuChangelog"
    )
    .addEventListener(
        "click",
        () => {

            renderChangelog();

            changelogDialog.showModal();
        }
    );


// -------------------------------------------------------
// Changelog schließen
// -------------------------------------------------------

document
    .getElementById(
        "closeChangelog"
    )
    .addEventListener(
        "click",
        () => {

            changelogDialog.close();
        }
    );
    
    document
    .getElementById(
        "closeChangelogButton"
    )
    .addEventListener(
        "click",
        () => {

            changelogDialog.close();
        }
    );



   // =======================================================
    // Nach-oben-Schaltfläche
    // =======================================================

    const scrollToTopButton =
        document.getElementById(
            "scrollToTop"
        );


    // -------------------------------------------------------
    // Sichtbarkeit abhängig von Scrollposition
    // -------------------------------------------------------

    function updateScrollToTopButton() {

        if (
            window.scrollY > 250
        ) {

            scrollToTopButton.classList.add(
                "visible"
            );

        }
        else {

            scrollToTopButton.classList.remove(
                "visible"
            );
        }
    }


    // -------------------------------------------------------
    // Nach oben scrollen
    // -------------------------------------------------------

    scrollToTopButton.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );


    // -------------------------------------------------------
    // Scrollposition überwachen
    // -------------------------------------------------------

    window.addEventListener(
        "scroll",
        updateScrollToTopButton
    );


    // Anfangszustand setzen
    updateScrollToTopButton();