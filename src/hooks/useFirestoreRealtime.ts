import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, DocumentData, Query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirestoreCollection<T = DocumentData>(collectionName: string, constraints?: any[]) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      let q: Query = collection(db, collectionName);

      if (constraints && constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const results: T[] = [];
          snapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() } as T);
          });
          setData(results);
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(`Error setting up listener for ${collectionName}:`, err);
      setError(err as Error);
      setLoading(false);
    }
  }, [collectionName]);

  return { data, loading, error };
}

export function useFirestoreDocument<T = DocumentData>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const unsubscribe = onSnapshot(
        collection(db, path).parent!,
        (snapshot) => {
          snapshot.forEach((doc) => {
            if (doc.id === path.split('/').pop()) {
              setData({ id: doc.id, ...doc.data() } as T);
            }
          });
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching document ${path}:`, err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(`Error setting up listener for document ${path}:`, err);
      setError(err as Error);
      setLoading(false);
    }
  }, [path]);

  return { data, loading, error };
}
