import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import 'dotenv/config'; // Load environment variables

// Initialize express app
const app = express();
const port = process.env.UPLOAD_SERVER_PORT || 5004;

// MongoDB connection string
const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/yourDatabaseName"; // Replace with your database URL
mongoose.connect(dbURI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("Error connecting to MongoDB:", err));

// MongoDB Schema for File Uploads
const fileUploadSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    phoneCode: { type: String, required: true },
    phone: { type: String, required: true },
    file: {
        filename: { type: String, required: true },
        path: { type: String, required: true },
        size: { type: Number, required: true },
    },
}, { timestamps: true });

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);

// Enable CORS
app.use(cors());

// Middleware to parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get the directory name equivalent for ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Set up multer storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "uploads"));  // Path where files will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// POST route to handle file upload and form submission
app.post("/upload", upload.single("file"), async (req, res) => {
    const { username, email, phoneCode, phone } = req.body;

    // Check if the file is uploaded
    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }

    // Prepare file data
    const fileData = {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
    };

    // Create a new document to store in MongoDB
    const newFileUpload = new FileUpload({
        username,
        email,
        phoneCode,
        phone,
        file: fileData,
    });

    try {
        // Save the data to MongoDB
        await newFileUpload.save();

        const responseData = {
            message: "File uploaded and data saved successfully",
            userDetails: { username, email, phoneCode, phone },
            file: req.file,
        };

        console.log("Received user details:", responseData.userDetails);
        console.log("File details:", responseData.file);

        res.status(200).send(responseData);
    } catch (error) {
        console.error("Error saving to MongoDB:", error);
        res.status(500).send("Error saving data to database");
    }
});

// GET route to list all uploaded files
app.get("/files", async (req, res) => {
    try {
        // Get all file uploads from MongoDB
        const files = await FileUpload.find({}, { 
            "file.filename": 1, 
            "file.path": 1,
            "file.size": 1,
            "username": 1,
            "email": 1,
            "createdAt": 1
        });
        
        // Add download URL to each file
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filesWithUrls = files.map(file => {
            const fileObj = file.toObject();
            
            // Add a direct download link
            fileObj.downloadUrl = `${baseUrl}/files/${fileObj.file.filename}`;
            
            // Calculate file size in KB or MB
            const fileSizeInBytes = fileObj.file.size;
            if (fileSizeInBytes < 1024 * 1024) {
                fileObj.file.formattedSize = `${(fileSizeInBytes / 1024).toFixed(2)} KB`;
            } else {
                fileObj.file.formattedSize = `${(fileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
            }
            
            return fileObj;
        });
        
        res.status(200).json(filesWithUrls);
    } catch (error) {
        console.error("Error retrieving files:", error);
        res.status(500).send("Error retrieving files");
    }
});

// GET route to download a specific file
app.get("/files/:filename", async (req, res) => {
    const filename = req.params.filename;
    
    try {
        // Find the file in MongoDB first
        const fileData = await FileUpload.findOne({ "file.filename": filename });
        
        if (!fileData) {
            return res.status(404).send("File not found in database");
        }
        
        // Get the file path from the database
        const filepath = fileData.file.path;
        
        // Check if file exists at the path
        if (fs.existsSync(filepath)) {
            return res.download(filepath, filename);
        } else {
            // Try the relative path as a fallback
            const relativeFilepath = path.join(__dirname, "uploads", filename);
            
            if (fs.existsSync(relativeFilepath)) {
                return res.download(relativeFilepath, filename);
            } else {
                console.error(`File not found at path: ${filepath} or ${relativeFilepath}`);
                return res.status(404).send("File not found on server - it may have been deleted during a server restart");
            }
        }
    } catch (error) {
        console.error("Error retrieving file:", error);
        res.status(500).send("Error retrieving file");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
