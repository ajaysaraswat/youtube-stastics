const express = require("express");
const cors = require("cors");
require("dotenv").config();
const YouTubeService = require("./services/youtubeService");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize YouTube service
const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY);

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:3000", // React dev server
      "http://localhost:4173", // Vite preview
      "https://youtube-stastics-k3c6uhs3j-ajay-kumar-saraswats-projects.vercel.app", // Your Vercel frontend
      /\.vercel\.app$/, // All Vercel preview deployments
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "YouTube Statistics Backend API is running!",
    status: "success",
    timestamp: new Date().toISOString(),
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API routes for YouTube statistics
app.get("/api/youtube/stats", async (req, res) => {
  try {
    const { videoId, url } = req.query;

    if (!videoId && !url) {
      return res.status(400).json({
        error: "Missing required parameter",
        message: "Please provide either 'videoId' or 'url' parameter",
        example: "/api/youtube/stats?videoId=dQw4w9WgXcQ",
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "YouTube API key not configured",
      });
    }

    // Extract video ID from URL or use provided videoId
    const extractedVideoId = url ? youtubeService.extractVideoId(url) : videoId;

    if (!extractedVideoId) {
      return res.status(400).json({
        error: "Invalid video identifier",
        message:
          "Could not extract valid video ID from provided URL or videoId",
      });
    }

    // Get comprehensive video and channel statistics
    const stats = await youtubeService.getCompleteStats(extractedVideoId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats API Error:", error.message);
    res.status(500).json({
      error: "Failed to fetch video statistics",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Alternative endpoint for just video stats (without channel subscriber count)
app.get("/api/youtube/video-stats", async (req, res) => {
  try {
    const { videoId, url } = req.query;

    if (!videoId && !url) {
      return res.status(400).json({
        error: "Missing required parameter",
        message: "Please provide either 'videoId' or 'url' parameter",
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "YouTube API key not configured",
      });
    }

    const extractedVideoId = url ? youtubeService.extractVideoId(url) : videoId;

    if (!extractedVideoId) {
      return res.status(400).json({
        error: "Invalid video identifier",
        message: "Could not extract valid video ID",
      });
    }

    const stats = await youtubeService.getVideoStats(extractedVideoId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Video Stats API Error:", error.message);
    res.status(500).json({
      error: "Failed to fetch video statistics",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Proxy endpoint to fetch from Vercel API (bypasses CORS)
app.get("/api/proxy/youtube/stats", async (req, res) => {
  try {
    const { videoId, url } = req.query;

    if (!videoId && !url) {
      return res.status(400).json({
        error: "Missing required parameter",
        message: "Please provide either 'videoId' or 'url' parameter",
        example: "/api/proxy/youtube/stats?videoId=dQw4w9WgXcQ",
      });
    }

    // Construct the Vercel API URL (works for both local and deployed)
    const vercelApiUrl =
      "https://youtube-stastics-k3c6uhs3j-ajay-kumar-saraswats-projects.vercel.app/api/youtube/stats";
    const params = new URLSearchParams();

    if (videoId) params.append("videoId", videoId);
    if (url) params.append("url", url);

    const fullUrl = `${vercelApiUrl}?${params.toString()}`;

    console.log(`Proxying request to: ${fullUrl}`);

    // Fetch from Vercel API
    const response = await axios.get(fullUrl, {
      timeout: 10000, // 10 second timeout
      headers: {
        "User-Agent": "YouTube-Stats-Proxy/1.0",
      },
    });

    // Return the data with CORS headers
    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
      source: "vercel-proxy",
    });
  } catch (error) {
    console.error("Proxy API Error:", error.message);

    if (error.response) {
      // Vercel API returned an error
      res.status(error.response.status).json({
        error: "Vercel API Error",
        message: error.response.data?.message || error.message,
        status: error.response.status,
        timestamp: new Date().toISOString(),
      });
    } else if (error.code === "ECONNABORTED") {
      // Timeout error
      res.status(504).json({
        error: "Request Timeout",
        message: "The Vercel API took too long to respond",
        timestamp: new Date().toISOString(),
      });
    } else {
      // Network or other error
      res.status(500).json({
        error: "Proxy Error",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 API endpoint: http://localhost:${PORT}/api/youtube/stats`);
});

module.exports = app;
