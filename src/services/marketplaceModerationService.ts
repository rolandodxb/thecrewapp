import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  Timestamp,
  addDoc,
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { MarketplaceProduct } from './marketplaceService';

export interface ModerationAction {
  id: string;
  moderator_id: string;
  moderator_name: string;
  moderator_email: string;
  action_type: 'remove_product' | 'approve_product' | 'flag_product' | 'bulk_remove';
  target_id: string;
  target_type: 'product';
  reason?: string;
  details?: string;
  created_at: any;
  metadata?: {
    product_title?: string;
    seller_id?: string;
    seller_name?: string;
    [key: string]: any;
  };
}

export interface ModerationFilters {
  category?: string;
  seller_id?: string;
  search?: string;
  status?: 'published' | 'draft' | 'archived';
  priceMin?: number;
  priceMax?: number;
}

export interface RemovalReason {
  code: string;
  label: string;
  requiresDetails: boolean;
}

export const REMOVAL_REASONS: RemovalReason[] = [
  { code: 'inappropriate_content', label: 'Inappropriate Content', requiresDetails: true },
  { code: 'policy_violation', label: 'Policy Violation', requiresDetails: true },
  { code: 'copyright_infringement', label: 'Copyright Infringement', requiresDetails: true },
  { code: 'misleading_information', label: 'Misleading Information', requiresDetails: false },
  { code: 'spam', label: 'Spam or Low Quality', requiresDetails: false },
  { code: 'prohibited_item', label: 'Prohibited Item', requiresDetails: true },
  { code: 'duplicate_listing', label: 'Duplicate Listing', requiresDetails: false },
  { code: 'seller_request', label: 'Seller Request', requiresDetails: false },
  { code: 'other', label: 'Other', requiresDetails: true }
];

export const getAllProducts = async (
  filters?: ModerationFilters,
  limitCount: number = 50,
  lastDoc?: DocumentSnapshot
): Promise<{ products: MarketplaceProduct[]; lastDoc: DocumentSnapshot | null }> => {
  try {
    const productsRef = collection(db, 'marketplace_products');
    let q = query(productsRef, orderBy('created_at', 'desc'));

    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters?.seller_id) {
      q = query(q, where('seller_id', '==', filters.seller_id));
    }

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, firestoreLimit(limitCount));

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceProduct[];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.seller_name.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.priceMin !== undefined) {
      products = products.filter(p => p.price >= filters.priceMin!);
    }

    if (filters?.priceMax !== undefined) {
      products = products.filter(p => p.price <= filters.priceMax!);
    }

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { products, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error getting all products:', error);
    throw error;
  }
};

export const getProductDetails = async (productId: string): Promise<MarketplaceProduct | null> => {
  try {
    const productRef = doc(db, 'marketplace_products', productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as MarketplaceProduct;
    }
    return null;
  } catch (error) {
    console.error('Error getting product details:', error);
    return null;
  }
};

export const removeProduct = async (
  productId: string,
  moderatorId: string,
  moderatorName: string,
  moderatorEmail: string,
  reason: string,
  details?: string
): Promise<void> => {
  try {
    const product = await getProductDetails(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    await deleteDoc(doc(db, 'marketplace_products', productId));

    await logModerationAction({
      moderator_id: moderatorId,
      moderator_name: moderatorName,
      moderator_email: moderatorEmail,
      action_type: 'remove_product',
      target_id: productId,
      target_type: 'product',
      reason,
      details,
      metadata: {
        product_title: product.title,
        seller_id: product.seller_id,
        seller_name: product.seller_name,
        product_price: product.price,
        product_category: product.category
      }
    });

    console.log(`Product ${productId} removed by ${moderatorName}`);
  } catch (error) {
    console.error('Error removing product:', error);
    throw error;
  }
};

export const bulkRemoveProducts = async (
  productIds: string[],
  moderatorId: string,
  moderatorName: string,
  moderatorEmail: string,
  reason: string,
  details?: string
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const productId of productIds) {
    try {
      await removeProduct(productId, moderatorId, moderatorName, moderatorEmail, reason, details);
      success++;
    } catch (error) {
      console.error(`Failed to remove product ${productId}:`, error);
      failed++;
    }
  }

  await logModerationAction({
    moderator_id: moderatorId,
    moderator_name: moderatorName,
    moderator_email: moderatorEmail,
    action_type: 'bulk_remove',
    target_id: `bulk_${productIds.length}`,
    target_type: 'product',
    reason,
    details: `Removed ${success} of ${productIds.length} products. ${details || ''}`,
    metadata: {
      product_ids: productIds,
      success_count: success,
      failed_count: failed
    }
  });

  return { success, failed };
};

