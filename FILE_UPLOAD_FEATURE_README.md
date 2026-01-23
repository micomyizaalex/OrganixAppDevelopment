# File Upload Feature for Case Creation

## Overview
Enhanced the Patient "Create Case" form with secure file upload capabilities for lab results and medical documents. Files are stored in Supabase Storage with proper access controls and linked to cases in the database.

## Date
Created: January 20, 2026

## Key Features

### 1. Multiple File Upload
- **Lab Results**: Upload test results, blood work, imaging reports
- **Medical Documents**: Upload prescriptions, doctor's notes, medical history
- **Support for Multiple File Types**:
  - Images: JPG, JPEG, PNG
  - Documents: PDF, DOC, DOCX
  - Spreadsheets: XLS, XLSX
- **Multiple Files per Field**: Up to 5 files per category (10 total per case)
- **Maximum File Size**: 10MB per file

### 2. User Experience
- **Drag-and-Drop Upload**: Intuitive file drop zone
- **File Previews**: Display file names, sizes, and icons before upload
- **Real-time Validation**: Instant feedback on file type and size issues
- **Upload Progress**: Loading indicator during file upload
- **Error Handling**: Clear error messages for validation failures
- **File Management**: Remove files before submission

### 3. Security & Storage
- **Supabase Storage Integration**: Secure cloud storage for medical files
- **Row Level Security (RLS)**: File access restricted by user role
- **Organized File Structure**: `{userId}/{caseId}/{category}/{timestamp}_{filename}`
- **Private Bucket**: Files not publicly accessible without authentication
- **File Sanitization**: Special characters removed from filenames

### 4. Access Control
- **Patients**: Can upload and view their own case files
- **Hospitals**: Can view files for assigned cases
- **Admins**: Can view all case files
- **Donors/Sponsors**: Cannot access patient medical files (privacy)

## Database Schema

### Migration: 004_setup_case_files_storage.sql

#### Storage Bucket
```sql
-- Create private bucket for case medical files
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-files', 'case-files', false);
```

#### New Columns in `cases` Table
```sql
-- Array of file objects for lab results
lab_results_files JSONB DEFAULT '[]'::jsonb
-- Structure: [{name: string, url: string, size: number, type: string}]

-- Array of file objects for other medical documents
medical_info_files JSONB DEFAULT '[]'::jsonb
-- Structure: [{name: string, url: string, size: number, type: string}]
```

#### Storage Policies
1. **Patients can upload**: Files to their own cases only
2. **Patients can view**: Their own case files
3. **Hospitals can view**: Files for assigned cases
4. **Admins can view**: All case files
5. **Patients can delete**: Their own case files

## Implementation Details

### Frontend Components

#### FileUpload.tsx
Reusable file upload component with:
- Drag-and-drop zone with visual feedback
- File list with preview (name, size, icon)
- Remove file functionality
- Client-side validation
- Error display
- Healthcare design theme

**Props:**
```typescript
interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onChange: (files: File[]) => void;
  value: File[];
  required?: boolean;
}
```

#### fileUploadService.ts
Service for file operations:

**Key Functions:**
- `validateFile(file)`: Validate single file
- `validateFiles(files)`: Validate multiple files
- `uploadFile(file, userId, caseId, category)`: Upload single file to Supabase
- `uploadFiles(files, userId, caseId, category)`: Upload multiple files
- `deleteFile(fileUrl, userId)`: Delete file from storage
- `formatFileSize(bytes)`: Format file size for display
- `getFileIcon(fileType)`: Get emoji icon for file type

**Validation Rules:**
```typescript
// Allowed MIME types
ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

// Maximum file size
MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

#### PatientDashboard.tsx Updates
1. **State Management**:
   ```typescript
   const [labResultsFiles, setLabResultsFiles] = useState<File[]>([]);
   const [medicalInfoFiles, setMedicalInfoFiles] = useState<File[]>([]);
   const [isUploading, setIsUploading] = useState(false);
   ```

2. **Form Submission Flow**:
   - Create case in database (without files)
   - Upload lab results files to Supabase Storage
   - Upload medical info files to Supabase Storage
   - Update case record with file URLs
   - Display success/error messages
   - Reset form on success

3. **UI Changes**:
   - Replaced "Latest Lab Results" textarea with FileUpload component
   - Added "Other Medical Documents" FileUpload component
   - Upload progress indicator on submit button
   - Disabled form during upload

### Backend Implementation

#### caseController.js
**New Endpoint: `PUT /cases/:caseId/files`**
```javascript
async updateCaseFiles(req, res) {
  const { caseId } = req.params;
  const { labResultsFiles, medicalInfoFiles } = req.body;
  
  // Verify ownership
  // Update case with file information
  // Log audit event
}
```

#### caseService.js
**New Methods:**
```javascript
// Get case by ID
async getCaseById(caseId) { ... }

