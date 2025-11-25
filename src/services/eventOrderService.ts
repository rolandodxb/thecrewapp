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
import { walletService } from './walletService';
import { activityAttendanceService } from './activityAttendanceService';
import QRCode from 'qrcode';

export interface EventOrder {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  product_id: string;
  event_title: string;
  event_description: string;
  event_date: Timestamp;
  event_location: string;
  product_image?: string;
  quantity: number;
  price_per_ticket: number;
  total_amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method: 'stripe' | 'wallet' | 'mixed';
  wallet_amount_used?: number;
  stripe_amount?: number;
  payment_intent_id?: string;
  stripe_charge_id?: string;
  check_in_status: 'awaited' | 'checked_in' | 'no_show';
  check_in_time?: Timestamp;
  qr_code: string;
  qr_code_data: string;
  attendance_id?: string;
  created_at: Timestamp;
  completed_at?: Timestamp;
  checked_in_at?: Timestamp;
  metadata?: {
    ip_address?: string;
    device?: string;
    [key: string]: any;
  };
}

export interface CreateEventOrderData {
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  product_id: string;
  event_title: string;
  event_description: string;
  event_date: Timestamp;
  event_location: string;
  product_image?: string;
  quantity: number;
  price: number;
  currency: string;
  payment_method: 'stripe' | 'wallet' | 'mixed';
  wallet_amount_used?: number;
  stripe_amount?: number;
}

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVT-${timestamp}-${random}`;
};

export const eventOrderService = {
  async createEventOrder(orderData: CreateEventOrderData): Promise<EventOrder> {
    try {
      const orderRef = doc(collection(db, 'event_orders'));
      const orderNumber = generateOrderNumber();
      const qrCodeData = `event-check-in:${orderRef.id}`;

      const qrCode = await QRCode.toDataURL(qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#D71920',
          light: '#FFFFFF'
        }
      });

      const order: EventOrder = {
        id: orderRef.id,
        order_number: orderNumber,
        buyer_id: orderData.buyer_id,
        buyer_name: orderData.buyer_name,
        buyer_email: orderData.buyer_email,
        seller_id: orderData.seller_id,
        seller_name: orderData.seller_name,
        seller_email: orderData.seller_email,
        product_id: orderData.product_id,
        event_title: orderData.event_title,
        event_description: orderData.event_description,
        event_date: orderData.event_date,
        event_location: orderData.event_location,
        product_image: orderData.product_image,
        quantity: orderData.quantity,
        price_per_ticket: orderData.price,
        total_amount: orderData.price * orderData.quantity,
        currency: orderData.currency,
        payment_status: 'pending',
        payment_method: orderData.payment_method,
        wallet_amount_used: orderData.wallet_amount_used || 0,
        stripe_amount: orderData.stripe_amount,
        check_in_status: 'awaited',
        qr_code: qrCode,
        qr_code_data: qrCodeData,
        created_at: Timestamp.now(),
        metadata: {}
      };

      await setDoc(orderRef, order);
      console.log('Event order created:', orderRef.id, orderNumber);
      return order;
    } catch (error) {
      console.error('Error creating event order:', error);
      throw error;
    }
  },

  async completePayment(
    orderId: string,
    paymentDetails: {
      payment_intent_id?: string;
      stripe_charge_id?: string;
    }
  ): Promise<void> {
    try {
      const orderRef = doc(db, 'event_orders', orderId);
      const orderSnapshot = await getDoc(orderRef);

      if (!orderSnapshot.exists()) {
        throw new Error('Order not found');
      }

      const order = orderSnapshot.data() as EventOrder;

      if (order.wallet_amount_used && order.wallet_amount_used > 0) {
        await walletService.debitWallet(
          order.buyer_id,
          order.wallet_amount_used,
          'booking',
          `Event booking: ${order.event_title}`,
          {
            orderId: orderId,
            productId: order.product_id,
            eventTitle: order.event_title
          }
        );
      }

      await updateDoc(orderRef, {
        payment_status: 'completed',
        completed_at: Timestamp.now(),
        payment_intent_id: paymentDetails.payment_intent_id,
        stripe_charge_id: paymentDetails.stripe_charge_id
      });

      await this.incrementEventParticipants(order.product_id, order.quantity);

      console.log('Event order payment completed:', orderId);
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  },

  async checkInAttendee(orderId: string, scannedBy?: string): Promise<{ success: boolean; message: string }> {
    try {
      const orderRef = doc(db, 'event_orders', orderId);
      const orderSnapshot = await getDoc(orderRef);

      if (!orderSnapshot.exists()) {
        return { success: false, message: 'Order not found' };
      }

      const order = orderSnapshot.data() as EventOrder;

      if (order.payment_status !== 'completed') {
        return { success: false, message: 'Payment not completed' };
      }

      if (order.check_in_status === 'checked_in') {
        return { success: false, message: 'Already checked in' };
      }

      await updateDoc(orderRef, {
        check_in_status: 'checked_in',
        checked_in_at: Timestamp.now(),
        'metadata.scanned_by': scannedBy || 'self'
      });

      return { success: true, message: 'Successfully checked in!' };
    } catch (error) {
      console.error('Error checking in attendee:', error);
      return { success: false, message: 'Check-in failed: ' + (error as Error).message };
    }
  },

  async getUserEventOrders(userId: string): Promise<EventOrder[]> {
    try {
      const q = query(
        collection(db, 'event_orders'),
        where('buyer_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventOrder));
    } catch (error) {
      console.error('Error fetching user event orders:', error);
      return [];
    }
  },

  async getEventAttendees(productId: string): Promise<EventOrder[]> {
    try {
      const q = query(
        collection(db, 'event_orders'),
        where('product_id', '==', productId),
        where('payment_status', '==', 'completed'),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventOrder));
    } catch (error) {
      console.error('Error fetching event attendees:', error);
      return [];
    }
  },

  async getSellerEvents(sellerId: string): Promise<EventOrder[]> {
    try {
      const q = query(
        collection(db, 'event_orders'),
        where('seller_id', '==', sellerId),
        where('payment_status', '==', 'completed'),
        orderBy('event_date', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventOrder));
    } catch (error) {
      console.error('Error fetching seller events:', error);
      return [];
    }
  },

  async getUpcomingEvents(userId: string): Promise<EventOrder[]> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, 'event_orders'),
        where('buyer_id', '==', userId),
        where('payment_status', '==', 'completed'),
        where('event_date', '>=', now),
        orderBy('event_date', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventOrder));
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  },

  async incrementEventParticipants(productId: string, count: number = 1): Promise<void> {
    try {
      const productRef = doc(db, 'marketplace_products', productId);
      await updateDoc(productRef, {
        current_participants: increment(count),
        sales_count: increment(count)
      });
    } catch (error) {
      console.error('Error incrementing participants:', error);
    }
  },

  async getEventStats(productId: string): Promise<{
    total_sales: number;
    total_participants: number;
    checked_in: number;
    awaited: number;
    revenue: number;
  }> {
    try {
      const attendees = await this.getEventAttendees(productId);

      const stats = attendees.reduce((acc, order) => {
        acc.total_sales += 1;
        acc.total_participants += order.quantity;
        acc.revenue += order.total_amount;

        if (order.check_in_status === 'checked_in') {
          acc.checked_in += order.quantity;
        } else if (order.check_in_status === 'awaited') {
          acc.awaited += order.quantity;
        }

        return acc;
      }, {
        total_sales: 0,
        total_participants: 0,
        checked_in: 0,
        awaited: 0,
        revenue: 0
      });

      return stats;
    } catch (error) {
      console.error('Error calculating event stats:', error);
      return {
        total_sales: 0,
        total_participants: 0,
        checked_in: 0,
        awaited: 0,
        revenue: 0
      };
    }
  },

  async calculateWalletPayment(totalAmount: number, userId: string): Promise<{
    walletBalance: number;
    walletAmount: number;
    stripeAmount: number;
    canPayFully: boolean;
  }> {
    try {
      const wallet = await walletService.getWallet(userId);
      const walletBalance = wallet?.balance || 0;

      if (walletBalance >= totalAmount) {
        return {
          walletBalance,
          walletAmount: totalAmount,
          stripeAmount: 0,
          canPayFully: true
        };
      } else if (walletBalance > 0) {
        return {
          walletBalance,
          walletAmount: walletBalance,
          stripeAmount: totalAmount - walletBalance,
          canPayFully: false
        };
      } else {
        return {
          walletBalance: 0,
          walletAmount: 0,
          stripeAmount: totalAmount,
          canPayFully: false
        };
      }
    } catch (error) {
      console.error('Error calculating wallet payment:', error);
      return {
        walletBalance: 0,
        walletAmount: 0,
        stripeAmount: totalAmount,
        canPayFully: false
      };
    }
  }
};