export const flagProduct = async (
  productId: string,
  moderatorId: string,
  moderatorName: string,
  moderatorEmail: string,
  reason: string,
  details?: string
): Promise<void> => {
  try {
    const product = await getProductDetails(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    await updateDoc(doc(db, 'marketplace_products', productId), {
      flagged: true,
      flag_reason: reason,
      flag_details: details,
      flagged_at: Timestamp.now(),
      flagged_by: moderatorId
    });

    await logModerationAction({
      moderator_id: moderatorId,
      moderator_name: moderatorName,
      moderator_email: moderatorEmail,
      action_type: 'flag_product',
      target_id: productId,
      target_type: 'product',
      reason,
      details,
      metadata: {
        product_title: product.title,
        seller_id: product.seller_id,
        seller_name: product.seller_name
      }
    });

    console.log(`Product ${productId} flagged by ${moderatorName}`);
  } catch (error) {
    console.error('Error flagging product:', error);
    throw error;
  }
};

const logModerationAction = async (action: Omit<ModerationAction, 'id' | 'created_at'>): Promise<void> => {
  try {
    const actionData = {
      ...action,
      created_at: Timestamp.now()
    };

    await addDoc(collection(db, 'moderation_logs'), actionData);
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
};

export const getModerationLogs = async (
  limitCount: number = 100
): Promise<ModerationAction[]> => {
  try {
    const logsRef = collection(db, 'moderation_logs');
    const q = query(logsRef, orderBy('created_at', 'desc'), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ModerationAction[];
  } catch (error) {
    console.error('Error getting moderation logs:', error);
    return [];
  }
};

export const getModeratorStats = async (moderatorId: string): Promise<{
  total_actions: number;
  products_removed: number;
  products_flagged: number;
  last_action?: Date;
}> => {
  try {
    const logsRef = collection(db, 'moderation_logs');
    const q = query(logsRef, where('moderator_id', '==', moderatorId));
    const snapshot = await getDocs(q);

    const actions = snapshot.docs.map(doc => doc.data());
    const productsRemoved = actions.filter(a => a.action_type === 'remove_product' || a.action_type === 'bulk_remove').length;
    const productsFlagged = actions.filter(a => a.action_type === 'flag_product').length;

    const lastAction = actions.length > 0
      ? new Date(Math.max(...actions.map(a => a.created_at?.toDate?.()?.getTime() || 0)))
      : undefined;

    return {
      total_actions: actions.length,
      products_removed: productsRemoved,
      products_flagged: productsFlagged,
      last_action: lastAction
    };
  } catch (error) {
    console.error('Error getting moderator stats:', error);
    return {
      total_actions: 0,
      products_removed: 0,
      products_flagged: 0
    };
  }
};

export const searchProducts = async (searchTerm: string): Promise<MarketplaceProduct[]> => {
  try {
    const productsRef = collection(db, 'marketplace_products');
    const snapshot = await getDocs(productsRef);

    const allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceProduct[];

    const searchLower = searchTerm.toLowerCase();
    return allProducts.filter(product =>
      product.title.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.seller_name.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};
