# PRAN Agro — Store Inventory System

A free, independent, shareable website for tracking store inventory: stock received,
items issued to departments (Engineering, Koreana Snacks, Extruded Snacks, Laccha,
Bakery, Store), and live quantities. No login required — anyone with the link can
view and update, so only share the link with your own team.

## What you need (both free)
- A **GitHub** account — hosts the website itself
- A **Firebase** account (uses your Google account) — hosts the shared database, so
  everyone sees the same live inventory

## Setup — Part 1: Firebase (the database)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project**. Name it anything, e.g. `pran-agro-inventory`. Disable Google
   Analytics (not needed) and click **Create project**.
3. In the left sidebar: **Build > Firestore Database > Create database**.
   - Choose a location close to Bangladesh (e.g. `asia-south1`).
   - Start in **production mode**.
4. Go to the **Rules** tab of Firestore, delete the existing rules, and paste in the
   contents of `firestore.rules` from this folder. Click **Publish**.
5. Go to **Project settings** (gear icon, top left) > scroll to **Your apps** >
   click the **</>** (web) icon > register an app (any nickname) > **do not** check
   Firebase Hosting.
6. Firebase will show a `firebaseConfig` object. Copy the whole thing.
7. Open `firebase-config.js` in this folder and paste your values in place of the
   `PASTE_YOUR_..._HERE` placeholders. Save the file.

## Setup — Part 2: GitHub Pages (the website)

1. Go to https://github.com and create a free account if you don't have one.
2. Click **New repository**. Name it e.g. `pran-agro-inventory`. Set it to **Public**.
   Click **Create repository**.
3. On the new repo page, click **uploading an existing file**, then drag in all the
   files from this folder (`index.html`, `style.css`, `app.js`, `firebase-config.js`
   with your keys filled in, `firestore.rules`, `README.md`). Commit the changes.
4. In the repo, go to **Settings > Pages**.
5. Under **Build and deployment > Source**, choose **Deploy from a branch**.
   Branch: `main`, folder: `/ (root)`. Click **Save**.
6. Wait 1–2 minutes, then refresh the page — GitHub will show your live URL, e.g.
   `https://yourusername.github.io/pran-agro-inventory/`

That link is your independent, permanent website. Share it with your team — Store,
Engineering, and every production department can open it on any phone or computer.

## Using it
- **Store In** — Store department logs every item that arrives, with quantity.
- **Issue Item** — any department logs what they take; stock reduces automatically
  and can't go negative.
- **All Items** and **Dashboard** — always show the current, real quantity on hand.
- **Transactions** — full history of what came in and what went where.

## Notes
- There's no login system, so anyone with the link can add/remove stock — share the
  link only with people inside PRAN Agro who should have access.
- Firebase's free tier (Spark plan) comfortably covers a single factory's daily
  inventory traffic at no cost.
- If you later want login per department, restricted permissions, or barcode
  scanning, those can be added — Firebase Authentication supports that on the same
  free project.
