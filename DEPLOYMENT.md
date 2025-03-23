# Deployment Instructions for FinYearPro Backend

Follow these steps to deploy your updated backend server to Render.com:

## 1. Prepare Your Project

Make sure your project has the following structure:
- `server.js` - Main server file
- `package.json` - With all dependencies
- `uploads/` directory - To store uploaded files

## 2. Set Up Environment Variables on Render.com

In your Render.com dashboard, add these environment variables:
- `MONGODB_URI`: Your MongoDB connection string
- `PORT`: 10000 (or any port Render allows)
- `NODE_ENV`: production
- `FRONTEND_URL`: Your frontend URL (for CORS)

## 3. Configure Persistent Storage

Since Render.com's free tier doesn't have persistent storage by default, you'll need to:

1. Use a **Disk** resource in your Render.com dashboard
2. Mount it to your service at `/opt/render/project/src/uploads`
3. Update your server.js file to use this path:

```js
// Add this to your server.js
const uploadPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/uploads'
  : 'uploads';

// And update your storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  // ... rest of your code
});
```

## 4. Configure Build Settings on Render.com

- **Build Command**: `npm install`
- **Start Command**: `node server.js`

## 5. Test Your Deployment

After deploying, test the following endpoints:
- `POST https://ai-powered-5nqe.onrender.com/upload` - For file upload
- `GET https://ai-powered-5nqe.onrender.com/files/FILENAME` - For file download
- `GET https://ai-powered-5nqe.onrender.com/submissions` - To view all submissions

## 6. Update Your Frontend

Update your frontend to use these URLs:
- For file upload: `https://ai-powered-5nqe.onrender.com/upload`
- For downloading files: `https://ai-powered-5nqe.onrender.com/files/FILENAME`

## Troubleshooting

If files are not being served correctly:
1. Check that the Disk resource is mounted correctly
2. Verify that the `/files` route is working by accessing it directly
3. Check server logs on Render.com for any errors 