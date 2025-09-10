import React, { useRef } from 'react';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XCircleIcon } from './icons/XCircleIcon';


interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  currentFile: File | null;
  disabled: boolean;
  accept?: string;
  buttonId?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, currentFile, disabled, accept = "image/*,application/pdf", buttonId = "file-upload-button" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleClearFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      onFileSelect(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={accept}
        disabled={disabled}
      />
      {!currentFile ? (
        <button
          id={buttonId}
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-sky-400/80 rounded-xl text-sky-700 hover:bg-sky-500/10 hover:border-sky-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperclipIcon className="w-5 h-5 mr-2" />
          <span>Select a file</span>
        </button>
      ) : (
        <div className="w-full flex items-center justify-center">
            <div className="inline-flex items-center space-x-2 bg-sky-100 text-sky-800 text-sm font-medium pl-3 pr-2 py-1.5 rounded-full">
                <PaperclipIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate max-w-xs">{currentFile.name}</span>
                <button 
                  type="button" 
                  onClick={handleClearFile} 
                  disabled={disabled} 
                  className="text-sky-600 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                  aria-label="Remove file"
                  >
                    <XCircleIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};