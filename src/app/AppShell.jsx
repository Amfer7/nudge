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
import WorkoutEditor from "../components/WorkoutEditor";
import InfoSection from "../components/InfoSection";
import SettingsPanel from "../components/SettingsPanel";
import { useStreakPreferences } from "../hooks/useStreakPreferences";
import StreakPreferences from "../components/StreakPreferences";
import WelcomeBack from "../components/WelcomeBack";
import BlockDatesOverlay from "../components/BlockDatesOverlay";

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
    logDate, // TEST HELPER
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
  const [welcomePhase, setWelcomePhase] = useState("intro");
  const [blockPickerOpen, setBlockPickerOpen] = useState(false);
  
  const styles = {
    blockSection: {
      padding: "16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      borderTop: "1px solid var(--border)",
      marginTop: "16px",
    },

    blockTitle: {
      fontWeight: 600,
      marginBottom: "4px",
    },

    blockDesc: {
      fontSize: "14px",
      opacity: 0.7,
    },

    blockButton: {
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid var(--border)",
      background: "transparent",
      color: "var(--text)",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setWelcomePhase("docked");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    const onScroll = () => {
      setDocked(window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <div>
       <Navbar
        streak={currentStreak}
        freezeCount={freezeCount}
        docked={docked}
        onOpenSettings={() => setSettingsOpen(true)}
      />
     
     <WelcomeBack />
      
       <div id="page-content"></div>
      {/* Streak hero (tap to open calendar) */}
      <div onClick={() => setCalendarOpen(true)}>
        <StreakHero streak={currentStreak} docked={docked} />
      </div>

      {/* Primary habit action */}
      <LogTodayButton
        todayStatus={todayStatus}
        onLog={logToday}
        onUndo={undoToday}
      />

      {/* TEST HELPER - Remove in production
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <button
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            opacity: 0.5,
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
          onClick={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            logDate(yesterdayKey);
          }}
        >
          [TEST] Log Yesterday
        </button>
      </div> */}

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
        <div>
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
          <InfoSection />
        </SettingsPanel>
      )}

    </div>
  );
}

export default AppShell;
