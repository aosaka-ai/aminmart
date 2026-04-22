import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// initializeFirestore allows us to enable long polling which often fixes 
// "Could not reach Cloud Firestore backend" errors in restricted environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
export const storage = getStorage(app);

// CRITICAL: Connection test as per Firebase integration requirements
async function testConnection() {
  try {
    const testDoc = doc(db, '_connection_test_', 'check');
    await getDocFromServer(testDoc);
    console.log("Firestore connection successful");
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Firestore is offline. Check your Firebase configuration or internet connection.");
    } else {
      console.warn("Firestore connection test completed with status:", error.code || error.message);
    }
  }
}

testConnection();
