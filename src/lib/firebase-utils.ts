import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  UPLOAD = 'upload',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
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
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generic helpers
export async function getDocument<T>(path: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, path, id);
    // Add a 10s timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 10000)
    );
    
    const docSnap = await Promise.race([
      getDoc(docRef),
      timeoutPromise
    ]) as any;

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    // Don't call handleFirestoreError here to avoid infinite loops if it's a connection issue
    return null;
  }
}

export async function getCollection<T>(path: string, queryConstraints: any[] = []): Promise<T[]> {
  try {
    const colRef = collection(db, path);
    const q = query(colRef, ...queryConstraints);
    
    // Add a 10s timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 10000)
    );
    
    const querySnapshot = await Promise.race([
      getDocs(q),
      timeoutPromise
    ]) as any;

    return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error('Error getting collection:', error);
    return [];
  }
}

export async function createDocument(path: string, data: any, id?: string) {
  try {
    if (id) {
      await setDoc(doc(db, path, id), data);
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, id ? `${path}/${id}` : path);
  }
}

export async function updateDocument(path: string, id: string, data: any) {
  try {
    await updateDoc(doc(db, path, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
  }
}

export async function removeDocument(path: string, id: string) {
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading file:', error);
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please ensure Firebase Storage is enabled and rules are set to allow uploads.');
    }
    if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please check your Firebase plan.');
    }
    throw error;
  }
}
