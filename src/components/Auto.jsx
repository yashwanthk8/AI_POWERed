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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [submissionDetails, setSubmissionDetails] = useState(null);

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
        setLoading(true);
        setError(null);
        setSuccess(false);
        setSubmissionDetails(null);
        
        // Validate file
        if (!formData.file) {
            setErrorMessage("Please upload a file");
            setLoading(false);
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

        // API URLs - try local proxy first, then direct, then with CORS proxies as fallback
        const localProxyUrl = "http://localhost:3001/api/upload"; // Our local proxy
        const directApiUrl = "https://ai-powered-5nqe.onrender.com/upload";
        // List of CORS proxies to try as a last resort
        const corsProxies = [
            "https://corsproxy.io/?",
            "https://api.allorigins.win/raw?url=",
            "https://proxy.cors.sh/"
        ];
        
        try {
            // First try local proxy (most reliable)
            try {
                console.log("Trying local proxy server...");
                const response = await axios.post(localProxyUrl, data, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    timeout: 15000, // 15 second timeout
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                });
                clearInterval(progressTimer);
                setUploadProgress(100);
                setSuccess(true);
                setSubmissionDetails(response.data.submission);
                setShowSuccessModal(true);
                console.log(response.data);
                return;
            } catch (localProxyError) {
                console.error("Local proxy failed:", localProxyError);
                
                // Try direct connection
                try {
                    console.log("Trying direct connection...");
                    const response = await axios.post(directApiUrl, data, {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            "Access-Control-Allow-Origin": "*",
                            "X-Requested-With": "XMLHttpRequest"
                        },
                        timeout: 30000, // 30 second timeout
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadProgress(percentCompleted);
                        }
                    });
                    clearInterval(progressTimer);
                    setUploadProgress(100);
                    setSuccess(true);
                    setSubmissionDetails(response.data.submission);
                    setShowSuccessModal(true);
                    console.log(response.data);
                    return;
                } catch (directError) {
                    console.error("Direct API call failed:", directError);
                    
                    // If it's a CORS error or network error, try with CORS proxies
                    if (directError.code === 'ERR_NETWORK' || 
                        (directError.message && directError.message.includes('CORS'))) {
                        
                        // Try each CORS proxy in order
                        for (const proxy of corsProxies) {
                            try {
                                console.log(`Trying with CORS proxy: ${proxy}`);
                                const proxyUrl = `${proxy}${directApiUrl}`;
                                
                                const proxyResponse = await axios.post(proxyUrl, data, {
                                    headers: {
                                        "Content-Type": "multipart/form-data",
                                        "X-Requested-With": "XMLHttpRequest"
                                    },
                                    timeout: 30000,
                                    onUploadProgress: (progressEvent) => {
                                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                        setUploadProgress(percentCompleted);
                                    }
                                });
                                
                                clearInterval(progressTimer);
                                setUploadProgress(100);
                                setSuccess(true);
                                setSubmissionDetails(proxyResponse.data.submission);
                                setShowSuccessModal(true);
                                console.log(proxyResponse.data);
                                return;
                            } catch (proxyError) {
                                console.error(`CORS proxy ${proxy} failed:`, proxyError);
                                // Continue to the next proxy
                            }
                        }
                        
                        // If all proxies failed, show a helpful message
                        throw new Error("All connection methods failed. Please try one of the following:\n1. Start the local proxy with 'npm run proxy'\n2. Check if the backend server is running\n3. Contact your administrator for help with CORS configuration");
                    } else {
                        throw directError; // Let the outer catch handle it
                    }
                }
            }
        } catch (error) {
            clearInterval(progressTimer);
            setIsUploading(false);
            setLoading(false);
            console.error("Error submitting the form", error);
            
            if (error.code === 'ERR_NETWORK') {
                setErrorMessage("Network error: Cannot connect to the server. The server may be down or experiencing issues.");
                setError("Network error: Cannot connect to the server. The server may be down or experiencing issues.");
            } else if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 403) {
                    setErrorMessage("Server error: 403 Forbidden. The server is rejecting the request. This could be due to CORS restrictions or authentication issues.");
                    setError("Server error: 403 Forbidden. The server is rejecting the request. This could be due to CORS restrictions or authentication issues.");
                } else {
                    setErrorMessage(`Server error: ${error.response.status} ${error.response.data?.message || error.response.statusText || ''}`);
                    setError(`Server error: ${error.response.status} ${error.response.data?.message || error.response.statusText || ''}`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                setErrorMessage("No response from server. Please try again later.");
                setError("No response from server. Please try again later.");
            } else {
                // Something happened in setting up the request that triggered an Error
                setErrorMessage(`Error: ${error.message}`);
                setError(`Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
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
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        Form submitted successfully!
                    </div>
                )}

                {submissionDetails && (
                    <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-md">
                        <h3 className="font-semibold text-lg mb-2">File Uploaded Successfully</h3>
                        <p className="mb-1"><span className="font-medium">Name:</span> {submissionDetails.username}</p>
                        {submissionDetails.fileURL && (
                            <div className="mt-3">
                                <p className="mb-1 font-medium">Your file is available at:</p>
                                <a 
                                    href={submissionDetails.fileURL} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {submissionDetails.fileURL}
                                </a>
                            </div>
                        )}
                    </div>
                )}
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
                            defaultValue=""
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
                        disabled={isUploading || loading}
                        className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isUploading || loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {isUploading || loading ? 'Uploading...' : 'Submit'}
                    </button>
                </div>
            </form>

            <SuccessModal isOpen={showSuccessModal} onClose={closeSuccessModal} />
        </div>
    );
};

export default Auto;