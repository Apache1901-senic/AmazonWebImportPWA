"use strict";


// =======================================================
// Cache-Version
// =======================================================

const CACHE_NAME =
    "amazon-csv-importer-v5";


// =======================================================
// Offline-Startseite
// =======================================================

const OFFLINE_PAGE =
    "./index.html";


// =======================================================
// Programmdateien
// =======================================================

const APP_FILES = [

    "./",
    "./index.html",
    "./version.js",
    "./app.js",
    "./diagnostics.js",
    "./manifest.json",

    "./css/style.css",

    "./data/products.js",

    "./lib/xlsx.full.min.js",

    "./icons/icon-192.png",
    "./icons/icon-512.png"

];


// =======================================================
// INSTALL
//
// Grundbestand möglichst schon beim Installieren cachen.
// Wenn eine einzelne Datei einmal nicht erreichbar ist,
// scheitert nicht gleich der komplette Service Worker.
// =======================================================

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(async cache => {

                    console.log(
                        "Service Worker: Grundcache wird aufgebaut."
                    );


                    const results =
                        await Promise.allSettled(

                            APP_FILES.map(
                                async file => {

                                    try {

                                        const response =
                                            await fetch(
                                                file,
                                                {
                                                    cache: "no-store"
                                                }
                                            );


                                        if (!response.ok) {

                                            throw new Error(
                                                `${file}: HTTP ${response.status}`
                                            );

                                        }


                                        await cache.put(
                                            file,
                                            response.clone()
                                        );


                                        console.log(
                                            "Service Worker: gecacht:",
                                            file
                                        );

                                    }
                                    catch (error) {

                                        console.warn(
                                            "Service Worker: Datei konnte beim Installieren nicht gecacht werden:",
                                            file,
                                            error
                                        );

                                    }

                                }
                            )

                        );


                    return results;

                })
                .then(() => {

                    return self.skipWaiting();

                })

        );

    }
);


// =======================================================
// ACTIVATE
//
// Alte Cache-Versionen entfernen.
// =======================================================

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(cacheNames => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                name =>
                                    name !== CACHE_NAME
                            )
                            .map(
                                name => {

                                    console.log(
                                        "Service Worker: Alter Cache wird gelöscht:",
                                        name
                                    );

                                    return caches.delete(
                                        name
                                    );

                                }
                            )

                    );

                })
                .then(() => {

                    return self.clients.claim();

                })

        );

    }
);


// =======================================================
// Hilfsfunktion:
// Netzwerkantwort im Cache sichern
// =======================================================

async function saveResponseToCache(
    request,
    response
) {

    // Nur erfolgreiche Antworten cachen
    if (
        !response ||
        !response.ok
    ) {
        return;
    }


    // Nur eigene Programmdateien cachen
    const requestUrl =
        new URL(request.url);


    if (
        requestUrl.origin !==
        self.location.origin
    ) {
        return;
    }


    try {

        const cache =
            await caches.open(
                CACHE_NAME
            );


        await cache.put(
            request,
            response.clone()
        );

    }
    catch (error) {

        console.warn(
            "Service Worker: Antwort konnte nicht gecacht werden:",
            request.url,
            error
        );

    }
}


// =======================================================
// Navigation behandeln
//
// Strategie:
//
// 1. Netzwerk versuchen
// 2. erfolgreiche Antwort in Cache schreiben
// 3. bei Netzwerkausfall Cache verwenden
// 4. falls wirklich nichts vorhanden -> Notfallseite
// =======================================================

async function handleNavigation(
    request
) {

    try {

        const networkResponse =
            await fetch(
                request,
                {
                    cache: "no-store"
                }
            );


        if (networkResponse.ok) {

            const cache =
                await caches.open(
                    CACHE_NAME
                );


            // Unter der echten Anfrage speichern
            await cache.put(
                request,
                networkResponse.clone()
            );


            // Zusätzlich als feste Offline-Startseite sichern
            await cache.put(
                OFFLINE_PAGE,
                networkResponse.clone()
            );

        }


        return networkResponse;

    }
    catch (networkError) {

        console.log(
            "Service Worker: Netzwerk nicht erreichbar – Offline-Modus."
        );


        // Zuerst exakt angeforderte Navigation suchen
        const cachedRequest =
            await caches.match(
                request
            );


        if (cachedRequest) {

            return cachedRequest;

        }


        // Danach unsere feste index.html
        const cachedPage =
            await caches.match(
                OFFLINE_PAGE
            );


        if (cachedPage) {

            return cachedPage;

        }


        // Wirklich gar nichts vorhanden
        return new Response(
            `
            <!DOCTYPE html>

            <html lang="de">

            <head>

                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >

                <title>
                    Amazon CSV Importer
                </title>

            </head>


            <body
                style="
                    font-family: Segoe UI, Arial, sans-serif;
                    padding: 40px;
                    background: #f3f4f6;
                    color: #252525;
                "
            >

                <h1>
                    Amazon CSV Importer
                </h1>

                <h2>
                    Offline-Cache nicht verfügbar
                </h2>

                <p>
                    Die Anwendung konnte weder über den
                    MiniServer noch aus dem Offline-Cache
                    geladen werden.
                </p>

                <p>
                    Bitte starte den MiniServer einmal
                    und lade die Anwendung erneut.
                </p>

            </body>

            </html>
            `,
            {
                status: 503,

                headers: {

                    "Content-Type":
                        "text/html; charset=utf-8"

                }
            }
        );

    }
}


// =======================================================
// Normale Programmdateien
//
// Ebenfalls Network First:
//
// Server vorhanden:
//     aktuelle Datei laden + Cache aktualisieren
//
// Server nicht vorhanden:
//     Cache verwenden
// =======================================================

async function handleStaticRequest(
    request
) {

    try {

        const networkResponse =
            await fetch(
                request,
                {
                    cache: "no-store"
                }
            );


        if (networkResponse.ok) {

            await saveResponseToCache(
                request,
                networkResponse
            );

        }


        return networkResponse;

    }
    catch (networkError) {

        const cachedResponse =
            await caches.match(
                request
            );


        if (cachedResponse) {

            return cachedResponse;

        }


        throw networkError;

    }
}


// =======================================================
// FETCH
// =======================================================

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;


        // Nur GET
        if (
            request.method !== "GET"
        ) {
            return;
        }


        const requestUrl =
            new URL(
                request.url
            );


        // Fremde Domains nicht behandeln
        if (
            requestUrl.origin !==
            self.location.origin
        ) {
            return;
        }


        // ------------------------------------------------
        // Seitenaufruf / F5 / PWA-Start
        // ------------------------------------------------

        if (
            request.mode === "navigate"
        ) {

            event.respondWith(
                handleNavigation(
                    request
                )
            );

            return;

        }


        // ------------------------------------------------
        // CSS / JS / Icons / Manifest usw.
        // ------------------------------------------------

        event.respondWith(
            handleStaticRequest(
                request
            )
        );

    }
);