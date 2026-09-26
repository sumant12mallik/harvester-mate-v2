# 🛠️ Setup Guide

## Prerequisites

- Modern browser (Chrome, Safari)
- Firebase account (free)
- GitHub account (free)
- Netlify account (free)

## Step 1: Firebase Setup

1. [Firebase Console](https://console.firebase.google.com) kholo
2. **Add project** → Name: `HarvesterMate`
3. **Authentication** → Enable **Email/Password**
4. **Firestore Database** → Create database → Test mode → `asia-south1`
5. **Project Settings** → Web App add karo
6. Config copy karo aur `js/config/firebase-config.js` me paste karo

## Step 2: Local Test

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .