# YouTube Statistics API - Setup Instructions

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Get YouTube API Key:**

   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project or select existing one
   - Enable YouTube Data API v3
   - Create credentials (API Key)
   - Copy your API key

3. **Configure environment:**

   - Copy `.env.example` to `.env`
   - Replace `your_youtube_api_key_here` with your actual API key

4. **Start the server:**
   ```bash
   npm run dev
   ```

## 📊 API Endpoints

### Get Complete Video Statistics (including channel subscriber count)

```
GET /api/youtube/stats?videoId=VIDEO_ID
GET /api/youtube/stats?url=https://www.youtube.com/watch?v=VIDEO_ID
```

### Get Video Statistics Only (without subscriber count)

```
GET /api/youtube/video-stats?videoId=VIDEO_ID
GET /api/youtube/video-stats?url=https://www.youtube.com/watch?v=VIDEO_ID
```

## 📝 Example Usage

```bash
# Using video ID
curl "http://localhost:3000/api/youtube/stats?videoId=dQw4w9WgXcQ"

# Using full YouTube URL
curl "http://localhost:3000/api/youtube/stats?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## 📈 Response Format

```json
{
  "success": true,
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "channelTitle": "Rick Astley",
    "publishedAt": "2009-10-25T06:57:33Z",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "statistics": {
      "viewCount": 1234567890,
      "likeCount": 12345678,
      "commentCount": 1234567
    },
    "channelStatistics": {
      "subscriberCount": 1234567,
      "videoCount": 123,
      "viewCount": 1234567890
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔧 Features

- ✅ Real-time YouTube video statistics
- ✅ Support for video ID or full YouTube URL
- ✅ Views, likes, comments count
- ✅ Channel subscriber count
- ✅ Video metadata (title, channel, thumbnail)
- ✅ Error handling and validation
- ✅ CORS enabled for frontend integration
