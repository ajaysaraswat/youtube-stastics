const { google } = require("googleapis");
const axios = require("axios");

class YouTubeService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.youtube = google.youtube({
      version: "v3",
      auth: apiKey,
    });
  }

  // Extract video ID from various YouTube URL formats
  extractVideoId(urlOrId) {
    if (!urlOrId) return null;

    // If it's already a video ID (11 characters, alphanumeric)
    if (urlOrId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
      return urlOrId;
    }

    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = urlOrId.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Get video statistics
  async getVideoStats(videoId) {
    try {
      const response = await this.youtube.videos.list({
        part: "snippet,statistics",
        id: videoId,
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error("Video not found or invalid video ID");
      }

      const video = response.data.items[0];
      const stats = video.statistics;
      const snippet = video.snippet;

      return {
        videoId: videoId,
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        thumbnail:
          snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        statistics: {
          viewCount: parseInt(stats.viewCount) || 0,
          likeCount: parseInt(stats.likeCount) || 0,
          commentCount: parseInt(stats.commentCount) || 0,
          // Note: Subscriber count is not available for individual videos
          // It's a channel-level statistic
        },
        duration: snippet.duration || null,
        description: snippet.description?.substring(0, 200) + "..." || null,
      };
    } catch (error) {
      console.error("YouTube API Error:", error.message);
      throw new Error(`Failed to fetch video statistics: ${error.message}`);
    }
  }

  // Get channel statistics (for subscriber count)
  async getChannelStats(channelId) {
    try {
      const response = await this.youtube.channels.list({
        part: "statistics",
        id: channelId,
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error("Channel not found");
      }

      const channel = response.data.items[0];
      return {
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0,
        viewCount: parseInt(channel.statistics.viewCount) || 0,
      };
    } catch (error) {
      console.error("Channel API Error:", error.message);
      throw new Error(`Failed to fetch channel statistics: ${error.message}`);
    }
  }

  // Get comprehensive video and channel data
  async getCompleteStats(videoId) {
    try {
      const videoStats = await this.getVideoStats(videoId);

      // Get channel ID from video data
      const videoResponse = await this.youtube.videos.list({
        part: "snippet",
        id: videoId,
      });

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        throw new Error("Video not found");
      }

      const channelId = videoResponse.data.items[0].snippet.channelId;
      const channelStats = await this.getChannelStats(channelId);

      return {
        ...videoStats,
        channelStatistics: channelStats,
      };
    } catch (error) {
      console.error("Complete stats error:", error.message);
      throw error;
    }
  }
}

module.exports = YouTubeService;
