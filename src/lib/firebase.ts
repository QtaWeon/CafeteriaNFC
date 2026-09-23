import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBu9Hs8-107WELKQDz5H8t6gmsmKHOVHGU",
  authDomain: "dine-and-tap.firebaseapp.com",
  projectId: "dine-and-tap",
  storageBucket: "dine-and-tap.firebasestorage.app",
  messagingSenderId: "1056463613689",
  appId: "1:1056463613689:web:7e47ab923a87e4c1407c28",
  measurementId: "G-FNT2MNVH7S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
