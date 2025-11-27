import { supabase } from '../lib/auth';

export const uploadPDFToStorage = async (file: File, courseId: string): Promise<{ url: string; path: string }> => {
  try {
    console.log('Starting PDF upload...', { fileName: file.name, size: file.size, courseId });
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `courses/${courseId}/${timestamp}_${sanitizedFileName}`;

    const { data, error } = await supabase.storage
      .from('course-files')
      .upload(path, file, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    console.log('Upload complete, getting public URL...');

    const { data: { publicUrl } } = supabase.storage
      .from('course-files')
      .getPublicUrl(path);

    console.log('Public URL retrieved:', publicUrl);

    return { url: publicUrl, path };
  } catch (error: any) {
    console.error('Error uploading PDF to Supabase Storage:', error);
    if (error.statusCode === 401) {
      throw new Error('Permission denied. Please check Supabase Storage policies.');
    }
    throw new Error(error.message || 'Failed to upload PDF. Please try again.');
  }
};

export const deletePDFFromStorage = async (path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('course-files')
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting PDF from Supabase Storage:', error);
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
