//new code
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import mongoose from 'mongoose';
import csvParser from 'csv-parser'; // For CSV parsing
import xlsx from 'xlsx'; // For Excel parsing
import fs from 'fs';
import path from 'path'; // For handling file paths
import 'dotenv/config'; // Load environment variables

const app = express();
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excelFile';
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Enable CORS for frontend access
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://your-production-domain.com' 
    : 'http://localhost:5173', // Your frontend URL in development
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Define Mongoose schema and model
const fileSchema = new mongoose.Schema({
  data: Object, // Adjust schema to match your data structure
});

const FileModel = mongoose.model('File', fileSchema);

// Multer setup for file storage (in `uploads/` folder)
const upload = multer({ dest: 'uploads/' });

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check file type and process based on the mimetype
    if (file.mimetype === 'text/csv') {
      const results = [];
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          // Save to MongoDB
          const newFile = new FileModel({ data: results });
          await newFile.save();

          // Cleanup the uploaded file
          fs.unlinkSync(file.path);

          res.status(200).json({ message: 'CSV file uploaded and saved to MongoDB' });
        });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(file.path);
      const sheet_name_list = workbook.SheetNames;
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

      // Save to MongoDB
      const newFile = new FileModel({ data });
      await newFile.save();

      // Cleanup the uploaded file
      fs.unlinkSync(file.path);

      res.status(200).json({ message: 'Excel file uploaded and saved to MongoDB' });
    } else {
      // Unsupported file format
      fs.unlinkSync(file.path); // Cleanup the uploaded file
      res.status(400).json({ message: 'Unsupported file format' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Analyze file route (get the most recent file and analyze its data)
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
