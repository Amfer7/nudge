import { useState, useEffect } from "react";
import { useDayRecords } from "../hooks/useDayRecords";
import { useWorkouts } from "../hooks/useWorkouts";
import { useExerciseCompletion } from "../hooks/useExerciseCompletion";
import { useTheme } from "../hooks/useTheme";
import ThemeSelector from "../components/ThemeSelector";
import Navbar from "../components/Navbar";
import StreakHero from "../components/StreakHero";
import LogTodayButton from "../components/LogTodayButton";
import CalendarOverlay from "../components/CalendarOverlay";
import WeeklyWorkoutSection from "../components/WeeklyWorkoutSection";
import PRSection from "../components/PRSection";
import WorkoutEditor from "../components/WorkoutEditor";
import InfoSection from "../components/InfoSection";
import SettingsPanel from "../components/SettingsPanel";
import { useStreakPreferences } from "../hooks/useStreakPreferences";
import StreakPreferences from "../components/StreakPreferences";
import WelcomeBack from "../components/WelcomeBack";
import BlockDatesOverlay from "../components/BlockDatesOverlay";
import WhatsNewCard from "../components/WhatsNewCard";
import { APP_NAME, APP_VERSION } from "./version";

function AppShell() {
  // ---- streak / logging ----
  const {
    dayRecords,
    todayStatus,
    currentStreak,
    freezeCount,
    logToday,
    undoToday,
    blockDates,
    unblockDate,
    resetProgress,
    dayOffset,
    setDayOffset,
    todayKey,
    devSummary,
  } = useDayRecords();

  // ---- workouts ----
  const { workouts, updateWorkout } = useWorkouts();
  const { completed, toggleExercise } = useExerciseCompletion();

  const todayIndex = new Date().getDay(); // 0 = Sunday
  const [editingDay, setEditingDay] = useState(null);

  // ---- calendar ----
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { freezeVisibility, setFreezeVisibility } = useStreakPreferences();

  const [docked, setDocked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [blockPickerOpen, setBlockPickerOpen] = useState(false);
  
  const styles = {
    root: {
      minHeight: "100vh",
    },
    page: {
      maxWidth: "760px",
      margin: "0 auto",
      position: "relative",
      width: "100%",
    },
    blockSection: {
      padding: "8px 0 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px",
      margin: "0 16px 0",
    },
    blockContent: {
      flex: 1,
      minWidth: 0,
    },

    blockTitle: {
      fontWeight: 600,
      marginBottom: "6px",
      fontSize: "28px",
      letterSpacing: "0.2px",
    },

    blockDesc: {
      fontSize: "14px",
      lineHeight: 1.45,
      color: "var(--text-muted)",
      paddingRight: "16px",
      paddingTop: "4px",
    },

    blockButton: {
      padding: "12px 18px",
      borderRadius: "10px",
      border: "1px solid rgba(45, 255, 196, 0.55)",
      background: "rgba(7, 22, 14, 0.72)",
      color: "var(--text)",
      cursor: "pointer",
      whiteSpace: "nowrap",
      fontWeight: 700,
      fontSize: "14px",
      letterSpacing: "0.2px",
      marginLeft: "auto",
      flexShrink: 0,
    },
    footer: {
      marginTop: "14px",
      padding: "10px 16px 20px",
      borderTop: "1px solid var(--border)",
      fontSize: "14px",
      color: "var(--text-muted)",
      textAlign: "center",
    },
  };

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.max(0, Math.min(1, window.scrollY / 120));
      setScrollProgress(progress);
      setDocked(progress > 0.7);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <div style={styles.root}>
       <Navbar
        streak={currentStreak}
        freezeCount={freezeCount}
        docked={docked}
        scrollProgress={scrollProgress}
        onOpenSettings={() => setSettingsOpen(true)}
      />
     <main style={styles.page}>
      <WelcomeBack isLogged={todayStatus === "logged"} />
      
       <div id="page-content"></div>
      {/* Streak hero (tap to open calendar) */}
      <div onClick={() => setCalendarOpen(true)}>
        <StreakHero streak={currentStreak} docked={docked} scrollProgress={scrollProgress} />
      </div>

      {/* Primary habit action */}
      <LogTodayButton
        todayStatus={todayStatus}
        onLog={logToday}
        onUndo={undoToday}
      />

      <PRSection />

      {import.meta.env.DEV && (
      <div
        style={{
          margin: "16px 16px 8px",
          padding: "12px",
          border: "1px dashed rgba(45, 255, 196, 0.55)",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          fontSize: "14px",
          opacity: 0.9,
          background: "rgba(11, 20, 36, 0.55)",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span>DEV:</span>

          <button onClick={() => setDayOffset(o => o - 7)}>
            -7
          </button>

          <button onClick={() => setDayOffset(o => o - 1)}>
            -1
          </button>

          <button onClick={() => setDayOffset(0)}>
            Today
          </button>

          <button onClick={() => setDayOffset(o => o + 1)}>
            +1
          </button>

          <button onClick={() => setDayOffset(o => o + 7)}>
            +7
          </button>

          <button onClick={resetProgress}>
            Reset
          </button>

          <span style={{ marginLeft: "auto" }}>
            Simulated day: {todayKey} (offset {dayOffset >= 0 ? `+${dayOffset}` : dayOffset})
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "6px 10px",
            fontSize: "12px",
            opacity: 0.85,
          }}
        >
          <span>Status: {devSummary.todayStatus}</span>
          <span>Streak: {devSummary.currentStreak}</span>
          <span>Freezes: {devSummary.freezeCount}</span>
          <span>Earn ready: {devSummary.eligibleForFreezeEarn ? "yes" : "no"}</span>
          <span>Spend target: {devSummary.freezeSpendCandidate ?? "none"}</span>
        </div>
      </div>
    )}

      {/* Weekly workout planner */}
      <WeeklyWorkoutSection
        workouts={workouts}
        todayIndex={todayIndex}
        completed={completed}
        onToggleExercise={toggleExercise}
        onEditDay={(day) => setEditingDay(day)}
      />

      {/* Workout editor bottom sheet */}
      {editingDay !== null && (
        <WorkoutEditor
          initialWorkout={workouts[editingDay]}
          onSave={(w) => updateWorkout(editingDay, w)}
          onClose={() => setEditingDay(null)}
        />
      )}

      <section style={styles.blockSection}>
        <div style={styles.blockContent}>
          <div style={styles.blockTitle}>Planned time off</div>
          <div style={styles.blockDesc}>
            Going to be away or unable to train?
            Block dates ahead of time so your streak isn’t affected. (Must be after 48 hours)
          </div>
        </div>

        <button
          style={styles.blockButton}
          onClick={() => setBlockPickerOpen(true)}
        >
          Block dates
        </button>
      </section>

      {/* Calendar overlay */}
      <CalendarOverlay
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        dayRecords={dayRecords}
        freezeVisibility={freezeVisibility}
        anchorDateKey={todayKey}
      />

      <BlockDatesOverlay
        visible={blockPickerOpen}
        onClose={() => setBlockPickerOpen(false)}
         dayRecords={dayRecords}
          onBlock={blockDates}
          onUnblock={unblockDate}
      />

      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)}>
          <ThemeSelector theme={theme} onChange={setTheme} />
          <StreakPreferences
            freezeVisibility={freezeVisibility}
            onChange={setFreezeVisibility}
          />
          <WhatsNewCard />
          <InfoSection />
        </SettingsPanel>
      )}

      <footer style={styles.footer}>
        {APP_NAME} {APP_VERSION}
        <br />
         {"\u00A9"} 2026 Amfer. All rights reserved.
      </footer>
     </main>
    </div>
    
  );
  
}

export default AppShell;

