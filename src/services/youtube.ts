
const YT_API_KEY_KEY = 'focustube_youtube_api_key';

export interface ResolvedVideo {
  youtubeId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export interface ResolvedPlaylist {
  youtubeId: string;
  title: string;
  description: string;
  videos: ResolvedVideo[];
}

export class YoutubeService {
  static getApiKey(): string {
    return localStorage.getItem(YT_API_KEY_KEY) || '';
  }

  static setApiKey(key: string) {
    localStorage.setItem(YT_API_KEY_KEY, key);
  }

  static extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Parse ISO 8601 duration (e.g. PT15M33S -> 933 seconds)
  private static parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 600; // default 10 minutes
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  static async resolveVideoMetadata(url: string): Promise<ResolvedVideo> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
        );
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          return {
            youtubeId: videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
            durationSeconds: this.parseDuration(item.contentDetails.duration)
          };
        }
      } catch (err) {
        console.warn('Official YouTube API failed, falling back to oEmbed proxy:', err);
      }
    }

    // Keyless/OAuth fallback using noembed oEmbed JSON
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      if (data && data.title) {
        return {
          youtubeId: videoId,
          title: data.title,
          channel: data.author_name || 'YouTube Creator',
          thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          durationSeconds: 1200 // default duration
        };
      }
    } catch (err) {
      console.error('oEmbed resolution failed:', err);
    }

    throw new Error(`Failed to resolve details for YouTube video ID "${videoId}". Ensure the video is public and your network connection is active.`);
  }

  // Searches videos
  static async searchVideos(query: string): Promise<ResolvedVideo[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Searching YouTube requires a YouTube Data API Key configured in Settings.');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(query)}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.items) {
        return data.items.map((item: any) => ({
          youtubeId: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
          durationSeconds: 1200 // search endpoint doesn't give duration; would need sub-query, so default
        }));
      }
    } catch (err) {
      console.error('YouTube Search API failed:', err);
      throw new Error('YouTube Search API request failed.');
    }

    return [];
  }

  static extractPlaylistId(url: string): string | null {
    if (url.startsWith('PL') && url.length >= 18) {
      return url;
    }
    const regExp = /[&?]list=([^#\&\?]*)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }

  static async resolvePlaylistVideos(url: string): Promise<ResolvedPlaylist> {
    const playlistId = this.extractPlaylistId(url);
    if (!playlistId) {
      throw new Error('Invalid YouTube Playlist URL');
    }

    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        // Fetch playlist metadata (title/description)
        const plMetaResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlists?id=${playlistId}&part=snippet&key=${apiKey}`
        );
        const plMetaData = await plMetaResponse.json();
        const snippet = plMetaData.items?.[0]?.snippet;
        const plTitle = snippet?.title || 'YouTube Playlist';
        const plDesc = snippet?.description || '';

        // Fetch videos
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&part=snippet,contentDetails&maxResults=50&key=${apiKey}`
        );
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const videos = data.items.map((item: any) => ({
            youtubeId: item.snippet.resourceId?.videoId || '',
            title: item.snippet.title,
            channel: item.snippet.channelTitle || 'YouTube Creator',
            thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
            durationSeconds: 1200
          })).filter((v: any) => v.youtubeId !== '');

          return {
            youtubeId: playlistId,
            title: plTitle,
            description: plDesc,
            videos
          };
        }
      } catch (err) {
        console.warn('Official YouTube Playlist API failed, falling back to keyless proxies:', err);
      }
    }

    // Keyless fallback using public Invidious API endpoints
    const invidiousInstances = [
      'https://yewtu.be',
      'https://vid.puffyan.us',
      'https://invidious.flokinet.to'
    ];
    
    for (const instance of invidiousInstances) {
      try {
        // Fetch playlist from public instance with 5s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${instance}/api/v1/playlists/${playlistId}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && data.videos && data.videos.length > 0) {
            const videos = data.videos.map((item: any) => ({
              youtubeId: item.videoId || '',
              title: item.title,
              channel: item.author || 'YouTube Creator',
              thumbnailUrl: item.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
              durationSeconds: item.lengthSeconds || 1200
            })).filter((v: any) => v.youtubeId !== '');

            return {
              youtubeId: playlistId,
              title: data.title || 'YouTube Playlist',
              description: data.description || '',
              videos
            };
          }
        }
      } catch (e) {
        console.warn(`Invidious instance ${instance} failed:`, e);
      }
    }

    throw new Error('Failed to resolve playlist. Ensure the playlist is public, public Invidious instances are online, or configure a YouTube API key in Settings.');
  }
}
