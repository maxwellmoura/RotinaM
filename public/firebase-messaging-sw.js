// public/firebase-messaging-sw.js

// Compat libs (exigem -compat no SW)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// MESMA CONFIG WEB
firebase.initializeApp({
  apiKey: "AIzaSyCgLHDlkK1u8fhl6QPDihcPaBsZjhrCc-Y",
  authDomain: "rotinam-4be01.firebaseapp.com",
  projectId: "rotinam-4be01",
  storageBucket: "rotinam-4be01.firebasestorage.app",
  messagingSenderId: "575844907882",
  appId: "1:575844907882:web:ca71bcbb5229d822950313",
  measurementId: "G-2J329MLF6Z",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload?.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload?.notification?.body || '',
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
