import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { PaginationHelper } from '../utils/paginationHelper';

export interface MinimalProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  thumbnail?: string;
  category: string;
  sellerId: string;
  sellerName: string;
  status: string;
  views?: number;
  sales?: number;
  createdAt: any;
}

export interface FullProduct extends MinimalProduct {
  description: string;
  images: string[];
  tags: string[];
  downloadUrl?: string;
  fileSize?: string;
  format?: string;
  requirements?: string;
  features?: string[];
  rating?: number;
  reviewCount?: number;
  lastUpdated?: any;
}

class OptimizedMarketplaceService {
  private productsPaginationHelper: PaginationHelper<MinimalProduct>;
  private productCache: Map<string, { data: FullProduct; timestamp: number }>;
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.productsPaginationHelper = new PaginationHelper<MinimalProduct>('marketplaceProducts', 24);
    this.productCache = new Map();
  }

  async fetchProductsPage(
    page: number = 1,
    filters: {
      category?: string;
      sellerId?: string;
      status?: string;
      minPrice?: number;
      maxPrice?: number;
    } = {}
  ) {
    const whereConditions: any[] = [];

    if (filters.status) {
      whereConditions.push({
        field: 'status',
        operator: '==',
        value: filters.status,
      });
    }

    if (filters.category) {
      whereConditions.push({
        field: 'category',
        operator: '==',
        value: filters.category,
      });
    }

    if (filters.sellerId) {
      whereConditions.push({
        field: 'sellerId',
        operator: '==',
        value: filters.sellerId,
      });
    }

    return this.productsPaginationHelper.fetchPage(page, {
      pageSize: 24,
      orderByField: 'views',
      orderDirection: 'desc',
      whereConditions,
    });
  }

  async fetchPublishedProducts(limit: number = 24) {
    try {
      const q = query(
        collection(db, 'marketplaceProducts'),
        where('status', '==', 'published'),
        orderBy('views', 'desc')
      );

      const snapshot = await getDocs(q);
      const products: MinimalProduct[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          title: data.title,
          price: data.price,
          currency: data.currency,
          thumbnail: data.thumbnail || data.images?.[0],
          category: data.category,
          sellerId: data.sellerId,
          sellerName: data.sellerName,
          status: data.status,
          views: data.views || 0,
          sales: data.sales || 0,
          createdAt: data.createdAt,
        });
      });

      return products.slice(0, limit);
    } catch (error) {
      console.error('Error fetching published products:', error);
      return [];
    }
  }

  async fetchFullProduct(productId: string): Promise<FullProduct | null> {
    const cached = this.productCache.get(productId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const productDoc = await getDoc(doc(db, 'marketplaceProducts', productId));

      if (!productDoc.exists()) {
        return null;
      }

      const data = productDoc.data();
      const fullProduct: FullProduct = {
        id: productDoc.id,
        title: data.title,
        price: data.price,
        currency: data.currency,
        thumbnail: data.thumbnail || data.images?.[0],
        category: data.category,
        sellerId: data.sellerId,
        sellerName: data.sellerName,
        status: data.status,
        views: data.views || 0,
        sales: data.sales || 0,
        createdAt: data.createdAt,
        description: data.description,
        images: data.images || [],
        tags: data.tags || [],
        downloadUrl: data.downloadUrl,
        fileSize: data.fileSize,
        format: data.format,
        requirements: data.requirements,
        features: data.features || [],
        rating: data.rating,
        reviewCount: data.reviewCount,
        lastUpdated: data.lastUpdated,
      };

      this.productCache.set(productId, {
        data: fullProduct,
        timestamp: now,
      });

      return fullProduct;
    } catch (error) {
      console.error('Error fetching full product:', error);
      return null;
    }
  }

  async searchProducts(searchTerm: string, limit: number = 20): Promise<MinimalProduct[]> {
    try {
      const q = query(
        collection(db, 'marketplaceProducts'),
        where('status', '==', 'published'),
        orderBy('views', 'desc')
      );

      const snapshot = await getDocs(q);
      const products: MinimalProduct[] = [];
      const searchLower = searchTerm.toLowerCase();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const titleMatch = data.title?.toLowerCase().includes(searchLower);
        const descMatch = data.description?.toLowerCase().includes(searchLower);
        const tagsMatch = data.tags?.some((tag: string) =>
          tag.toLowerCase().includes(searchLower)
        );

        if (titleMatch || descMatch || tagsMatch) {
          products.push({
            id: doc.id,
            title: data.title,
            price: data.price,
            currency: data.currency,
            thumbnail: data.thumbnail || data.images?.[0],
            category: data.category,
            sellerId: data.sellerId,
            sellerName: data.sellerName,
            status: data.status,
            views: data.views || 0,
            sales: data.sales || 0,
            createdAt: data.createdAt,
          });
        }
      });

      return products.slice(0, limit);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  clearAllCaches(): void {
    this.productCache.clear();
    this.productsPaginationHelper.clearCache();
  }
}

export const optimizedMarketplaceService = new OptimizedMarketplaceService();
