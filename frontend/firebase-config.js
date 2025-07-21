//  firebase-config.js – Final Version

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

//  Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBoRZ2pIkwaGTAvgfMS6dITELGNHQJucaY",
  authDomain: "recipeplatform-fc00c.firebaseapp.com",
  projectId: "recipeplatform-fc00c",
  storageBucket: "recipeplatform-fc00c.appspot.com",
  messagingSenderId: "330981372927",
  appId: "1:330981372927:web:238b030dbb02989d2e6dca",
  measurementId: "G-44RSQ53S0T"
};

//  Initialize Firebase app
const app = initializeApp(firebaseConfig);

//  Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
