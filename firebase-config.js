// STEP 1: Go to https://console.firebase.google.com
// STEP 2: Create a free project (any name, e.g. "pran-agro-inventory")
// STEP 3: In the project, go to Project settings > General > "Your apps" > click the </> (web) icon
// STEP 4: Register the app, copy the config object Firebase gives you, and paste it below
// STEP 5: In the left sidebar, go to Build > Firestore Database > "Create database" > start in production mode
// STEP 6: Go to the "Rules" tab in Firestore and paste the rules from firestore.rules in this folder, then Publish

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};
