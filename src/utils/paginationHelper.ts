import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  Query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PaginationState<T> {
  items: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  page: number;
  total: number;
}

export interface PaginationOptions {
  pageSize?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  whereConditions?: Array<{
    field: string;
    operator: any;
    value: any;
  }>;
}

export class PaginationHelper<T> {
  private collectionName: string;
  private pageSize: number;
  private cache: Map<number, PaginationState<T>>;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastFetch: number = 0;

  constructor(collectionName: string, pageSize: number = 25) {
    this.collectionName = collectionName;
    this.pageSize = pageSize;
    this.cache = new Map();
  }

  async fetchPage(
    page: number = 1,
    options: PaginationOptions = {},
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  ): Promise<PaginationState<T>> {
    const cached = this.cache.get(page);
    const now = Date.now();

    if (cached && (now - this.lastFetch) < this.cacheExpiry) {
      return cached;
    }

    const constraints: QueryConstraint[] = [];

    if (options.whereConditions) {
      options.whereConditions.forEach(condition => {
        constraints.push(where(condition.field, condition.operator, condition.value));
      });
    }

    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
    }

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    constraints.push(limit(options.pageSize || this.pageSize));

    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    const items: T[] = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as T);
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = items.length === (options.pageSize || this.pageSize);

    const state: PaginationState<T> = {
      items,
      lastDoc: lastVisible,
      hasMore,
      page,
      total: -1,
    };

    this.cache.set(page, state);
    this.lastFetch = now;

    return state;
  }

  async fetchNextPage(
    currentState: PaginationState<T>,
    options: PaginationOptions = {}
  ): Promise<PaginationState<T>> {
    if (!currentState.hasMore) {
      return currentState;
    }

    return this.fetchPage(currentState.page + 1, options, currentState.lastDoc);
  }

  async fetchPreviousPage(
    currentPage: number,
    options: PaginationOptions = {}
  ): Promise<PaginationState<T>> {
    if (currentPage <= 1) {
      return this.fetchPage(1, options);
    }

    return this.fetchPage(currentPage - 1, options);
  }

  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }

  getCachedPage(page: number): PaginationState<T> | undefined {
    return this.cache.get(page);
  }
}

export function createPaginationHelper<T>(
  collectionName: string,
  pageSize: number = 25
): PaginationHelper<T> {
  return new PaginationHelper<T>(collectionName, pageSize);
}

export async function fetchPaginatedCollection<T>(
  collectionName: string,
  options: PaginationOptions & { page?: number } = {}
): Promise<PaginationState<T>> {
  const helper = new PaginationHelper<T>(collectionName, options.pageSize);
  return helper.fetchPage(options.page || 1, options);
}
