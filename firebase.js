"use strict";


// =======================================================
// Firebase
// =======================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";



import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// =======================================================
// Firebase-Konfiguration
// =======================================================

const firebaseConfig = {
    apiKey:
        "AIzaSyDo5fn2AuBBQUY8WCDp3UwqITB0-qL1uWQ",

    authDomain:
        "senic-webimport.firebaseapp.com",

    projectId:
        "senic-webimport",

    storageBucket:
        "senic-webimport.firebasestorage.app",

    messagingSenderId:
        "658037395707",

    appId:
        "1:658037395707:web:7416e0de229c833778205e"
};


// =======================================================
// Firebase initialisieren
// =======================================================

const firebaseApp =
    initializeApp(
        firebaseConfig
    );


// =======================================================
// Firebase Authentication initialisieren
// =======================================================

const firebaseAuth =
    getAuth(
        firebaseApp
    );


window.firebaseAuth =
    firebaseAuth;

// =======================================================
// Firestore initialisieren
// =======================================================

const firestoreDb =
    getFirestore(
        firebaseApp
    );

if (
    typeof window.updateFirestoreStatus === "function"
) {

    window.updateFirestoreStatus(
        "connecting"
    );
}


// =======================================================
// Für andere JavaScript-Dateien bereitstellen
// =======================================================

window.firebaseApp =
    firebaseApp;

window.firestoreDb =
    firestoreDb;


console.log(
    "Firebase wurde initialisiert."
);

console.log(
    "Firestore wurde initialisiert."
);

// =======================================================
// Erster Firestore-Verbindungstest
// =======================================================

async function testFirestoreConnection() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    firestoreDb,
                    "products"
                )
            );


        console.log(
            "Firestore-Verbindung erfolgreich.",
            snapshot.size,
            "Produkte gefunden."
        );

    }
    catch (error) {

        console.error(
            "Firestore-Test fehlgeschlagen:",
            error
        );
    }
}


testFirestoreConnection();

// =======================================================
// Benutzer anmelden
// =======================================================

async function firebaseLogin(
    email,
    password
) {

    try {

        const credentials =
            await signInWithEmailAndPassword(
                firebaseAuth,
                email,
                password
            );


        console.log(
            "Firebase-Anmeldung erfolgreich:",
            credentials.user.email
        );


        return {
            success: true,
            user: credentials.user
        };

    }
    catch (error) {

        console.error(
            "Firebase-Anmeldung fehlgeschlagen:",
            error
        );


        return {
            success: false,
            error
        };
    }
}


// =======================================================
// Benutzer abmelden
// =======================================================

// =======================================================
// Firebase abmelden
// =======================================================

async function firebaseLogout() {

    try {

        await signOut(
            firebaseAuth
        );


        console.log(
            "Firebase-Benutzer wurde abgemeldet."
        );


        return {
            success: true
        };

    }
    catch (error) {

        console.error(
            "Firebase-Abmeldung fehlgeschlagen:",
            error
        );


        return {
            success: false,
            error
        };
    }
}


window.firebaseLogout =
    firebaseLogout;


// =======================================================
// Anmeldestatus überwachen
// =======================================================

onAuthStateChanged(
    firebaseAuth,
    async user => {

        if (user) {

            console.log(
                "Firebase-Benutzer angemeldet:",
                user.email
            );

            if (
                typeof window.updateFirestoreStatus === "function"
            ) {

                window.updateFirestoreStatus(
                    "connected"
                );
            }



            // ---------------------------------------------------
            // Produktdaten intelligent synchronisieren
            // ---------------------------------------------------

            const hasPendingChanges =
                typeof window.hasPendingProductChanges === "function"
                    ? window.hasPendingProductChanges()
                    : false;


            const hasLocalChanges =
                typeof window.hasLocalProductChangesComparedToBaseline === "function"
                    ? window.hasLocalProductChangesComparedToBaseline()
                    : false;


            if (
                hasPendingChanges ||
                hasLocalChanges
            ) {

                if (
                    typeof window.reconcilePendingProductChanges === "function"
                ) {

                    await window
                        .reconcilePendingProductChanges();
                }
            }
            else {

                if (
                    typeof window.syncProductsFromFirestoreIfNeeded === "function"
                ) {

                    await window
                        .syncProductsFromFirestoreIfNeeded();
                }
              
            }

        }
        else {

            console.log(
                "Kein Firebase-Benutzer angemeldet."
            );


            if (
                typeof window.showFirebaseLoginDialog === "function"
            ) {

                window.showFirebaseLoginDialog();
            }
        }
    }
);


