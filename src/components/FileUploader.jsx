import React from 'react';
import * as XLSX from 'xlsx';

const FileUploader = ({ setData, setColumns }) => {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setData(jsonData);
      setColumns(Object.keys(jsonData[0] || {}));
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="mb-6">
      <input 
        type="file" 
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
    </div>
  );
};

export default FileUploader; 