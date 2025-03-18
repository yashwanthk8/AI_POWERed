import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

// Initialize express app
const app = express();
const port = 5003;

// MongoDB connection string
const dbURI = "mongodb://localhost:27017/yourDatabaseName"; // Replace with your database URL
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
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

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