// =======================================================
// Funktionen global bereitstellen
// =======================================================

window.firebaseLogin =
    firebaseLogin;

window.firebaseLogout =
    firebaseLogout;


// =======================================================
// Testprodukt in Firestore anlegen
// =======================================================

async function addTestProduct() {

    try {

        const product = {
            productName: "Firebase Test Product",
            colourVariant: "Test Black",
            manufacturerCode: "FB-TEST-001",
            ean: "4006381333931",
            sku: "999001",
            pack: "1",
            asin: "B0TEST0001"
        };


        const documentReference =
            await addDoc(
                collection(
                    firestoreDb,
                    "products"
                ),
                product
            );


        console.log(
            "Testprodukt gespeichert. Dokument-ID:",
            documentReference.id
        );


        return documentReference.id;

    }
    catch (error) {

        console.error(
            "Testprodukt konnte nicht gespeichert werden:",
            error
        );

        return null;
    }
}


// =======================================================
// Testprodukt wieder löschen
// =======================================================

async function deleteTestProduct(
    documentId
) {

    try {

        await deleteDoc(
            doc(
                firestoreDb,
                "products",
                documentId
            )
        );


        console.log(
            "Testprodukt gelöscht:",
            documentId
        );


        return true;

    }
    catch (error) {

        console.error(
            "Testprodukt konnte nicht gelöscht werden:",
            error
        );

        return false;
    }
}


// =======================================================
// Testfunktionen global bereitstellen
// =======================================================

window.addTestProduct =
    addTestProduct;

window.deleteTestProduct =
    deleteTestProduct;

// =======================================================
// Produktdaten-Version in Firestore speichern
// =======================================================

async function setProductDataVersion(version) {

    try {

        await setDoc(
            doc(
                firestoreDb,
                "metadata",
                "products"
            ),
            {
                version,
                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        console.log(
            "Produktdaten-Version gespeichert:",
            version
        );


        return true;

    }
    catch (error) {

        console.error(
            "Produktdaten-Version konnte nicht gespeichert werden:",
            error
        );


        return false;
    }
}


// =======================================================
// Produktdaten-Version aus Firestore lesen
// =======================================================

async function getProductDataVersion() {

    try {

        const documentSnapshot =
            await getDoc(
                doc(
                    firestoreDb,
                    "metadata",
                    "products"
                )
            );


        if (
            !documentSnapshot.exists()
        ) {

            console.log(
                "Noch keine zentrale Produktdaten-Version vorhanden."
            );


            return null;
        }


        const data =
            documentSnapshot.data();


        console.log(
            "Zentrale Produktdaten-Version:",
            data.version
        );


        return data.version;

    }
    catch (error) {

        console.error(
            "Produktdaten-Version konnte nicht gelesen werden:",
            error
        );


        return null;
    }
}



// =======================================================
// Produktliste nach Firestore übertragen
// =======================================================

async function uploadProductsToFirestore(
    productList
) {

    if (
        !Array.isArray(productList) ||
        productList.length === 0
    ) {

        console.error(
            "Keine Produktdaten zum Übertragen vorhanden."
        );

        return false;
    }


    try {

        const batch =
            writeBatch(
                firestoreDb
            );


        for (
            const product
            of productList
        ) {

            const documentReference =
                doc(
                    firestoreDb,
                    "products",
                    product.asin
                );


            batch.set(
                documentReference,
                {
                    productName:
                        product.productName,

                    colourVariant:
                        product.colourVariant,

                    manufacturerCode:
                        product.manufacturerCode,

                    ean:
                        product.ean,

                    sku:
                        product.sku,

                    pack:
                        product.pack,

                    asin:
                        product.asin
                }
            );
        }


        await batch.commit();


        console.log(
            `${productList.length} Produkte wurden nach Firestore übertragen.`
        );


        return true;

    }
    catch (error) {

        console.error(
            "Produktliste konnte nicht nach Firestore übertragen werden:",
            error
        );


        return false;
    }
}


// =======================================================
// Produktliste aus Firestore laden
// =======================================================

async function loadProductsFromFirestore() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    firestoreDb,
                    "products"
                )
            );


        const products = [];


        snapshot.forEach(
            documentSnapshot => {

                products.push(
                    documentSnapshot.data()
                );
            }
        );


        console.log(
            `${products.length} Produkte aus Firestore geladen.`
        );

        console.table(
            products
        );


        return products;

    }
    catch (error) {

        console.error(
            "Produktliste konnte nicht aus Firestore geladen werden:",
            error
        );


        return null;
    }
}

