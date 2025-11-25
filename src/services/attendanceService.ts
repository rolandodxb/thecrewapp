import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface AttendanceRecord {
  id: string;
  activity_id: string;
  activity_title: string;
  order_id: string;
  payment_intent_id?: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  amount_paid: number;
  currency: string;
  payment_date: any;
  attendance_confirmed: boolean;
  confirmed_at?: any;
  created_at: any;
  seller_id: string;
  seller_name: string;
}

export const createAttendanceRecord = async (
  orderId: string,
  activityId: string,
  activityTitle: string,
  attendeeName: string,
  attendeeEmail: string,
  attendeePhone: string,
  amountPaid: number,
  currency: string,
  sellerId: string,
  sellerName: string,
  paymentIntentId?: string
): Promise<string> => {
  try {
    const attendanceRef = doc(collection(db, 'activity_attendance'));

    const attendance: Omit<AttendanceRecord, 'id'> = {
      activity_id: activityId,
      activity_title: activityTitle,
      order_id: orderId,
      payment_intent_id: paymentIntentId,
      attendee_name: attendeeName,
      attendee_email: attendeeEmail,
      attendee_phone: attendeePhone,
      amount_paid: amountPaid,
      currency,
      payment_date: Timestamp.now(),
      attendance_confirmed: true,
      confirmed_at: Timestamp.now(),
      created_at: Timestamp.now(),
      seller_id: sellerId,
      seller_name: sellerName,
    };

    await setDoc(attendanceRef, attendance);
    console.log('Attendance record created:', attendanceRef.id);
    return attendanceRef.id;
  } catch (error) {
    console.error('Error creating attendance record:', error);
    throw error;
  }
};

export const getAttendanceForActivity = async (
  activityId: string
): Promise<AttendanceRecord[]> => {
  try {
    const attendanceRef = collection(db, 'activity_attendance');
    const q = query(
      attendanceRef,
      where('activity_id', '==', activityId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceRecord[];
  } catch (error) {
    console.error('Error getting attendance:', error);
    return [];
  }
};

export const getSellerAttendance = async (
  sellerId: string
): Promise<AttendanceRecord[]> => {
  try {
    const attendanceRef = collection(db, 'activity_attendance');
    const q = query(
      attendanceRef,
      where('seller_id', '==', sellerId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceRecord[];
  } catch (error) {
    console.error('Error getting seller attendance:', error);
    return [];
  }
};

export const getAttendanceRecord = async (
  attendanceId: string
): Promise<AttendanceRecord | null> => {
  try {
    const attendanceRef = doc(db, 'activity_attendance', attendanceId);
    const attendanceSnap = await getDoc(attendanceRef);

    if (attendanceSnap.exists()) {
      return { id: attendanceSnap.id, ...attendanceSnap.data() } as AttendanceRecord;
    }
    return null;
  } catch (error) {
    console.error('Error getting attendance record:', error);
    return null;
  }
};

export const exportAttendanceToCSV = (attendance: AttendanceRecord[]): string => {
  const headers = ['Name', 'Email', 'Phone', 'Amount Paid', 'Currency', 'Payment Date', 'Confirmed'];
  const rows = attendance.map(record => [
    record.attendee_name,
    record.attendee_email,
    record.attendee_phone,
    (record.amount_paid / 100).toFixed(2),
    record.currency,
    record.payment_date?.toDate?.()?.toLocaleDateString() || 'N/A',
    record.attendance_confirmed ? 'Yes' : 'No',
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  return csv;
};

export const downloadAttendanceCSV = (attendance: AttendanceRecord[], activityTitle: string) => {
  const csv = exportAttendanceToCSV(attendance);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${activityTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const printAttendance = (attendance: AttendanceRecord[], activityTitle: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Report - ${activityTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f4f4f4; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Attendance Report: ${activityTitle}</h1>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Attendees:</strong> ${attendance.length}</p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Amount Paid</th>
            <th>Payment Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${attendance.map(record => `
            <tr>
              <td>${record.attendee_name}</td>
              <td>${record.attendee_email}</td>
              <td>${record.attendee_phone}</td>
              <td>${(record.amount_paid / 100).toFixed(2)} ${record.currency}</td>
              <td>${record.payment_date?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
              <td>${record.attendance_confirmed ? 'Confirmed' : 'Pending'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This attendance report is generated automatically by the marketplace system.</p>
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
