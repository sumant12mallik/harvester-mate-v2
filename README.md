# 🌾 HarvesterMate

> Complete business management app for Harvester Owners

Harvester owners ke liye ek powerful, mobile-first web app — jo customer tracking, time calculation (2W/4W timer), manual payments, diesel, expenses, aur season reports sab kuch ek jagah handle karta hai.

---

## ✨ Features

- ⏱️ **Time Calculation** — Independent 2-wheel & 4-wheel timers
- 👥 **Customer Management** — Add, edit, search customers
- 💰 **Manual Payments** — Cash / UPI / Cheque
- 📱 **WhatsApp Auto Messages** — Work done, payment received, thank you
- ⛽ **Diesel Tracking** — Usage + cost
- 🔧 **Repair Work** — Record & track
- 💵 **Personal Expense** — Track all expenses
- 🤝 **Dealer Ledger** — Len-den records
- 👤 **Driver Attendance** — Present/absent + payment
- 📊 **Season Reports** — Profit/loss analytics
- 🔍 **Advanced Search** — Name / Number / Village
- 📅 **Season & Year** — Multi-season data isolation
- 🔄 **Offline Support** — Cache + auto sync
- 📄 **HTML Invoice** — Download & share
- 🌐 **PWA** — Install on home screen
- 📱 **Play Store Ready** — TWA wrapper compatible

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS (ES Modules) |
| Backend | Firebase (Auth + Firestore + Storage) |
| Payments | Manual (Cash / UPI / Cheque) |
| Hosting | Netlify |
| PWA | Service Worker + Manifest |
| Play Store | TWA (Trusted Web Activity) |

---

## 📁 Project Structure

```
harvester-mate/
├── index.html              # Splash screen
├── offline.html            # Offline page
├── manifest.json           # PWA manifest
├── service-worker.js       # PWA offline
├── pages/                  # All HTML pages
│   ├── auth/               # Login, register
│   ├── app/                # Main app pages
│   ├── admin/              # Admin panel
│   ├── user/               # Regular user
│   └── legal/              # Privacy, terms, etc.
├── css/                    # Stylesheets
├── js/                     # JavaScript modules
├── assets/                 # Images, icons
└── docs/                   # Documentation
```

---

## 🛠️ Setup

### 1. Firebase Setup

1. [Firebase Console](https://console.firebase.google.com) → Project
2. Web App add karo
3. **Firestore Database** enable karo
4. **Authentication** → Email/Password enable karo
5. Config copy karke `js/config/firebase-config.js` me paste karo

### 2. Local Test

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Browser: `http://localhost:8080`

### 3. Netlify Deploy

1. GitHub pe push karo
2. [Netlify](https://netlify.com) → Import from GitHub
3. Deploy

---

## 📱 Play Store (TWA)

1. [PWABuilder](https://pwabuilder.com) → URL daalo
2. Android package download karo
3. Play Console me upload

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

**Made with ❤️ for Indian Farmers**

🌾 **For a Better Harvest Tomorrow** 🌾