import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJSON from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfigJSON);

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigJSON.firestoreDatabaseId);
export const storage = getStorage(app);
// Increase retry time to 2 minutes (default is 10 mins, but we want it to fail faster or handle it better)
// Actually setting it to a reasonable value can help.
storage.maxUploadRetryTime = 120000; 

if (!firebaseConfigJSON.storageBucket) {
  console.error("Firebase Storage Error: storageBucket is NOT configured in firebase-applet-config.json. Uploads will fail.");
}
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
