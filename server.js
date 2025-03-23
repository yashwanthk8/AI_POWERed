//new code
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import mongoose from 'mongoose';
import csvParser from 'csv-parser'; // For CSV pars  ing
import xlsx from 'xlsx'; // For Excel parsing
import fs from 'fs';
import path from 'path'; // For handling file paths
import 'dotenv/config'; // Load environment variables

const app = express();

// Define upload path based on environment
const uploadPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/uploads'
  : 'uploads';

// Make sure uploads directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log(`Created uploads directory at ${uploadPath}`);
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excelFile';
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Enable CORS for frontend access
// Enable CORS for frontend access
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://finalaipowered.netlify.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: process.env.ALLOW_HEADERS || 'Content-Type, Authorization, X-Requested-With'
}));

// Add OPTIONS handling for preflight requests
app.options('*', cors());
// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/files', express.static(uploadPath));

// Define Mongoose schema and model for files
const fileSchema = new mongoose.Schema({
  data: Object, // For Excel/CSV data
});

const FileModel = mongoose.model('File', fileSchema);

// Define schema for user submissions
const submissionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  phoneCode: { type: String, required: true },
  phone: { type: String, required: true },
  originalFilename: { type: String, required: true },
  storedFilename: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileURL: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', submissionSchema);

// Configure multer storage to keep original file extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename while preserving original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { username, email, phoneCode, phone } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Base URL for files
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://ai-powered-5nqe.onrender.com'  // Change this to your server URL
      : `http://localhost:${process.env.PORT || 3000}`;
    
    // Create file URL for frontend
    const fileURL = `${baseUrl}/files/${file.filename}`;

    // Create and save submission record
    const submission = new Submission({
      username,
      email,
      phoneCode,
      phone,
      originalFilename: file.originalname,
      storedFilename: file.filename,
      fileType: file.mimetype,
      fileSize: file.size,
      fileURL: fileURL
    });

    await submission.save();

    // Process file data for MongoDB if it's a spreadsheet file
    if (file.mimetype === 'text/csv') {
      const results = [];
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          // Save to MongoDB
          const newFile = new FileModel({ data: results });
          await newFile.save();
          
          // Send the response here when CSV processing is done
          res.status(200).json({ 
            message: 'File uploaded successfully',
            submission: {
              id: submission._id,
              username: submission.username,
              fileURL: submission.fileURL
            }
          });
        });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(file.path);
      const sheet_name_list = workbook.SheetNames;
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

      // Save to MongoDB
      const newFile = new FileModel({ data });
      await newFile.save();

      res.status(200).json({ 
        message: 'File uploaded successfully',
        submission: {
          id: submission._id,
          username: submission.username,
          fileURL: submission.fileURL
        }
      });
    } else {
      // For other file types, we just store the submission info and provide download link
      res.status(200).json({ 
        message: 'File uploaded successfully',
        submission: {
          id: submission._id,
          username: submission.username,
          fileURL: submission.fileURL
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Get all user submissions
app.get('/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ submittedAt: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
});

// Get a specific user submission
app.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(200).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching submission', error: error.message });
  }
});

// Analyze file route (get the most recent file and analyze its data)
app.get('/analyze', async (req, res) => {
  try {
    // Fetch the most recent file from MongoDB
    const file = await FileModel.findOne().sort({ $natural: -1 });

    if (!file || !file.data) {
      return res.status(404).json({ message: 'No file found to analyze' });
    }

    const data = file.data;

    // Initialize an object to store the count for gender (or any other categories)
    const analysisResult = {
      Sex: {
        male: 0,
        female: 0,
        Other: 0,
      },
    };

    // Loop through the data and count occurrences of categories in the "gender" column
    data.forEach((row) => {
      if (row.Sex === 'male') {
        analysisResult.Sex.male++;
      } else if (row.Sex === 'female') {
        analysisResult.Sex.female++;
      } else if (row.Sex) {
        analysisResult.Sex.Other++;
      }
    });

    // Prepare the data for frontend chart visualization (labels and values)
    const labels = Object.keys(analysisResult.Sex); // Gender categories
    const values = Object.values(analysisResult.Sex); // Count of each category

    // Send the analysis data back to the frontend
    res.json({ labels, values });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error analyzing the file' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
