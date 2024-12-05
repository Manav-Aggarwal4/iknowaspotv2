import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
    apiKey: "AIzaSyDs1KGX96qrgv6r-H95qK9H4Ig5ZhjxXwQ",
    authDomain: "iknowaspot-442402.firebaseapp.com",
    projectId: "iknowaspot-442402",
    storageBucket: "iknowaspot-442402.firebasestorage.app",
    messagingSenderId: "364393581693",
    appId: "1:364393581693:web:4393db7da9aa857a4e7514",
    measurementId: "G-V7HZ8QE44Y"
  };

  
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();


const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});


const db = getFirestore(app);

export { app, auth, db }; 