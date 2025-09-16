// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDA2qwwoF7GELvhp4UzGeceTajJJhauYJ8",
    authDomain: "studio-6228903307-46c1c.firebaseapp.com",
    projectId: "studio-6228903307-46c1c",
    storageBucket: "studio-6228903307-46c1c.appspot.com",
    messagingSenderId: "564947118922",
    appId: "1:564947118922:web:e7bde2fab7767ee7796fb3"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
