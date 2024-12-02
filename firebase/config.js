import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// Get this from your Firebase Console -> Project Settings -> General -> Your Apps -> SDK setup and configuration
const firebaseConfig = {
    apiKey: "AIzaSyDs1KGX96qrgv6r-H95qK9H4Ig5ZhjxXwQ",
    authDomain: "iknowaspot-442402.firebaseapp.com",
    projectId: "iknowaspot-442402",
    storageBucket: "iknowaspot-442402.firebasestorage.app",
    messagingSenderId: "364393581693",
    appId: "1:364393581693:web:4393db7da9aa857a4e7514",
    measurementId: "G-V7HZ8QE44Y"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export { auth }; 