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
// Removed firebase/storage import as we shifted to Cloudinary
import { db, auth } from '../firebase';

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

export async function getDocument<T>(path: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, path, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document at ${path}/${id}:`, error);
    // Throwing so the caller knows it's an error, not just a missing doc
    throw error;
  }
}

export async function getCollection<T>(path: string, queryConstraints: any[] = []): Promise<T[]> {
  try {
    const colRef = collection(db, path);
    const q = query(colRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error getting collection at ${path}:`, error);
    throw error;
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
  const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Fallback for debugging if user hasn't set them yet
  if (!cloudName || !uploadPreset) {
    const missing = [];
    if (!cloudName) missing.push('VITE_CLOUDINARY_CLOUD_NAME');
    if (!uploadPreset) missing.push('VITE_CLOUDINARY_UPLOAD_PRESET');
    
    console.warn(`Cloudinary configuration missing: ${missing.join(', ')}`);
    throw new Error(`Cloudinary not configured. Please add the following to your Secrets: ${missing.join(' and ')}. After adding them, please refresh the page.`);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', path); // Organizes files by folder

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // Returns the optimized HTTPS version of the link
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}
