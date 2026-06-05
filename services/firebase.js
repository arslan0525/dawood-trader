import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            "AIzaSyA_8bIdyenFmloY_ZqMvvuNl3Fojd1QFOo",
  authDomain:        "dawood-tarder.firebaseapp.com",
  projectId:         "dawood-tarder",
  storageBucket:     "dawood-tarder.firebasestorage.app",
  messagingSenderId: "131910909480",
  appId:             "1:131910909480:web:918f94f2f463cd27237f1d",
};

export const IS_DEMO = false;

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage),
});

export const db      = getFirestore(app);
export const storage = getStorage(app);
