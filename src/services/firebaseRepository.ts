import {
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '../lib/firebase';

type FirebaseCollection = 'properties' | 'inquiries' | 'reports' | 'schedules';

function cleanForFirestore(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  if (Array.isArray(value)) return value.map(cleanForFirestore);

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = cleanForFirestore(item);
      if (cleaned !== undefined) output[key] = cleaned;
    }
    return output;
  }

  return value;
}

function getDocRef(collectionName: FirebaseCollection, id: string) {
  const db = getFirebaseDb();
  if (!isFirebaseConfigured || !db) return null;
  return doc(db, collectionName, id);
}

function warnFirebaseFailure(action: string, error: unknown) {
  console.warn(`[Firebase] ${action} failed. Local data is still saved.`, error);
}

export const firebaseRepository = {
  isEnabled: isFirebaseConfigured,

  async upsert(collectionName: FirebaseCollection, id: string, data: object) {
    const ref = getDocRef(collectionName, id);
    if (!ref) return;

    try {
      await setDoc(ref, cleanForFirestore(data) as DocumentData, { merge: true });
    } catch (error) {
      warnFirebaseFailure(`upsert ${collectionName}/${id}`, error);
    }
  },

  async update(collectionName: FirebaseCollection, id: string, data: object) {
    const ref = getDocRef(collectionName, id);
    if (!ref) return;

    try {
      await updateDoc(ref, cleanForFirestore(data) as DocumentData);
    } catch (error) {
      warnFirebaseFailure(`update ${collectionName}/${id}`, error);
    }
  },

  async remove(collectionName: FirebaseCollection, id: string) {
    const ref = getDocRef(collectionName, id);
    if (!ref) return;

    try {
      await deleteDoc(ref);
    } catch (error) {
      warnFirebaseFailure(`delete ${collectionName}/${id}`, error);
    }
  },
};
