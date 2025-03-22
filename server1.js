import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import { GridFsStorage } from "multer-gridfs-storage";
import crypto from "crypto";
import 'dotenv/config'; // Load environment variables

// Initialize express app
const app = express();
const port = process.env.PORT || process.env.UPLOAD_SERVER_PORT || 5004;

// MongoDB connection string
const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/yourDatabaseName"; // Replace with your database URL

// MongoDB connection
let gfs;
mongoose.connect(dbURI)
    .then((conn) => {
        console.log("MongoDB connected");
        // Initialize GridFS bucket
        gfs = new GridFSBucket(conn.connection.db, {
            bucketName: 'uploads'
        });
    })
    .catch((err) => console.error("Error connecting to MongoDB:", err));

// MongoDB Schema for File Uploads
const fileUploadSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    phoneCode: { type: String, required: true },
    phone: { type: String, required: true },
    file: {
        filename: { type: String, required: true },
        fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
        originalname: { type: String, required: true },
        size: { type: Number, required: true },
        mimetype: { type: String, required: true },
    },
}, { timestamps: true });

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);

// Create storage engine for GridFS
const storage = new GridFsStorage({
    url: dbURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            // Create a unique filename with original extension
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});

const upload = multer({ storage });

// Enable CORS
app.use(cors({
  origin: ['https://finalaipowered.netlify.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        fileId: req.file.id,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
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
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                id: req.file.id
            }
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
            "file.fileId": 1,
            "file.originalname": 1,
            "file.size": 1,
            "file.mimetype": 1,
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
    try {
        const filename = req.params.filename;
        
        // Find the file in MongoDB
        const fileData = await FileUpload.findOne({ "file.filename": filename });
        
        if (!fileData) {
            return res.status(404).send("File not found in database");
        }
        
        // Create a read stream from GridFS
        const downloadStream = gfs.openDownloadStreamByName(filename);
        
        // Set the proper content type
        res.set('Content-Type', fileData.file.mimetype);
        res.set('Content-Disposition', `attachment; filename="${fileData.file.originalname}"`);
        
        // Pipe the file to the response
        downloadStream.pipe(res);
        
        downloadStream.on('error', (error) => {
            console.error("Error streaming file:", error);
            res.status(500).send("Error downloading file");
        });
        
    } catch (error) {
        console.error("Error retrieving file:", error);
        res.status(500).send("Error retrieving file");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
