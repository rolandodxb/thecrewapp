import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment
} from 'firebase/firestore';
import QRCode from 'qrcode';
import { incrementProductSales, decrementStock, getProduct } from './marketplaceService';
import { createAttendanceRecord } from './attendanceService';

export interface MarketplaceOrder {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  product_id: string;
  product_title: string;
  product_type: 'digital' | 'physical' | 'service' | 'activity';
  product_image?: string;
  quantity: number;
  price: number;
  total_amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_intent_id?: string;
  payment_method?: string;
  payment_method_brand?: string;
  payment_method_last4?: string;
  stripe_customer_id?: string;
  stripe_charge_id?: string;
  stripe_fee?: number;
  net_amount?: number;
  payment_created_at?: any;
  payment_succeeded_at?: any;
  payment_failed_at?: any;
  delivery_status: 'pending' | 'delivered' | 'failed';
  digital_download_url?: string;
  digital_download_expires?: any;
  download_count?: number;
  max_downloads: number;
  created_at: any;
  completed_at?: any;
  qr_code?: string;
  attendance_status?: 'awaited' | 'checked_in';
  checked_in_at?: any;
  metadata?: {
    buyer_ip?: string;
    transaction_id?: string;
    [key: string]: any;
  };
}

export interface CreateOrderData {
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  product_id: string;
  product_title: string;
  product_type: 'digital' | 'physical' | 'service' | 'activity';
  product_image?: string;
  quantity: number;
  price: number;
  currency: string;
}

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const createOrder = async (orderData: CreateOrderData): Promise<string> => {
  try {
    const orderRef = doc(collection(db, 'marketplace_orders'));
    const orderNumber = generateOrderNumber();

    // Generate QR code for events
    let qrCode: string | undefined;
    let attendanceStatus: 'awaited' | 'checked_in' | undefined;

    if (orderData.product_type === 'activity') {
      const qrData = JSON.stringify({
        orderId: orderRef.id,
        orderNumber,
        buyerId: orderData.buyer_id,
        buyerName: orderData.buyer_name,
        productId: orderData.product_id,
        productTitle: orderData.product_title,
        timestamp: Date.now()
      });

      qrCode = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2
      });

      attendanceStatus = 'awaited';
    }

    const order: Omit<MarketplaceOrder, 'id'> = {
      order_number: orderNumber,
      buyer_id: orderData.buyer_id,
      buyer_name: orderData.buyer_name,
      buyer_email: orderData.buyer_email,
      seller_id: orderData.seller_id,
      seller_name: orderData.seller_name,
      seller_email: orderData.seller_email,
      product_id: orderData.product_id,
      product_title: orderData.product_title,
      product_type: orderData.product_type,
      product_image: orderData.product_image,
      quantity: orderData.quantity,
      price: orderData.price,
      total_amount: orderData.price * orderData.quantity,
      currency: orderData.currency,
      payment_status: 'pending',
      delivery_status: 'pending',
      download_count: 0,
      max_downloads: 5,
      created_at: Timestamp.now(),
      ...(qrCode && { qr_code: qrCode }),
      ...(attendanceStatus && { attendance_status: attendanceStatus }),
      metadata: {}
    };

    await setDoc(orderRef, order);
    console.log('Order created:', orderRef.id, orderNumber);
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<MarketplaceOrder | null> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      return { id: orderSnap.id, ...orderSnap.data() } as MarketplaceOrder;
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    return null;
  }
};

export interface UpdatePaymentDetails {
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_intent_id?: string;
  payment_method?: string;
  payment_method_brand?: string;
  payment_method_last4?: string;
  stripe_customer_id?: string;
  stripe_charge_id?: string;
  stripe_fee?: number;
  net_amount?: number;
}

export const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  paymentIntentId?: string,
  paymentMethod?: string
): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    const updates: any = {
      payment_status: paymentStatus
    };

    if (paymentIntentId) {
      updates.payment_intent_id = paymentIntentId;
    }

    if (paymentMethod) {
      updates.payment_method = paymentMethod;
    }

    if (paymentStatus === 'completed') {
      updates.completed_at = Timestamp.now();
      updates.payment_succeeded_at = Timestamp.now();
    } else if (paymentStatus === 'failed') {
      updates.payment_failed_at = Timestamp.now();
    }

    await updateDoc(orderRef, updates);
    console.log('Order payment status updated:', orderId, paymentStatus);
  } catch (error) {
    console.error('Error updating order payment status:', error);
    throw error;
  }
};

export const updateOrderWithFullPaymentDetails = async (
  orderId: string,
  paymentDetails: UpdatePaymentDetails
): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    const updates: any = {
      payment_status: paymentDetails.payment_status,
      payment_intent_id: paymentDetails.payment_intent_id,
      payment_method: paymentDetails.payment_method,
      payment_method_brand: paymentDetails.payment_method_brand,
      payment_method_last4: paymentDetails.payment_method_last4,
      stripe_customer_id: paymentDetails.stripe_customer_id,
      stripe_charge_id: paymentDetails.stripe_charge_id,
      stripe_fee: paymentDetails.stripe_fee,
      net_amount: paymentDetails.net_amount
    };

    if (paymentDetails.payment_status === 'completed') {
      updates.completed_at = Timestamp.now();
      updates.payment_succeeded_at = Timestamp.now();
    } else if (paymentDetails.payment_status === 'failed') {
      updates.payment_failed_at = Timestamp.now();
    }

    await updateDoc(orderRef, updates);
    console.log('Order updated with full payment details:', orderId);
  } catch (error) {
    console.error('Error updating order with payment details:', error);
    throw error;
  }
};

