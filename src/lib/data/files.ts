"use client";

import { useEffect, useState } from "react";
import type { FileRef } from "@/lib/questionnaire/types";

/* Uploaded documents are kept in IndexedDB for Delivery 1; only their
 * metadata (FileRef) is stored in the case. */

const DB_NAME = "prerenta-files";
const STORE = "files";
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
/** HEIC/HEIF (iPhone photos) are listed by extension: some browsers report no type for them. */
export const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif,application/pdf";

const HEIC = /\.(heic|heif)$/i;
/** MIME type for a picked file, filling in HEIC/HEIF photos the browser left untyped. */
export const typeOf = (f: { name: string; type: string }) => f.type || (HEIC.test(f.name) ? (/f$/i.test(f.name) ? "image/heif" : "image/heic") : "");
/** The types the API stores (it checks the content, and rejects SVG, BMP, TIFF and the rest with 415). */
const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
/** Files the questionnaire accepts: PDF and photos (JPEG, PNG, WebP, GIF, HEIC/HEIF). */
export const isAccepted = (f: { name: string; type: string }) => TYPES.includes(typeOf(f));

let dbPromise: Promise<IDBDatabase> | null = null;
function db() {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const putFile = (id: string, blob: Blob) => run("readwrite", (s) => s.put(blob, id));
export const getFile = (id: string) => run<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);
export const deleteFile = (id: string) => run("readwrite", (s) => s.delete(id));

/** HEIC/HEIF photos: most browsers cannot display them, so they get a file icon and a download link. */
export const isHeic = (f: FileRef) => /^image\/hei[cf]/.test(f.type) || HEIC.test(f.name);
/** Images the browser can show inline. */
export const isImage = (f: FileRef) => f.type.startsWith("image/") && !isHeic(f);

/** Deletes every stored file (used to clear demo data when real accounts are on). */
export function purgeFiles() {
  dbPromise = null;
  return new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

/** Object URL for a stored file, or null while loading / for example files. */
export function useFileUrl(file: FileRef | null) {
  const [url, setUrl] = useState<{ id: string; url: string } | null>(null);
  const id = file && !file.example ? file.id : null;
  useEffect(() => {
    if (!id) return;
    let alive = true;
    let made: string | null = null;
    // API files are downloaded with the bearer token; demo files come from IndexedDB.
    const caseId = file?.remote;
    (caseId ? import("@/lib/api/endpoints").then((m) => m.api.downloadDocument(caseId, id)) : getFile(id))
      .then((b) => {
        if (!alive || !b) return;
        made = URL.createObjectURL(b);
        setUrl({ id, url: made });
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id, file?.remote]);
  return url && url.id === id ? url.url : null;
}
