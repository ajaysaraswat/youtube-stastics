const express = require("express");
const cors = require("cors");
require("dotenv").config();
const YouTubeService = require("./services/youtubeService");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize YouTube service
const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
