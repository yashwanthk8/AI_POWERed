import React, { useState } from "react";
import axios from "axios";
import FileUploadProgress from "./FileUploadProgress";
import SuccessModal from "./SuccessModal";

const Auto = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phoneCode: "",
        phone: "",
        file: null,
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [directDownload, setDirectDownload] = useState(null);
    const [availableFiles, setAvailableFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Setting up the server URL
    const SERVER_URL = "https://ai-powered-5nqe.onrender.com";
    // Base URL for the frontend
    const FRONTEND_URL = "https://aipowerevisualizer.netlify.app";

    // Load available files on component mount
    React.useEffect(() => {
        fetchAvailableFiles();
    }, []);

    // Function to fetch available files from the server
    const fetchAvailableFiles = async () => {
        setLoadingFiles(true);
        try {
            const response = await axios.get(`${SERVER_URL}/files`);
            if (response.data && Array.isArray(response.data)) {
                setAvailableFiles(response.data);
                console.log("Found", response.data.length, "files on server");
            }
        } catch (error) {
            console.error("Failed to fetch available files:", error);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            file: e.target.files[0],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Reset states
        setErrorMessage("");
        setDownloadUrl("");
        setDirectDownload(null);
        
        // Validate file
        if (!formData.file) {
            setErrorMessage("Please upload a file");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        
        // Create form data
        const data = new FormData();
        data.append("username", formData.username);
        data.append("email", formData.email);
        data.append("phoneCode", formData.phoneCode);
        data.append("phone", formData.phone);
        data.append("file", formData.file);
        
        // Progress simulation
        const progressTimer = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressTimer);
                    return 90;
                }
                return prev + 10;
            });
        }, 500);

        // Try all upload methods
        let uploadSuccess = false;

        // Method 1: Direct server with specific headers
        try {
            console.log("Attempting direct upload to server...");
            
            // Set specific headers that might help with CORS
            const response = await axios.post(`${SERVER_URL}/upload`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Origin': FRONTEND_URL,
                    'Access-Control-Allow-Origin': '*'
                },
                withCredentials: false,
                timeout: 30000 // 30 second timeout
            });
            
            console.log("Server response:", response.data);
            
            if (response.data && response.data.file && response.data.file.filename) {
                const fileDownloadUrl = `${SERVER_URL}/files/${response.data.file.filename}`;
                setDownloadUrl(fileDownloadUrl);
                console.log("File download URL:", fileDownloadUrl);
                uploadSuccess = true;
                
                // Refresh available files list
                fetchAvailableFiles();
            }
        } catch (error) {
            console.error("Direct upload failed:", error.message);
        }
        
        // Method 2: Alternative method using a traditional form submission
        if (!uploadSuccess) {
            try {
                console.log("Trying with alternative method...");
                
                // Create an alternate FormData with same data
                const altData = new FormData();
                altData.append("username", formData.username);
                altData.append("email", formData.email);
                altData.append("phoneCode", formData.phoneCode);
                altData.append("phone", formData.phone);
                altData.append("file", formData.file);
                
                // Use a different content type to bypass multer-gridfs-storage issues
                const altResponse = await axios.post(`${SERVER_URL}/upload`, altData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                });
                
                console.log("Alt method response:", altResponse.data);
                
                if (altResponse.data && altResponse.data.file && altResponse.data.file.filename) {
                    const fileDownloadUrl = `${SERVER_URL}/files/${altResponse.data.file.filename}`;
                    setDownloadUrl(fileDownloadUrl);
                    console.log("File download URL from alt method:", fileDownloadUrl);
                    uploadSuccess = true;
                    
                    // Refresh available files list
                    fetchAvailableFiles();
                }
            } catch (altError) {
                console.error("Alternative upload failed:", altError.message);
            }
        }
        
        // Method 3: Local file URL fallback
        if (!uploadSuccess) {
            try {
                console.log("All server uploads failed. Creating local file URL...");
                
                // Create direct download link as fallback
                const fileURL = URL.createObjectURL(formData.file);
                setDirectDownload({
                    url: fileURL,
                    filename: formData.file.name
                });
                
                // Log user data via Formspree
                const formspreeData = {
                    username: formData.username,
                    email: formData.email,
                    phone: `+${formData.phoneCode}${formData.phone}`,
                    filename: formData.file.name,
                    fileSize: `${Math.round(formData.file.size/1024)} KB`,
                    fileType: formData.file.type,
                    message: "Server uploads failed. User created direct download.",
                    _subject: "File Upload Attempt with Direct Download - FinYearPro"
                };
                
                await axios.post('https://formspree.io/f/xknooqlb', formspreeData);
                
                setErrorMessage("Server upload failed. Using direct download instead.");
                uploadSuccess = true;
            } catch (fallbackError) {
                console.error("Even fallback failed:", fallbackError.message);
            }
        }

        // Complete the progress animation
        clearInterval(progressTimer);
        setUploadProgress(uploadSuccess ? 100 : 0);
        setIsUploading(false);
        
        if (uploadSuccess) {
            setShowSuccessModal(true);
        } else {
            setErrorMessage("All upload methods failed. Please try again later.");
        }
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        
        // Reset form after modal is closed
        setFormData({
            username: "",
            email: "",
            phoneCode: "",
            phone: "",
            file: null
        });
        
        if (document.querySelector('input[type="file"]')) {
            document.querySelector('input[type="file"]').value = '';
        }
        
        // Clean up object URL if it exists
        if (directDownload) {
            URL.revokeObjectURL(directDownload.url);
            setDirectDownload(null);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-8">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-center mb-6">File Upload Form</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Enter Name"
                            required
                            value={formData.username}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter Email"
                            required
                            value={formData.email}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="phoneCode" className="block text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <div className="flex mt-1">
                            <select
                                name="phoneCode"
                                required
                                value={formData.phoneCode}
                                className="p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={handleChange}
                            >
                                <option value="" hidden>Code</option>
                                <option value="91">+91</option>
                                <option value="98">+98</option>
                                <option value="99">+99</option>
                                <option value="90">+90</option>
                                <option value="66">+66</option>
                            </select>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="812XXXXXX"
                                required
                                value={formData.phone}
                                className="flex-grow p-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                            Upload File
                        </label>
                        <input
                            type="file"
                            name="file"
                            required
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={handleFileChange}
                        />
                    </div>

                    {isUploading && <FileUploadProgress progress={uploadProgress} />}
                    
                    {errorMessage && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                            {errorMessage}
                        </div>
                    )}
                    
                    {downloadUrl && (
                        <div className="mt-3 mb-2 p-3 bg-green-50 border border-green-400 text-green-700 rounded flex flex-col">
                            <p className="mb-2">File uploaded successfully to server!</p>
                            <a 
                                href={downloadUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download from Server
                            </a>
                        </div>
                    )}
                    
                    {directDownload && (
                        <div className="mt-3 mb-2 p-3 bg-blue-50 border border-blue-400 text-blue-700 rounded flex flex-col">
                            <p className="mb-2">Direct download available (not saved on server):</p>
                            <a 
                                href={directDownload.url} 
                                download={directDownload.filename}
                                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download {directDownload.filename}
                            </a>
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isUploading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                        >
                            {isUploading ? 'Uploading...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Previously uploaded files section */}
            <div className="w-full max-w-md mt-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-center mb-4">Previously Uploaded Files</h2>
                
                {loadingFiles ? (
                    <div className="text-center py-4">Loading files...</div>
                ) : availableFiles.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {availableFiles.map((file, index) => (
                            <li key={index} className="py-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {file.file.originalname || file.file.filename}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {file.file.formattedSize || `${Math.round(file.file.size/1024)} KB`} • Uploaded by {file.username}
                                        </p>
                                    </div>
                                    <a 
                                        href={file.downloadUrl || `${SERVER_URL}/files/${file.file.filename}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Download
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-4 text-gray-500">
                        No files uploaded yet
                    </div>
                )}
                
                <div className="mt-4 text-center">
                    <button 
                        onClick={fetchAvailableFiles}
                        className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        Refresh Files
                    </button>
                </div>
            </div>

            <SuccessModal isOpen={showSuccessModal} onClose={closeSuccessModal} />
        </div>
    );
};

export default Auto;