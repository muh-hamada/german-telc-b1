// Firebase configuration
// Note: In a real app, these values would come from environment variables
// For development, you can use the Firebase console to get these values

export const firebaseConfig = {
  apiKey: "AIzaSyAdM3mACEJ0TfHgJjyOjOIKqqp5RuGHlqU",
  authDomain: "telc-b1-german.firebaseapp.com",
  projectId: "telc-b1-german",
  storageBucket: "telc-b1-german.firebasestorage.app",
  messagingSenderId: "494473710301",
  appId: "1:494473710301:android:1b5d40d4f9e1b2b6c0a934",
  measurementId: "G-TCQ13ZVSS6",

  // For iOS
  iosClientId: "494473710301-dd0gfpdhm8cn2c7puphlef9meajjjf7g.apps.googleusercontent.com",
  // For Android
  androidClientId: "494473710301-7hb56foba0cai1gaoe6kaa3m2o1073gc.apps.googleusercontent.com",
};

// Google Sign-In configuration
export const googleSignInConfig = {
  webClientId: "494473710301-vr1l4s8eaokh62nj6c91fol3pcfmu531.apps.googleusercontent.com",
  iosClientId: firebaseConfig.iosClientId,
  androidClientId: firebaseConfig.androidClientId,
};

// Facebook App configuration
export const facebookConfig = {
  appId: "494473710301-1b5d40d4f9e1b2b6c0a934.apps.googleusercontent.com",
  appName: "German TELC B1 App",
};

// Apple Sign-In configuration
export const appleSignInConfig = {
  serviceId: "494473710301-1b5d40d4f9e1b2b6c0a934.apps.googleusercontent.com",
  redirectUri: "your-apple-redirect-uri",
};

