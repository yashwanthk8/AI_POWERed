import React from 'react';

const FileUploadProgress = ({ progress }) => {
  return (
    <div className="w-full mt-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-blue-700">Uploading file...</span>
        <span className="text-sm font-medium text-blue-700">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default FileUploadProgress; 