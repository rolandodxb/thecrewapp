import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, where, Timestamp, getDoc } from 'firebase/firestore';
import { notifyBugReportComment, notifyBugReportStatus } from './notificationService';

export type BugStatus = 'open' | 'in-progress' | 'escalated' | 'resolved' | 'closed';
export type BugPriority = 'low' | 'medium' | 'high' | 'critical';

export interface BugReport {
  id?: string;
  title: string;
  description: string;
  status: BugStatus;
  priority: BugPriority;
  reportedBy: string;
  reportedByName: string;
  reportedByRole: string;
  assignedTo?: string;
  assignedToName?: string;
  escalatedToGovernor: boolean;
  createdAt: any;
  updatedAt: any;
  resolvedAt?: any;
  category: string;
  screenshots?: string[];
  responses?: BugResponse[];
}

export interface BugResponse {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  createdAt: any;
}

export const createBugReport = async (
  report: Omit<BugReport, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'escalatedToGovernor'>
): Promise<string> => {
  try {
    const bugReport: any = {
      ...report,
      status: 'open',
      escalatedToGovernor: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      responses: []
    };

    const docRef = await addDoc(collection(db, 'bugReports'), bugReport);
    return docRef.id;
  } catch (error) {
    console.error('Error creating bug report:', error);
    throw error;
  }
};

export const getAllBugReports = async (): Promise<BugReport[]> => {
  try {
    const q = query(collection(db, 'bugReports'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const reports: BugReport[] = [];
    querySnapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data()
      } as BugReport);
    });

    return reports;
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return [];
  }
};

export const getBugReportsByRole = async (userRole: string): Promise<BugReport[]> => {
  try {
    const allReports = await getAllBugReports();

    if (userRole === 'governor') {
      return allReports;
    } else if (userRole === 'mentor') {
      return allReports.filter(report => !report.escalatedToGovernor || report.assignedTo);
    }

    return [];
  } catch (error) {
    console.error('Error fetching bug reports by role:', error);
    return [];
  }
};

export const updateBugReportStatus = async (
  reportId: string,
  status: BugStatus,
  assignedTo?: string,
  assignedToName?: string
): Promise<void> => {
  try {
    const reportRef = doc(db, 'bugReports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) return;

    const reportData = reportSnap.data();
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
      updateData.assignedToName = assignedToName;
    }

    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = Timestamp.now();
    }

    await updateDoc(reportRef, updateData);

    await notifyBugReportStatus(
      reportData.reportedBy,
      reportId,
      reportData.title,
      status
    );
  } catch (error) {
    console.error('Error updating bug report status:', error);
    throw error;
  }
};

export const escalateBugReport = async (
  reportId: string,
  escalatedBy: string,
  escalatedByName: string
): Promise<void> => {
  try {
    const reportRef = doc(db, 'bugReports', reportId);
    await updateDoc(reportRef, {
      escalatedToGovernor: true,
      status: 'escalated',
      updatedAt: Timestamp.now()
    });

    await addResponseToBugReport(reportId, {
      id: Date.now().toString(),
      userId: escalatedBy,
      userName: escalatedByName,
      userRole: 'system',
      message: `Bug report escalated to Governor by ${escalatedByName}`,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error escalating bug report:', error);
    throw error;
  }
};

export const addResponseToBugReport = async (
  reportId: string,
  response: BugResponse
): Promise<void> => {
  try {
    const reportRef = doc(db, 'bugReports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      throw new Error('Bug report not found');
    }

    const currentData = reportSnap.data();
    const responses = currentData.responses || [];

    await updateDoc(reportRef, {
      responses: [...responses, {
        ...response,
        createdAt: Timestamp.now()
      }],
      updatedAt: Timestamp.now()
    });

    console.log('Response added successfully to bug report:', reportId);

    if (response.userId !== currentData.reportedBy) {
      await notifyBugReportComment(
        currentData.reportedBy,
        reportId,
        currentData.title,
        response.userName
      );
    }
  } catch (error) {
    console.error('Error adding response to bug report:', error);
    throw error;
  }
};
