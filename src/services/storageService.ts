import { storage } from '../lib/auth';
export const uploadPDFToStorage = async (file: File, courseId: string): Promise<{ url: string; path: string }> => {
  try {
    console.log('Starting PDF upload...', { fileName: file.name, size: file.size, courseId });
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `courses/${courseId}/${timestamp}_${sanitizedFileName}`;
    const storageRef = ref(storage, path);
    console.log('Uploading to path:', path);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: 'application/pdf',
    });
    console.log('Upload complete, getting download URL...');
    const url = await getDownloadURL(storageRef);
    console.log('Download URL retrieved:', url);
    return { url, path };
  } catch (error: any) {
    console.error('Error uploading PDF to Firebase Storage:', error);
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Unknown error occurred during upload. Check your internet connection.');
    }
    throw new Error(error.message || 'Failed to upload PDF. Please try again.');
  }
};
export const deletePDFFromStorage = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting PDF from Firebase Storage:', error);
  }
};
export const validatePDFFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024;
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are allowed' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 50MB' };
  }
  return { valid: true };
};