import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  addDoc
} from 'firebase/firestore';

export interface MarketplaceProduct {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  seller_photo_url?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  product_type: 'digital' | 'physical' | 'service' | 'activity';
  images: string[];
  digital_file_url?: string;
  digital_file_name?: string;
  digital_file_size?: number;
  status: 'draft' | 'published' | 'sold' | 'archived';
  stock_quantity?: number;
  created_at: any;
  updated_at: any;
  views_count: number;
  likes_count: number;
  sales_count: number;
  tags?: string[];
  custom_cta_text?: string;
  custom_cta_enabled?: boolean;
  is_activity?: boolean;
  linked_activity_id?: string;
  activity_date?: any;
  activity_location?: string;
  max_participants?: number;
}

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  product_type: 'digital' | 'physical' | 'service' | 'activity';
  images: string[];
  digital_file_url?: string;
  digital_file_name?: string;
  digital_file_size?: number;
  stock_quantity?: number;
  tags?: string[];
  custom_cta_text?: string;
  custom_cta_enabled?: boolean;
  is_activity?: boolean;
  activity_date?: any;
  activity_location?: string;
  max_participants?: number;
}

export const createProduct = async (
  userId: string,
  userName: string,
  userEmail: string,
  userPhotoUrl: string | undefined,
  productData: ProductFormData
): Promise<string> => {
  try {
    const productRef = doc(collection(db, 'marketplace_products'));

    const product: any = {
      seller_id: userId,
      seller_name: userName,
      seller_email: userEmail,
      seller_photo_url: userPhotoUrl,
      title: productData.title,
      description: productData.description,
      price: Math.round(productData.price * 100),
      currency: productData.currency || 'USD',
      category: productData.category,
      product_type: productData.product_type,
      images: productData.images,
      status: 'published',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      views_count: 0,
      likes_count: 0,
      sales_count: 0,
      tags: productData.tags || []
    };

    if (productData.digital_file_url) {
      product.digital_file_url = productData.digital_file_url;
    }

    if (productData.digital_file_name) {
      product.digital_file_name = productData.digital_file_name;
    }

    if (productData.digital_file_size) {
      product.digital_file_size = productData.digital_file_size;
    }

    if (productData.stock_quantity !== undefined) {
      product.stock_quantity = productData.stock_quantity;
    }

    if (productData.custom_cta_text) {
      product.custom_cta_text = productData.custom_cta_text;
      product.custom_cta_enabled = productData.custom_cta_enabled !== false;
    }

    await setDoc(productRef, product);
    console.log('Product created:', productRef.id);
    return productRef.id;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (
  productId: string,
  updates: Partial<ProductFormData>
): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);

    const updateData: any = {
      ...updates,
      updated_at: Timestamp.now()
    };

    if (updates.price !== undefined) {
      updateData.price = Math.round(updates.price * 100);
    }

    await updateDoc(productRef, updateData);
    console.log('Product updated:', productId);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const publishProduct = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    await updateDoc(productRef, {
      status: 'published',
      updated_at: Timestamp.now()
    });
    console.log('Product published:', productId);
  } catch (error) {
    console.error('Error publishing product:', error);
    throw error;
  }
};

export const archiveProduct = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    await updateDoc(productRef, {
      status: 'archived',
      updated_at: Timestamp.now()
    });
    console.log('Product archived:', productId);
  } catch (error) {
    console.error('Error archiving product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    await deleteDoc(productRef);
    console.log('Product deleted:', productId);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const getProduct = async (productId: string): Promise<MarketplaceProduct | null> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as MarketplaceProduct;
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    return null;
  }
};

export const getPublishedProducts = async (
  limitCount: number = 50
): Promise<MarketplaceProduct[]> => {
  try {
    const productsRef = collection(db, 'marketplace_products');
    const q = query(
      productsRef,
      where('status', '==', 'published'),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceProduct[];

    console.log(`✅ Fetched ${products.length} published products from Firestore`);
    return products;
  } catch (error: any) {
    console.error('❌ Error getting published products:', error);

    // Check if it's an index error
    if (error?.message?.includes('index')) {
      console.error('🔥 Firestore index required! Deploy with: firebase deploy --only firestore:indexes');
    }

    return [];
  }
};

export const getProductsByCategory = async (
  category: string,
  limitCount: number = 50
): Promise<MarketplaceProduct[]> => {
  try {
    const productsRef = collection(db, 'marketplace_products');
    const q = query(
      productsRef,
      where('status', '==', 'published'),
      where('category', '==', category),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceProduct[];
  } catch (error) {
    console.error('Error getting products by category:', error);
    return [];
  }
};

export const getMyProducts = async (userId: string): Promise<MarketplaceProduct[]> => {
  try {
    const productsRef = collection(db, 'marketplace_products');
    const q = query(
      productsRef,
      where('seller_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceProduct[];
  } catch (error) {
    console.error('Error getting my products:', error);
    return [];
  }
};

export const getSellerProducts = async (sellerId: string): Promise<MarketplaceProduct[]> => {
  return getMyProducts(sellerId);
};

export const incrementProductViews = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const currentViews = productSnap.data().views_count || 0;
      await updateDoc(productRef, {
        views_count: currentViews + 1
      });
    }
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
};

export const incrementProductSales = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    await updateDoc(productRef, {
      sales_count: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing sales:', error);
  }
};

export const decrementStock = async (productId: string, quantity: number = 1): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    await updateDoc(productRef, {
      stock_quantity: increment(-quantity)
    });
  } catch (error) {
    console.error('Error decrementing stock:', error);
  }
};

