import { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { 
  validateFiles, 
  formatFileSize, 
  getFileIcon,
  type FileValidationError 
} from '@/services/fileUploadService';

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

export function FileUpload({
  label,
  description,
  accept = 'image/jpeg,image/png,application/pdf,.doc,.docx,.xls,.xlsx',
  multiple = true,
  maxFiles = 5,
  onChange,
  value,
  required = false
}: FileUploadProps) {
  const [errors, setErrors] = useState<FileValidationError[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;

    const filesArray = Array.from(newFiles);
    
    // Check max files
    if (value.length + filesArray.length > maxFiles) {
      setErrors([{
        file: 'Multiple files',
        error: `Maximum ${maxFiles} files allowed`
      }]);
      return;
    }

    // Validate files
    const validation = validateFiles(filesArray);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Clear errors and add files
    setErrors([]);
    onChange([...value, ...filesArray]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
    setErrors([]);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive 
            ? 'border-[#0077B6] bg-blue-50' 
            : 'border-gray-300 hover:border-[#0077B6] hover:bg-gray-50'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-700 mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          Images, PDF, Word, Excel (Max 10MB per file)
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {multiple ? `Up to ${maxFiles} files` : 'Single file only'}
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />

      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-xs font-medium text-gray-600">
            Selected Files ({value.length}/{maxFiles})
          </p>
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">
                  {getFileIcon(file.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="ml-2 flex-shrink-0 hover:bg-red-50 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((err, index) => (
                <li key={index} className="text-sm">
                  {err.error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