// =======================================================
// Ladefunktion global bereitstellen
// =======================================================

window.loadProductsFromFirestore =
    loadProductsFromFirestore;

// =======================================================
// Upload-Funktion global bereitstellen
// =======================================================

window.uploadProductsToFirestore =
    uploadProductsToFirestore;


// =======================================================
// Aktuelle Produktliste zentral in Firestore speichern
// =======================================================

async function saveProductListToFirestore(
    productList
) {

    if (
        !Array.isArray(productList) ||
        productList.length === 0
    ) {

        console.error(
            "Keine Produktdaten zum Speichern vorhanden."
        );

        return null;
    }


    try {

        // ---------------------------------------------------
        // Aktuelle zentrale Version lesen
        // ---------------------------------------------------

        const metadataReference =
            doc(
                firestoreDb,
                "metadata",
                "products"
            );


        const metadataSnapshot =
            await getDoc(
                metadataReference
            );


        const currentVersion =
            metadataSnapshot.exists()
                ? Number(
                    metadataSnapshot.data().version
                ) || 0
                : 0;


        const newVersion =
            currentVersion + 1;


        // ---------------------------------------------------
        // Vorhandene Firestore-Produkte lesen
        // ---------------------------------------------------

        const existingSnapshot =
            await getDocs(
                collection(
                    firestoreDb,
                    "products"
                )
            );


        const currentAsins =
            new Set(
                productList.map(
                    product =>
                        product.asin
                )
            );


        const batch =
            writeBatch(
                firestoreDb
            );


        // ---------------------------------------------------
        // Produkte löschen, die lokal nicht mehr existieren
        // ---------------------------------------------------

        existingSnapshot.forEach(
            documentSnapshot => {

                if (
                    !currentAsins.has(
                        documentSnapshot.id
                    )
                ) {

                    batch.delete(
                        documentSnapshot.ref
                    );
                }
            }
        );


        // ---------------------------------------------------
        // Aktuelle Produktliste schreiben
        // ---------------------------------------------------

        for (
            const product
            of productList
        ) {

            const productReference =
                doc(
                    firestoreDb,
                    "products",
                    product.asin
                );


            batch.set(
                productReference,
                {
                    productName:
                        product.productName,

                    colourVariant:
                        product.colourVariant,

                    manufacturerCode:
                        product.manufacturerCode,

                    ean:
                        product.ean,

                    sku:
                        product.sku,

                    pack:
                        product.pack,

                    asin:
                        product.asin
                }
            );
        }


        // ---------------------------------------------------
        // Neue Datenversion im selben Vorgang speichern
        // ---------------------------------------------------

        batch.set(
            metadataReference,
            {
                version:
                    newVersion,

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        await batch.commit();


        console.log(
            `${productList.length} Produkte zentral gespeichert.`
        );

        console.log(
            `Zentrale Produktdaten-Version: ${newVersion}`
        );


        return newVersion;

    }
    catch (error) {

        console.error(
            "Produktliste konnte nicht zentral gespeichert werden:",
            error
        );


        return null;
    }
}


// =======================================================
// Funktion global bereitstellen
// =======================================================

window.saveProductListToFirestore =
    saveProductListToFirestore;




// =======================================================
// Versionsfunktionen global bereitstellen
// =======================================================

window.setProductDataVersion =
    setProductDataVersion;

window.getProductDataVersion =
    getProductDataVersion;