// Update case files
async updateCaseFiles(caseId, labResultsFiles, medicalInfoFiles) { ... }
```

**Updated formatCase:**
- Now includes `labResultsFiles` and `medicalInfoFiles` arrays

#### caseRoutes.js
Added route:
```javascript
router.put('/:caseId/files', verifyAuth, caseController.updateCaseFiles);
```

## File Storage Structure

### Supabase Storage Path Format
```
case-files/
  └── {userId}/
      └── {caseId}/
          ├── lab-results/
          │   ├── {timestamp}_blood_test.pdf
          │   └── {timestamp}_xray_image.jpg
          └── medical-info/
              ├── {timestamp}_prescription.pdf
              └── {timestamp}_doctors_note.docx
```

### File Object Format (JSONB)
```json
[
  {
    "name": "blood_test.pdf",
    "url": "https://[project].supabase.co/storage/v1/object/public/case-files/...",
    "size": 245678,
    "type": "application/pdf"
  },
  {
    "name": "xray_image.jpg",
    "url": "https://[project].supabase.co/storage/v1/object/public/case-files/...",
    "size": 1245678,
    "type": "image/jpeg"
  }
]
```

## Validation & Error Handling

### Client-Side Validation
- **File Type**: Only allowed types (images, PDF, Word, Excel)
- **File Size**: Maximum 10MB per file
- **File Count**: Maximum 5 files per category
- **Real-time Feedback**: Errors displayed immediately

### Server-Side Validation
- **Ownership Check**: Only file owner or admin can update files
- **Case Existence**: Verify case exists before updating
- **Authentication**: Require valid JWT token
- **Audit Logging**: Log all file operations

### Error Messages
- Clear, user-friendly error messages
- Specific guidance for resolution
- No technical jargon in user-facing errors

## User Interface

### Design Principles
- **Healthcare Theme**: Consistent with existing color palette
  - Blue (#0077B6) for primary actions
  - Green (#27AE60) for medical information section
  - Red (#E63946) for errors
- **Typography**: Montserrat (headings), Inter (body)
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessibility**: Keyboard navigation, ARIA labels, screen reader support

### Visual Elements
- **Drag-and-Drop Zone**: Dashed border, hover effects
- **File Icons**: Emoji icons for visual file type identification
  - 🖼️ Images
  - 📄 PDF
  - 📝 Word documents
  - 📊 Spreadsheets
  - 📎 Other files
- **File List**: Clean cards with file details
- **Remove Button**: X icon with hover effect
- **Upload Button**: Loading spinner during upload

### Form Sections
1. **Basic Information** (Blue) - Organ, Urgency
2. **Medical Information** (Green) - Blood Type, Age, Chronic Illnesses, Lab Results (Files)
3. **Additional Information** (Gray) - Medical Documents (Files), Text Notes

## Testing Checklist

### Functional Testing
- [x] Upload single file (lab results)
- [x] Upload multiple files (both categories)
- [x] Drag-and-drop functionality
- [x] File type validation
- [x] File size validation
- [x] Remove file before submission
- [x] Case creation with files
- [x] Case creation without files
- [x] File upload progress indicator
- [x] Error handling for upload failures

### Security Testing
- [x] File access restricted by RLS policies
- [x] Cannot upload to other users' cases
- [x] Cannot view other patients' files (donors/sponsors)
- [x] Files sanitized (special characters removed)
- [x] Authentication required for all file operations

### UI/UX Testing
- [x] Responsive on mobile devices
- [x] Keyboard navigation works
- [x] Error messages clear and helpful
- [x] File icons display correctly
- [x] Healthcare design theme consistent
- [x] Form submission disabled during upload

### Edge Cases
- [x] Maximum file limit (5 per category)
- [x] Large file handling (10MB limit)
- [x] Duplicate file names
- [x] Special characters in filenames
- [x] Network errors during upload
- [x] Concurrent uploads

## Performance Considerations

### Optimizations
- **Sequential Upload**: Files uploaded one at a time to avoid overwhelming the server
- **File Sanitization**: Remove special characters for faster URL generation
- **Lazy Loading**: FileUpload component only loads when dialog opens
- **Caching**: Supabase Storage caching (3600s) for faster retrieval
- **Compression**: Consider client-side image compression in future

### Limitations
- **Upload Speed**: Depends on user's internet connection
- **Storage Quota**: Monitor Supabase storage limits
- **Concurrent Users**: Rate limiting may apply at scale

## Future Enhancements

### Planned Improvements
1. **Image Compression**: Auto-compress large images before upload
2. **File Preview**: Display PDF/image previews in modal
3. **Batch Download**: Download all case files as ZIP
4. **Version History**: Track file updates and changes
5. **OCR Integration**: Extract text from lab reports automatically
6. **AI Analysis**: Analyze lab results for insights
7. **File Sharing**: Share files with healthcare providers
8. **Mobile Camera Upload**: Take photos directly from mobile device
9. **Document Scanner**: Scan physical documents in-app
10. **Encryption**: End-to-end encryption for sensitive files

### Integration Opportunities
- **EHR Systems**: Import files from hospital systems
- **Lab Portals**: Auto-import from lab result portals
- **DICOM Viewer**: View medical imaging files (X-rays, CT scans)
- **Telemedicine**: Share files during virtual consultations

## Security Best Practices

### Implementation
- **Private Bucket**: Files not publicly accessible
- **JWT Authentication**: All requests require valid token
- **RLS Policies**: Database-level access control
- **File Sanitization**: Remove potentially dangerous characters
- **Audit Logging**: Track all file operations
- **HTTPS Only**: Encrypted data transmission

### Compliance Considerations
- **HIPAA**: Medical data privacy (US)
- **GDPR**: Data protection (EU)
- **Data Retention**: Consider retention policies
- **Right to Deletion**: Users can delete their files
- **Access Logs**: Maintain audit trail

## Troubleshooting

### Common Issues

**File Upload Fails**
- Check file size (max 10MB)
- Verify file type is supported
- Ensure stable internet connection
- Check Supabase Storage quota

**Cannot View Files**
- Verify authentication token is valid
- Check RLS policies are enabled
- Ensure file belongs to authorized case

**Validation Errors**
- Review allowed file types
- Reduce file size if needed
- Limit to 5 files per category

### Debug Tips
- Check browser console for errors
- Verify Supabase Storage bucket exists
- Test RLS policies in Supabase dashboard
- Check network tab for API requests

## Related Files

### Frontend
- `frontend/src/app/components/FileUpload.tsx` - Reusable file upload component
- `frontend/src/services/fileUploadService.ts` - File operations service
- `frontend/src/app/components/PatientDashboard.tsx` - Enhanced form with uploads

### Backend
- `backend/src/controllers/caseController.js` - File update endpoint
- `backend/src/services/caseService.js` - File storage operations
- `backend/src/routes/caseRoutes.js` - File upload route

### Database
- `supabase/migrations/004_setup_case_files_storage.sql` - Storage setup and schema

### Documentation
- `CASE_FORM_ENHANCEMENT_README.md` - Previous enhancement (medical fields)
- `DESIGN_SYSTEM_GUIDE.md` - Healthcare design patterns
- `HEALTHCARE_REDESIGN_SUMMARY.md` - UI/UX guidelines

## Support & Maintenance

### Monitoring
- Monitor Supabase Storage usage
- Track upload success/failure rates
- Review audit logs for suspicious activity
- Monitor API response times

### Maintenance Tasks
- Clean up orphaned files (cases deleted but files remain)
- Archive old case files
- Update file type allowlist as needed
- Review and update RLS policies

### Support Resources
- Supabase Storage Documentation
- File Upload Best Practices
- HIPAA Compliance Guidelines
- User Support Documentation

---

**Version**: 1.0  
**Last Updated**: January 20, 2026  
**Author**: Development Team  
**Status**: Complete and Production-Ready
