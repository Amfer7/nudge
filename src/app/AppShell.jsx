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

function AppShell() {
  // ---- streak / logging ----
  const {
    dayRecords,
    todayStatus,
    currentStreak,
    freezeCount,
    logToday,
    undoToday,
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

      {/* Calendar overlay */}
      <CalendarOverlay
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        dayRecords={dayRecords}
        freezeVisibility={freezeVisibility}
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
