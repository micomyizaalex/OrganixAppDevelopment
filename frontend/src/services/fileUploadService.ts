import { supabase } from './profileService';

// Allowed file types and their MIME types
export const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  // Spreadsheets
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface FileValidationError {
  file: string;
  error: string;
}

/**
 * Validate a single file
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum size of 10MB`
    };
  }

  // Check file type
  const isValidType = Object.keys(ALLOWED_FILE_TYPES).includes(file.type);
  if (!isValidType) {
    return {
      valid: false,
      error: `File "${file.name}" has unsupported type. Allowed: images, PDF, Word, Excel`
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): {
  valid: boolean;
  errors: FileValidationError[];
} {
  const errors: FileValidationError[] = [];

  files.forEach(file => {
    const validation = validateFile(file);
    if (!validation.valid) {
      errors.push({
        file: file.name,
        error: validation.error || 'Invalid file'
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Upload a single file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  userId: string,
  caseId: string,
  category: 'lab-results' | 'medical-info'
): Promise<{ success: boolean; data?: UploadedFile; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Create unique file name
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${caseId}/${category}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('case-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: `Failed to upload ${file.name}: ${error.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('case-files')
      .getPublicUrl(filePath);

    const uploadedFile: UploadedFile = {
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type
    };

    return {
      success: true,
      data: uploadedFile
    };
  } catch (err) {
    console.error('Upload error:', err);
    return {
      success: false,
      error: `Failed to upload ${file.name}`
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  userId: string,
  caseId: string,
  category: 'lab-results' | 'medical-info'
): Promise<{
  success: boolean;
  uploadedFiles: UploadedFile[];
  errors: FileValidationError[];
}> {
  const uploadedFiles: UploadedFile[] = [];
  const errors: FileValidationError[] = [];

  // Validate all files first
  const validation = validateFiles(files);
  if (!validation.valid) {
    return {
      success: false,
      uploadedFiles: [],
      errors: validation.errors
    };
  }

  // Upload files sequentially
  for (const file of files) {
    const result = await uploadFile(file, userId, caseId, category);
    
    if (result.success && result.data) {
      uploadedFiles.push(result.data);
    } else {
      errors.push({
        file: file.name,
        error: result.error || 'Upload failed'
      });
    }
  }

  return {
    success: errors.length === 0,
    uploadedFiles,
    errors
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  fileUrl: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/case-files/');
    if (pathParts.length < 2) {
      return {
        success: false,
        error: 'Invalid file URL'
      };
    }
    
    const filePath = pathParts[1];

    // Verify the file belongs to the user
    if (!filePath.startsWith(userId)) {
      return {
        success: false,
        error: 'Unauthorized to delete this file'
      };
    }

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('case-files')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Delete error:', err);
    return {
      success: false,
      error: 'Failed to delete file'
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  return '📎';
}
