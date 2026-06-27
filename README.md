# FocusHub

✅ **A premium, dark‑mode‑first learning hub** for videos, articles, and playlists. It helps you stay focused, track progress, and keep all your learning resources in one place.

---

## ✨ Features
- **Dashboard** – Greeting, date, motivational quote, streak, and today’s queue.
- **Playlist URLs** – Each playlist has its own shareable URL (`#/playlists/<id>`).
- **Seamless playlist playback** – When watching a video from a playlist you get a "Back to Playlist" breadcrumb and a "Next Video" button.
- **Automatic in‑progress tracking** – Starts a video automatically marks it *In Progress*.
- **Article viewer** – Card view or iframe (experimental) with a fallback message.
- **Collapsible sidebar** – Maximises space for the main view.
- **YouTube Data API integration** – Import videos & full playlists via URL.
- **Fully offline‑first** – All data persisted in IndexedDB, auto‑sync when online.
- **Rich UI** – Glass‑morphism, vibrant gradients, smooth micro‑animations.

---

## 📦 Quick Start (Local Development)

### Prerequisites
- **Node.js** (v18 or later) and **npm** (v9+)
- A **YouTube Data API v3** key (see below)

### Installation
```bash
# 1️⃣ Clone the repo
git clone https://github.com/DineshrajAnandan/FocusHub.git
cd FocusHub

# 2️⃣ Install dependencies
npm install
```

### Configure YouTube API Key
The YouTube API key is set from the **Settings** page inside the app (gear icon).  
Enter your key there; it will be stored securely and used for YouTube Data API requests.  
> **Why needed?** The key enables importing videos/playlists and performing YouTube searches.  
> Without it, those features are disabled and you’ll see an error when trying to add YouTube resources.

### Run the development server
```bash
npm run dev
```
Open <http://localhost:5173> (or the URL displayed in the terminal).

---

## 🔑 How to Obtain a YouTube Data API Key
1. Go to the **Google Cloud Console** – <https://console.cloud.google.com/>
2. Create (or select) a project.
3. Enable the **YouTube Data API v3** under *APIs & Services → Library*.
4. Navigate to *APIs & Services → Credentials* and click **Create credentials → API key**.
5. Copy the generated key and paste it into the `.env` file as shown above.
6. (Optional) Restrict the key to your domain or localhost for security.

---

## 📚 Usage Guide
### Dashboard
- Shows a dynamic greeting based on the time of day, the current date, a random motivational quote, and your learning streak.
- The biggest tile displays the most recent **in‑complete** video ("Continue Watching").
- Below it, the **Today's Queue** lists planned resources.

### Sidebar
- Click the hamburger icon to collapse/expand. When collapsed, an *Expand* button appears.
- Navigation links: Dashboard, Playlists, Articles, Queue, Settings.

### Playlists
- **Create** a playlist by pasting a YouTube playlist URL.
- Each playlist is stored with a unique ID. You can share the URL (`#/playlists/<id>`).
- Inside a playlist you see thumbnails, titles, progress bars, and a **Delete** button.
- Clicking a video opens the **FocusPlayer**.

### FocusPlayer (Video / Article Viewer)
- **Back button** adapts: "Back to Dashboard" or "Back to Playlist" with a breadcrumb.
- When viewing a video in a playlist you get a **Next Video** button that jumps to the next item.
- Articles can be shown as a **Reading Card** or an **Embedded iframe** (experimental).
- Notes panel on the right syncs automatically to IndexedDB and cloud (if online).

### Adding Resources
- **Videos / YouTube search** – Use the top bar in the Queue view.
- **Playlists** – Add via the dedicated playlist dialog (top of the Playlists page).
- **Articles** – Add on the Articles page; the URL is stored and displayed with a preview.

---

## 🛠️ Project Structure (high‑level)
```
src/
├─ components/          # React components (Dashboard, Playlists, FocusPlayer, …)
├─ services/            # IndexedDB wrappers, YouTube API utils
├─ types.ts             # TypeScript definitions for Video, Playlist, Article, …
├─ App.tsx              # Router & global state handling
├─ index.html & index.css
└─ ...
```

---

## 🎨 Design Philosophy
- **Premium look** – Dark mode, vibrant gradients, modern typography (Inter), glass‑morphism.
- **Micro‑animations** – Hover effects, smooth transitions for an alive UI.
- **Accessibility** – Semantic HTML, proper heading hierarchy, ARIA labels where needed.

---

## 🚀 Production Build
```bash
npm run build   # creates the optimized `dist/` folder
# Serve with any static server, e.g. `npx serve dist`
```

---

## 🙋‍♀️ Contributing
1. Fork the repo.
2. Create a feature branch.
3. Ensure `npm run dev` builds without errors.
4. Submit a PR with a clear description and screenshots.

---

## 📜 License
MIT – Feel free to use, modify, and share.

---

**Enjoy your focused learning journey with FocusHub!**
