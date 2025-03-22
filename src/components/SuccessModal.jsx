import React, { useEffect, useState } from 'react';

const SuccessModal = ({ isOpen, onClose }) => {
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay the checkmark animation for a better visual effect
      const timer = setTimeout(() => {
        setShowCheckmark(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowCheckmark(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white p-8 rounded-lg shadow-xl z-10 transform transition-all duration-300 ease-in-out">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 relative mb-4">
            <div className={`absolute inset-0 rounded-full bg-green-100 flex items-center justify-center transform transition-all duration-500 ${showCheckmark ? 'scale-100' : 'scale-0'}`}>
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  d="M5 13l4 4L19 7"
                  className={`transform transition-all duration-700 ${showCheckmark ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-6 text-center">Your form has been submitted successfully.</p>
          <p className="text-gray-500 mb-6 text-sm text-center">Your file has been uploaded and stored for admin review.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal; 