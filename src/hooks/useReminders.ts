import { useEffect, useState } from "react";
import { repo } from "../lib/repo";
import {
  getNotificationPermission,
  msUntilNextDaily,
  requestNotificationPermission,
  showReminderNotification,
  type PermissionState,
} from "../lib/notifications";

// Owns the local daily-reminder preference (persisted through the repo seam) and,
// while the app is open, arms a timer to fire the next reminder. Enabling the
// reminder requests notification permission on the user's behalf.
export function useReminders() {
  const [prefs, setPrefs] = useState(() => repo.getReminderPrefs());
  const [permission, setPermission] = useState<PermissionState>(() =>
    getNotificationPermission()
  );

  useEffect(() => {
    repo.saveReminderPrefs(prefs);
  }, [prefs]);

  // Schedule the next daily nudge. Real background push (app closed) needs a
  // server + push tokens — deferred to the database phase.
  useEffect(() => {
    if (!prefs.enabled || permission !== "granted") return;

    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      timer = setTimeout(() => {
        showReminderNotification("Keep your streak alive — log today's workout.");
        arm(); // re-arm for the following day
      }, msUntilNextDaily(prefs.hour));
    };
    arm();

    return () => clearTimeout(timer);
  }, [prefs.enabled, prefs.hour, permission]);

  async function setEnabled(enabled: boolean) {
    if (enabled && permission !== "granted") {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result !== "granted") return; // denied/unsupported → stay disabled
    }
    setPrefs((p) => ({ ...p, enabled }));
  }

  function setHour(hour: number) {
    setPrefs((p) => ({ ...p, hour }));
  }

  return {
    enabled: prefs.enabled,
    hour: prefs.hour,
    permission,
    supported: permission !== "unsupported",
    setEnabled,
    setHour,
  };
}
