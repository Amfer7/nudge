# Nudge 🏋️‍♂️

A minimalist fitness streak tracker focused on **consistency, forgiveness, and habit formation**.

Gym Streak is designed for people who want motivation without pressure — track your gym days, maintain streaks, and recover gracefully when life gets in the way.

---

## ✨ Features

- 🔥 **Streak Tracking**  
  See how many consecutive days you’ve stayed consistent.

- ❄️ **Streak Freezes**  
  Earn freezes by staying consistent. If you miss a day, a freeze is used automatically to protect your streak.

- 💤 **Sunday Rest Days**  
  Sundays never break your streak — but you can still log them if you go.

- 🗓️ **Weekly Workouts**  
  Assign and edit workouts by day of the week.

- 🌗 **Dark / Light Mode**  
  Clean, distraction-free UI with theme support.

- 💾 **Local Persistence**  
  All data is stored locally using `localStorage`. No accounts, no servers.

---

## 🧠 Design Philosophy

- **No guilt mechanics**  
  Missed days aren’t punished harshly.

- **Forgiveness over perfection**  
  Streak freezes exist for real life.

- **Minimal UI, strong feedback**  
  Subtle animations and micro-interactions instead of noisy gamification.

- **Offline-first**  
  The app works entirely in the browser.

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite  
- **State Management:** React hooks  
- **Persistence:** Browser `localStorage` (Soon backend database)
- **Deployment:** Vercel

---

## 🚀 Live Demo

👉 _Deployed on Vercel_  
https://nudge-virid.vercel.app

---

## 🧪 How Streaks Work (Simple Rules)

- Log a day → streak increases
- Miss a weekday:
  - If you have a freeze → freeze is used
  - If you don’t → streak breaks
- Rest days never break streaks
- Earn **1 freeze after 6 consecutive logged days**
- Max freezes: **3**

---

## 📦 Local Setup

```bash
git clone https://github.com/your-username/gym-streak.git
cd gym-streak
npm install
npm run dev
