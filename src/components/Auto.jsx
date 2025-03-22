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
        
        // Reset error message
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
        
        // Print FormData contents for debugging
        console.log("Form data entries:");
        for (let pair of data.entries()) {
            if (pair[0] === 'file') {
                console.log(pair[0], pair[1].name, pair[1].type, pair[1].size);
            } else {
                console.log(pair[0], pair[1]);
            }
        }
        
        // Setup progress simulation
        const progressTimer = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressTimer);
                    return 90;
                }
                return prev + 5;
            });
        }, 300);

        // Try all upload methods in sequence for reliability
        let uploadSuccess = false;

        // Method 1: Direct server upload
        if (!uploadSuccess) {
            try {
                console.log("Attempting direct upload to server...");
                const directResponse = await axios({
                    method: 'post',
                    url: 'https://ai-powered-5nqe.onrender.com/upload',
                    data: data,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    validateStatus: function (status) {
                        return true;
                    },
                    timeout: 15000 // 15 second timeout
                });
                
                console.log("Direct server response:", directResponse);
                
                if (directResponse.status >= 200 && directResponse.status < 300) {
                    uploadSuccess = true;
                    handleUploadSuccess(progressTimer);
                    return;
                } else {
                    console.error("Direct upload failed with status:", directResponse.status);
                }
            } catch (error) {
                console.error("Direct upload error:", error.message);
            }
        }

        // Method 2: Netlify function proxy
        if (!uploadSuccess) {
            try {
                console.log("Attempting upload through Netlify function...");
                const proxyResponse = await axios({
                    method: 'post',
                    url: '/.netlify/functions/upload-proxy',
                    data: data,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    validateStatus: function (status) {
                        return true;
                    },
                    timeout: 15000 // 15 second timeout
                });
                
                console.log("Netlify proxy response:", proxyResponse);
                
                if (proxyResponse.status >= 200 && proxyResponse.status < 300) {
                    uploadSuccess = true;
                    handleUploadSuccess(progressTimer);
                    return;
                } else {
                    console.error("Netlify proxy upload failed with status:", proxyResponse.status);
                }
            } catch (error) {
                console.error("Netlify proxy error:", error.message);
            }
        }

        // Method 3: Formspree fallback
        if (!uploadSuccess) {
            try {
                console.log("Attempting fallback with Formspree...");
                const emailData = {
                    name: formData.username,
                    email: formData.email,
                    message: `Form submission from ${formData.username} (${formData.email}). Phone: +${formData.phoneCode}${formData.phone}. File: ${formData.file.name} (${Math.round(formData.file.size/1024)} KB)`,
                    _subject: "Form Submission from FinYearPro"
                };
                
                const formspreeResponse = await axios.post('https://formspree.io/f/xknooqlb', emailData);
                
                if (formspreeResponse.status >= 200 && formspreeResponse.status < 300) {
                    uploadSuccess = true;
                    handleUploadSuccess(progressTimer);
                    return;
                }
            } catch (emailError) {
                console.error("Failed to send notification:", emailError.message);
            }
        }

        // If all methods failed
        clearInterval(progressTimer);
        setIsUploading(false);
        setErrorMessage("Unable to submit the form through any method. Please try again later or contact support.");
    };

    // Helper function for successful uploads
    const handleUploadSuccess = (progressTimer) => {
        clearInterval(progressTimer);
        setUploadProgress(100);
        setIsUploading(false);
        setShowSuccessModal(true);
        
        // Reset form
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
        
        console.log("Upload successful!");
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
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