export const toggleFavorite = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    const favoriteId = `${userId}_${productId}`;
    const favoriteRef = doc(db, 'marketplace_favorites', favoriteId);
    const favoriteSnap = await getDoc(favoriteRef);

    if (favoriteSnap.exists()) {
      await deleteDoc(favoriteRef);
      const productRef = doc(db, 'marketplace_products', productId);
      await updateDoc(productRef, {
        likes_count: increment(-1)
      });
      return false;
    } else {
      await setDoc(favoriteRef, {
        user_id: userId,
        product_id: productId,
        created_at: Timestamp.now()
      });
      const productRef = doc(db, 'marketplace_products', productId);
      await updateDoc(productRef, {
        likes_count: increment(1)
      });
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

export const isFavorite = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    const favoriteId = `${userId}_${productId}`;
    const favoriteRef = doc(db, 'marketplace_favorites', favoriteId);
    const favoriteSnap = await getDoc(favoriteRef);
    return favoriteSnap.exists();
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

export const getFavoriteProducts = async (userId: string): Promise<MarketplaceProduct[]> => {
  try {
    const favoritesRef = collection(db, 'marketplace_favorites');
    const q = query(favoritesRef, where('user_id', '==', userId));
    const snapshot = await getDocs(q);

    const productIds = snapshot.docs.map(doc => doc.data().product_id);

    if (productIds.length === 0) return [];

    const products: MarketplaceProduct[] = [];
    for (const productId of productIds) {
      const product = await getProduct(productId);
      if (product && product.status === 'published') {
        products.push(product);
      }
    }

    return products;
  } catch (error) {
    console.error('Error getting favorite products:', error);
    return [];
  }
};

export const searchProducts = async (
  searchTerm: string,
  limitCount: number = 50
): Promise<MarketplaceProduct[]> => {
  try {
    const productsRef = collection(db, 'marketplace_products');
    const q = query(
      productsRef,
      where('status', '==', 'published'),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceProduct[];

    const searchLower = searchTerm.toLowerCase();
    return allProducts.filter(product =>
      product.title.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

// Update seller name on all products for a given seller
export const updateSellerNameOnProducts = async (
  sellerId: string,
  newSellerName: string
): Promise<number> => {
  try {
    const productsRef = collection(db, 'marketplace_products');
    const q = query(productsRef, where('seller_id', '==', sellerId));
    const snapshot = await getDocs(q);

    let updatedCount = 0;
    const updatePromises = snapshot.docs.map(async (docSnapshot) => {
      const productRef = doc(db, 'marketplace_products', docSnapshot.id);
      await updateDoc(productRef, {
        seller_name: newSellerName,
        updated_at: Timestamp.now()
      });
      updatedCount++;
    });

    await Promise.all(updatePromises);
    console.log(`✅ Updated seller name on ${updatedCount} products`);
    return updatedCount;
  } catch (error) {
    console.error('Error updating seller name on products:', error);
    throw error;
  }
};

export const linkProductToActivity = async (productId: string, activityId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    await updateDoc(productRef, {
      is_activity: true,
      product_type: 'activity',
      linked_activity_id: activityId,
      updated_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error linking product to activity:', error);
    throw error;
  }
};

export const unlinkProductFromActivity = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    await updateDoc(productRef, {
      is_activity: false,
      linked_activity_id: null,
      updated_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error unlinking product from activity:', error);
    throw error;
  }
};

export const getActivityProducts = async (activityId?: string): Promise<MarketplaceProduct[]> => {
  try {
    const productsRef = collection(db, 'marketplace_products');
    let q;

    if (activityId) {
      q = query(
        productsRef,
        where('is_activity', '==', true),
        where('linked_activity_id', '==', activityId),
        where('status', '==', 'published')
      );
    } else {
      q = query(
        productsRef,
        where('is_activity', '==', true),
        where('status', '==', 'published'),
        orderBy('created_at', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceProduct[];
  } catch (error) {
    console.error('Error fetching activity products:', error);
    return [];
  }
};

export const createActivityProduct = async (
  activityId: string,
  activityName: string,
  activityDescription: string,
  price: number,
  activityDate: Date,
  activityLocation: string,
  maxParticipants: number,
  sellerId: string,
  sellerName: string,
  sellerEmail: string,
  imageUrl?: string
): Promise<string> => {
  try {
    const productRef = doc(collection(db, 'marketplace_products'));

    const productData: Omit<MarketplaceProduct, 'id'> = {
      seller_id: sellerId,
      seller_name: sellerName,
      seller_email: sellerEmail,
      title: activityName,
      description: activityDescription,
      price,
      currency: 'USD',
      category: 'events',
      product_type: 'activity',
      images: imageUrl ? [imageUrl] : [],
      status: 'published',
      views_count: 0,
      likes_count: 0,
      sales_count: 0,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      is_activity: true,
      linked_activity_id: activityId,
      activity_date: Timestamp.fromDate(activityDate),
      activity_location: activityLocation,
      max_participants: maxParticipants,
      tags: ['activity', 'event']
    };

    await setDoc(productRef, productData);
    return productRef.id;
  } catch (error) {
    console.error('Error creating activity product:', error);
    throw error;
  }
};
