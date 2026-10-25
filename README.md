# 📅 YearGrid — 365-Day Minimalist Habit Tracker

![HTML5](https://img.shields.io/badge/HTML5-Semantic-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Grid_%26_Variables-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla_ES6+-F7DF1E?logo=javascript&logoColor=black)
![Privacy](https://img.shields.io/badge/Privacy-100%25_Offline_localStorage-2EA043)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-38bdf8?logo=github)](https://gabzieg.github.io/YearGrid/)

**YearGrid** is a zero-dependency, high-contrast web application designed to track daily consistency across a full **365-day GitHub-style heatmap**. Built with pure HTML, CSS, and Vanilla JavaScript, it runs 100% offline in your browser with instant single-click logging and portable JSON backups.

👉 **[Try YearGrid Live in Your Browser (GitHub Pages)](https://gabzieg.github.io/YearGrid/)**

---

## 💡 Why YearGrid?

Most habit trackers lock your data behind subscriptions, require account sign-ups, or bury a simple daily check-in under cluttered menus.

**YearGrid** strips away the friction:
- Open the page (or save it as a bookmark / local file).
- Log any habit in **one click**.
- Visualize your entire year at a glance with a **GitHub contribution-style heatmap**.
- Own your data forever with **one-click `.json` Vault export & restore**.

---

## ✨ Key Features

- 🟩 **365-Day GitHub-Style Heatmap:** Panoramic yearly consistency grid for every habit you track.
- ⚡ **Instant SPA Navigation:** Switch smoothly between the global Overview Dashboard and deep-dive analytics for individual habits without page reloads.
- 📊 **Timeframe Slicing:** Filter habit performance dynamically by **Year**, **Month**, or **Week**.
- 🔒 **100% Offline & Private:** All progress is saved instantaneously to your browser's `localStorage`. Zero servers, zero accounts, zero tracking.
- 💾 **Portable JSON Vault:** Export your entire history to a `.json` backup file anytime and restore it across browsers or computers in seconds.
- ⌨️ **Keyboard-First UX:** Custom immersive modals (no native browser `alert()`/`prompt()` popups) with `Enter`-key shortcuts for rapid habit creation.

---

## 🚀 How to Use

### Option 1: Use Instantly Online
Visit **[https://gabzieg.github.io/YearGrid/](https://gabzieg.github.io/YearGrid/)** — your data stays saved in your own browser's local storage.

### Option 2: Run 100% Locally Offline
Because it has zero build steps or server dependencies, running it locally takes seconds:

```bash
git clone https://github.com/gabzieg/YearGrid.git
cd YearGrid
```
Simply double-click **`index.html`** to open it in any browser!

> 💡 **Backup Tip:** Use the built-in **Export JSON** button periodically if you plan to clear your browser's site data or switch devices.

---

## 🛠️ Tech Stack

- **HTML5:** Semantic structure and accessible modal dialogs.
- **CSS3:** Custom design tokens (CSS variables), responsive CSS Grid heatmap layout, high-contrast minimalist theme.
- **JavaScript (Vanilla ES6+):** Client-side SPA state management, dynamic heatmap date calculation, `localStorage` persistence, and JSON file import/export via `Blob` & `FileReader` APIs.
