/**
 * Promemoria browser via Notification API per contenuti scheduled per oggi.
 *
 * Strategy:
 * - Permission richiesta on-demand (no aggressive prompt).
 * - Quando i contenuti vengono caricati, check se ce ne sono "scheduledToday".
 * - Mostra UNA notifica al giorno per progetto (dedup tramite localStorage).
 *
 * Lo storage di dedup è: 'notif-shown:{projectId}:{yyyy-mm-dd}' → '1'.
 */

const STORAGE_PREFIX = "notif-shown:";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/**
 * Mostra una notifica per i contenuti programmati per oggi, MA solo una volta
 * al giorno per progetto (dedup via localStorage). Idempotente: chiamabile
 * più volte allo stesso load senza spam.
 */
export function notifyScheduledToday(
  projectId: string,
  projectName: string,
  count: number,
): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;
  if (count === 0) return false;
  const today = new Date().toISOString().slice(0, 10);
  const key = `${STORAGE_PREFIX}${projectId}:${today}`;
  try {
    if (localStorage.getItem(key) === "1") return false;
    localStorage.setItem(key, "1");
  } catch {
    // localStorage non disponibile: mostra comunque, no dedup
  }
  try {
    new Notification(`📅 ${projectName}`, {
      body: `${count} ${count === 1 ? "contenuto" : "contenuti"} da pubblicare oggi`,
      icon: "/favicon.ico",
      tag: `today-${projectId}`, // sostituisce notifiche con lo stesso tag
    });
    return true;
  } catch {
    return false;
  }
}
