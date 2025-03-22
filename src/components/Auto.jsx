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

    // Setting up the server URL
    const SERVER_URL = "https://ai-powered-5nqe.onrender.com";

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

        try {
            console.log("Uploading file to server...");
            
            // Upload to server with additional headers to help with CORS
            const response = await axios.post(`${SERVER_URL}/upload`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                withCredentials: false,
                timeout: 30000 // 30 second timeout
            });
            
            console.log("Server response:", response.data);
            
            // Complete the progress
            clearInterval(progressTimer);
            setUploadProgress(100);
            setIsUploading(false);
            
            // Show success modal
            setShowSuccessModal(true);
            
        } catch (error) {
            clearInterval(progressTimer);
            setIsUploading(false);
            console.error("Upload error:", error);
            
            if (error.response) {
                setErrorMessage(`Server error (${error.response.status}): ${error.response.data?.error || error.message}`);
            } else if (error.request) {
                setErrorMessage("No response from server. Check your network connection.");
                
                // Try alternative upload if server is unreachable
                try {
                    console.log("Trying alternative upload method...");
                    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                    const targetUrl = `${SERVER_URL}/upload`;
                    
                    const proxyResponse = await axios.post(`${proxyUrl}${targetUrl}`, data, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Origin': 'https://finalaipowered.netlify.app'
                        },
                        withCredentials: false,
                        timeout: 30000
                    });
                    
                    console.log("Proxy server response:", proxyResponse.data);
                    
                    // Complete the progress
                    setUploadProgress(100);
                    setIsUploading(false);
                    
                    // Show success modal
                    setShowSuccessModal(true);
                } catch (proxyError) {
                    console.error("Alternative upload failed:", proxyError);
                    setErrorMessage(`Error: ${error.message}. Alternative method also failed.`);
                }
            } else {
                setErrorMessage(`Error: ${error.message}`);
            }
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
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md p-6 bg-white rounded-lg shadow-md"
            >
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

            <SuccessModal isOpen={showSuccessModal} onClose={closeSuccessModal} />
        </div>
    );
};

export default Auto;