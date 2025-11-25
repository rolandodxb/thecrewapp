import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { storage, db } from '../lib/firebase';

export interface FileMetadata {
  id?: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Timestamp;
  category?: string;
  description?: string;
  isPublic: boolean;
  tags?: string[];
}

export interface StorageQuota {
  userId: string;
  plan: string;
  usedBytes: number;
  limitBytes: number;
  fileCount: number;
}

const fileMetadataCollection = 'fileMetadata';
const storageQuotaCollection = 'storageQuota';

const STORAGE_LIMITS = {
  free: 50 * 1024 * 1024,
  basic: 500 * 1024 * 1024,
  pro: 5 * 1024 * 1024 * 1024,
  vip: 20 * 1024 * 1024 * 1024,
};

export async function uploadFile(
  file: File,
  userId: string,
  userName: string,
  category: string = 'general',
  isPublic: boolean = false
): Promise<string> {
  const quota = await getUserStorageQuota(userId);

  if (quota.usedBytes + file.size > quota.limitBytes) {
    throw new Error('Storage quota exceeded. Please upgrade your plan or delete some files.');
  }

  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `users/${userId}/${category}/${fileName}`;
  const fileRef = ref(storage, filePath);

  await uploadBytes(fileRef, file);
  const fileUrl = await getDownloadURL(fileRef);

  const metadata: Omit<FileMetadata, 'id'> = {
    fileName: file.name,
    filePath,
    fileUrl,
    fileSize: file.size,
    fileType: file.type,
    uploadedBy: userId,
    uploadedByName: userName,
    uploadedAt: Timestamp.now(),
    category,
    isPublic,
    tags: [],
  };

  const docRef = await addDoc(collection(db, fileMetadataCollection), metadata);

  await updateUserStorageQuota(userId, file.size, 1);

  return docRef.id;
}

export async function getUserFiles(userId: string): Promise<FileMetadata[]> {
  const q = query(
    collection(db, fileMetadataCollection),
    where('uploadedBy', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FileMetadata));
}

export async function getAllFiles(): Promise<FileMetadata[]> {
  const snapshot = await getDocs(collection(db, fileMetadataCollection));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FileMetadata));
}

export async function getPublicFiles(): Promise<FileMetadata[]> {
  const q = query(
    collection(db, fileMetadataCollection),
    where('isPublic', '==', true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FileMetadata));
}

export async function getFilesByCategory(userId: string, category: string): Promise<FileMetadata[]> {
  const q = query(
    collection(db, fileMetadataCollection),
    where('uploadedBy', '==', userId),
    where('category', '==', category)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FileMetadata));
}

export async function deleteFile(fileId: string, userId: string) {
  const docRef = doc(db, fileMetadataCollection, fileId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('File not found');
  }

  const fileData = docSnap.data() as FileMetadata;

  if (fileData.uploadedBy !== userId) {
    throw new Error('Unauthorized to delete this file');
  }

  const fileRef = ref(storage, fileData.filePath);
  await deleteObject(fileRef);

  await deleteDoc(docRef);

  await updateUserStorageQuota(userId, -fileData.fileSize, -1);
}

export async function deleteFileAsAdmin(fileId: string) {
  const docRef = doc(db, fileMetadataCollection, fileId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('File not found');
  }

  const fileData = docSnap.data() as FileMetadata;

  try {
    const fileRef = ref(storage, fileData.filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
  }

  await deleteDoc(docRef);

  await updateUserStorageQuota(fileData.uploadedBy, -fileData.fileSize, -1);
}

export async function getUserStorageQuota(userId: string): Promise<StorageQuota> {
  const docRef = doc(db, storageQuotaCollection, userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as StorageQuota;
  }

  const userDoc = await getDoc(doc(db, 'users', userId));
  const plan = userDoc.exists() ? (userDoc.data().subscription || 'free').toLowerCase() : 'free';

  const quota: StorageQuota = {
    userId,
    plan,
    usedBytes: 0,
    limitBytes: STORAGE_LIMITS[plan as keyof typeof STORAGE_LIMITS] || STORAGE_LIMITS.free,
    fileCount: 0,
  };

  await setDoc(docRef, quota);
  return quota;
}

async function updateUserStorageQuota(userId: string, bytesChange: number, fileCountChange: number) {
  const docRef = doc(db, storageQuotaCollection, userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const quota = docSnap.data() as StorageQuota;
    await updateDoc(docRef, {
      usedBytes: Math.max(0, quota.usedBytes + bytesChange),
      fileCount: Math.max(0, quota.fileCount + fileCountChange),
    });
  } else {
    await getUserStorageQuota(userId);
    await updateUserStorageQuota(userId, bytesChange, fileCountChange);
  }
}

export async function updateFiletadata(fileId: string, updates: Partial<FileMetadata>) {
  const docRef = doc(db, fileMetadataCollection, fileId);
  await updateDoc(docRef, updates);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function getStorageLimitForPlan(plan: string): number {
  return STORAGE_LIMITS[plan.toLowerCase() as keyof typeof STORAGE_LIMITS] || STORAGE_LIMITS.free;
}