export const updateOrderDeliveryStatus = async (
  orderId: string,
  deliveryStatus: 'pending' | 'delivered' | 'failed'
): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    await updateDoc(orderRef, {
      delivery_status: deliveryStatus
    });
    console.log('Order delivery status updated:', orderId, deliveryStatus);
  } catch (error) {
    console.error('Error updating order delivery status:', error);
    throw error;
  }
};

export const setDigitalDownloadUrl = async (
  orderId: string,
  downloadUrl: string,
  expiresInHours: number = 72
): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    await updateDoc(orderRef, {
      digital_download_url: downloadUrl,
      digital_download_expires: Timestamp.fromDate(expiresAt),
      delivery_status: 'delivered'
    });

    console.log('Digital download URL set for order:', orderId);
  } catch (error) {
    console.error('Error setting download URL:', error);
    throw error;
  }
};

export const incrementDownloadCount = async (orderId: string): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    await updateDoc(orderRef, {
      download_count: increment(1)
    });
    console.log('Download count incremented for order:', orderId);
  } catch (error) {
    console.error('Error incrementing download count:', error);
    throw error;
  }
};

export const canDownload = async (orderId: string): Promise<boolean> => {
  try {
    const order = await getOrder(orderId);
    if (!order) return false;

    if (order.payment_status !== 'completed') return false;

    if (order.download_count && order.download_count >= order.max_downloads) {
      return false;
    }

    if (order.digital_download_expires) {
      const expiresAt = order.digital_download_expires.toDate();
      if (new Date() > expiresAt) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking download permission:', error);
    return false;
  }
};

export const getMyOrders = async (userId: string): Promise<MarketplaceOrder[]> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(
      ordersRef,
      where('buyer_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceOrder[];
  } catch (error) {
    console.error('Error getting my orders:', error);
    return [];
  }
};

export const getMySales = async (userId: string): Promise<MarketplaceOrder[]> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(
      ordersRef,
      where('seller_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceOrder[];
  } catch (error) {
    console.error('Error getting my sales:', error);
    return [];
  }
};

export interface Order {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  product_title: string;
  created_at: any;
  shipping_address?: {
    line1: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
}

export const getSellerOrders = async (sellerId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(
      ordersRef,
      where('seller_id', '==', sellerId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        buyer_name: data.buyer_name || 'Unknown',
        buyer_email: data.buyer_email || '',
        buyer_phone: data.metadata?.buyer_phone,
        amount: data.total_amount || data.price || 0,
        currency: data.currency || 'USD',
        status: data.payment_status || 'pending',
        payment_method: data.payment_method || `${data.payment_method_brand || 'Card'} ****${data.payment_method_last4 || 'XXXX'}`,
        product_title: data.product_title || '',
        created_at: data.created_at,
        shipping_address: data.metadata?.shipping_address,
      } as Order;
    });
  } catch (error) {
    console.error('Error getting seller orders:', error);
    return [];
  }
};

export const completeOrder = async (
  orderId: string,
  productId: string,
  productType: 'digital' | 'physical' | 'service' | 'activity',
  quantity: number = 1
): Promise<void> => {
  try {
    await updateOrderPaymentStatus(orderId, 'completed');

    await incrementProductSales(productId);

    if (productType === 'physical') {
      await decrementStock(productId, quantity);
    }

    // If it's an activity, create attendance record
    if (productType === 'activity') {
      const order = await getOrder(orderId);
      const product = await getProduct(productId);

      if (order && product) {
        await createAttendanceRecord(
          orderId,
          productId,
          product.title,
          order.buyer_name,
          order.buyer_email,
          order.metadata?.buyer_phone || '',
          order.total_amount,
          order.currency,
          order.seller_id,
          order.seller_name,
          order.payment_intent_id
        );
        console.log('Attendance record created for activity purchase');
      }
    }

    console.log('Order completed:', orderId);
  } catch (error) {
    console.error('Error completing order:', error);
    throw error;
  }
};

export const getOrderByPaymentIntent = async (
  paymentIntentId: string
): Promise<MarketplaceOrder | null> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(ordersRef, where('payment_intent_id', '==', paymentIntentId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as MarketplaceOrder;
    }
    return null;
  } catch (error) {
    console.error('Error getting order by payment intent:', error);
    return null;
  }
};

export const checkInAttendee = async (orderId: string): Promise<void> => {
  try {
    const orderRef = doc(db, 'marketplace_orders', orderId);
    await updateDoc(orderRef, {
      attendance_status: 'checked_in',
      checked_in_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error checking in attendee:', error);
    throw error;
  }
};

export const getEventOrders = async (sellerId: string): Promise<MarketplaceOrder[]> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(
      ordersRef,
      where('seller_id', '==', sellerId),
      where('product_type', '==', 'activity'),
      where('payment_status', '==', 'completed'),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MarketplaceOrder));
  } catch (error) {
    console.error('Error getting event orders:', error);
    return [];
  }
};

export const getMyEventOrders = async (buyerId: string): Promise<MarketplaceOrder[]> => {
  try {
    const ordersRef = collection(db, 'marketplace_orders');
    const q = query(
      ordersRef,
      where('buyer_id', '==', buyerId),
      where('product_type', '==', 'activity'),
      where('payment_status', '==', 'completed'),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MarketplaceOrder));
  } catch (error) {
    console.error('Error getting my event orders:', error);
    return [];
  }
};
