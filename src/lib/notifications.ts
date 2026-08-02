// Local (client-side) reminder notifications — a scaffold for the "Nudge" habit
// prompt. These fire via the Notification API *while a tab/PWA window is open*.
// True background/server push (which works when the app is closed) needs a user
// identity + push tokens and is deferred to the database phase.
//
// The scheduling math (`msUntilNextDaily`) is pure and unit-tested; the browser
// bindings are thin wrappers guarded for unsupported environments.

export type PermissionState = NotificationPermission | "unsupported";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): PermissionState {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function showReminderNotification(body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification("Nudge", {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      tag: "nudge-daily-reminder", // collapse repeats into a single notification
    });
  } catch {
    // Some platforms only allow notifications via the service worker registration;
    // swallowing keeps this scaffold safe until push lands in the DB phase.
  }
}

// Milliseconds from `now` until the next occurrence of `hour:00` in local time.
// If that time has already passed today, targets the same hour tomorrow.
export function msUntilNextDaily(hour: number, now: Date = new Date()): number {
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}
