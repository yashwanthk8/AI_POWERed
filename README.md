# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# FinYearPro

A financial data analysis application for uploading and analyzing financial data.

## Deployment Guide

### Prerequisites
- Node.js and npm installed
- MongoDB Atlas account
- Hosting platform (Heroku, Vercel, Netlify, etc.)

### Setting up MongoDB Atlas
1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster
3. Set up database access with a new user and password
4. Set up network access (allow access from anywhere for simplicity)
5. Get your connection string from the "Connect" button

### Environment Variables
1. Create a `.env` file in the root directory with the following variables:
   ```
   # MongoDB Atlas Connection String
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

   # Server Ports
   PORT=3000
   UPLOAD_SERVER_PORT=5003

   # Frontend URL
   FRONTEND_URL=https://your-frontend-production-url.com
   NODE_ENV=production
   ```
2. Replace the placeholders in the MongoDB connection string with your actual values
3. Set NODE_ENV to 'production' in deployment

### Deployment Steps
1. Front-end (React App):
   - Build the application: `npm run build`
   - Deploy the `dist` folder to your frontend hosting platform (Vercel, Netlify, etc.)
   - Set the FRONTEND_URL environment variable to your deployed frontend URL

2. Back-end (Express Server):
   - Deploy server.js and server1.js to a Node.js hosting platform (Heroku, Render, etc.)
   - Set up the environment variables on your hosting platform
   - Make sure to set up build commands and start commands according to your platform

### Local Development
1. Install dependencies: `npm install`
2. Create a `.env` file with local configs
3. Run the development server: `npm run dev`
4. In separate terminals, run `node server.js` and `node server1.js`

## Project Structure
- `server.js`: Main server for handling file uploads and MongoDB interactions
- `server1.js`: Secondary server for additional file upload functionality
- Frontend: React application with Vite
