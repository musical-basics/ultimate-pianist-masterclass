"use client";

import { useEffect, useRef } from "react";

const ANALYTICS_URL =
  process.env.NEXT_PUBLIC_DREAMPLAY_ANALYTICS_URL ||
  "https://data.dreamplaypianos.com";

const SESSION_KEY = "dp_session_id";
const PAGEVIEW_FIRED_KEY = "dp_first_page_view_fired";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

function readMetadataFromUrl(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  const sid = params.get("sid");
  const cid = params.get("cid");
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmContent = params.get("utm_content");
  if (sid) out.sid = sid;
  if (cid) out.cid = cid;
  if (utmSource) out.utm_source = utmSource;
  if (utmMedium) out.utm_medium = utmMedium;
  if (utmCampaign) out.utm_campaign = utmCampaign;
  if (utmContent) out.utm_content = utmContent;
  return out;
}

async function fireBeacon(eventName: string, extra: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const urlMeta = readMetadataFromUrl();
  // Prefix the path with the host so dashboards can distinguish a "/" on
  // ultimatepianist.com from a "/" on dreamplaypianos.com or any other
  // origin that posts to the same analytics_logs table.
  const fullPath =
    window.location.host + window.location.pathname + window.location.search;

  const payload = {
    eventName,
    path: fullPath,
    sessionId: getOrCreateSessionId(),
    metadata: {
      site: "musicalbasics",
      brand: "ultimate-pianist",
      host: window.location.host,
      referrer: document.referrer || null,
      ...urlMeta,
      ...extra,
    },
  };

  try {
    const body = JSON.stringify(payload);
    // Prefer sendBeacon for unload-resilience on session_end
    if (
      eventName === "session_end" &&
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(`${ANALYTICS_URL}/api/track`, blob);
      return;
    }
    await fetch(`${ANALYTICS_URL}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Silent: analytics failures must not affect page UX
  }
}

export default function DpAnalyticsBeacon() {
  const startedAtRef = useRef<number>(0);
  const lastPathRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    startedAtRef.current = Date.now();
    lastPathRef.current = window.location.pathname + window.location.search;

    // Fire pageview once per session (not per route push, since this page is
    // a single-route landing). Avoids double-firing on hot reload in dev.
    const alreadyFired = window.sessionStorage.getItem(PAGEVIEW_FIRED_KEY);
    if (!alreadyFired) {
      void fireBeacon("page_view");
      try {
        window.sessionStorage.setItem(PAGEVIEW_FIRED_KEY, "1");
      } catch {
        // ignore
      }
    }

    const handleSessionEnd = () => {
      const elapsedSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      void fireBeacon("session_end", { duration: elapsedSeconds });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSessionEnd();
      }
    };

    window.addEventListener("pagehide", handleSessionEnd);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handleSessionEnd);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
