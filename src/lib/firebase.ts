"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { fetchAndActivate, getRemoteConfig, getString } from "firebase/remote-config";
import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserProperties,
  type Analytics,
} from "firebase/analytics";

/**
 * Firebase Analytics (client-side, lazy). Usado pra medir o teste A/B de
 * /miniatura-pet. Best-effort: devolve null se faltar config ou o navegador
 * não suportar (bloqueadores, SSR).
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let analyticsPromise: Promise<Analytics | null> | null = null;

function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !config.apiKey || !config.measurementId) {
    return Promise.resolve(null);
  }
  analyticsPromise ??= isSupported()
    .then((ok) => {
      if (!ok) return null;
      const app = getApps().length ? getApp() : initializeApp(config);
      return getAnalytics(app);
    })
    .catch(() => null);
  return analyticsPromise;
}

type EventParams = Record<string, string | number | boolean>;

export async function logFirebaseEvent(name: string, params?: EventParams): Promise<void> {
  try {
    const analytics = await getFirebaseAnalytics();
    if (analytics) logEvent(analytics, name, params);
  } catch {
    // analytics é best-effort
  }
}

export async function setFirebaseUserProperties(props: Record<string, string>): Promise<void> {
  try {
    const analytics = await getFirebaseAnalytics();
    if (analytics) setUserProperties(analytics, props);
  } catch {
    // analytics é best-effort
  }
}

/**
 * Lê um parâmetro string do Remote Config (é por aqui que o experimento A/B do
 * console atribui a variante). Retorna `fallback` se o fetch falhar ou passar de
 * `timeoutMs`. O Analytics é inicializado antes: o A/B Testing precisa dele pra
 * inscrever o usuário no experimento.
 */
export async function getRemoteConfigString(
  key: string,
  fallback: string,
  timeoutMs = 3000,
): Promise<string> {
  if (typeof window === "undefined" || !config.apiKey || !config.appId) return fallback;
  try {
    await getFirebaseAnalytics();
    const app = getApps().length ? getApp() : initializeApp(config);
    const rc = getRemoteConfig(app);
    rc.defaultConfig = { [key]: fallback };
    rc.settings.minimumFetchIntervalMillis =
      process.env.NODE_ENV === "development" ? 0 : 60 * 60 * 1000;
    rc.settings.fetchTimeoutMillis = timeoutMs;
    await Promise.race([
      fetchAndActivate(rc),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
    return getString(rc, key) || fallback;
  } catch {
    return fallback;
  }
}
