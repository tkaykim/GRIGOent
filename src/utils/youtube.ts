export function getYoutubeThumb(url: string, quality: 'maxresdefault' | 'mqdefault' = 'mqdefault'): string | null {
  if (!url) return null;
  
  try {
    let videoId = null;
    
    // 다양한 유튜브 URL 형태 처리
    if (url.includes("youtube.com") || url.includes("www.youtube.com")) {
      // youtube.com/watch?v=VIDEO_ID or youtube.com/watch?v=VIDEO_ID&other_params
      const match = url.match(/[?&]v=([^&]+)/);
      videoId = match ? match[1] : null;
    } else if (url.includes("youtu.be")) {
      // youtu.be/VIDEO_ID or youtu.be/VIDEO_ID?other_params
      const match = url.match(/youtu\.be\/([^?&]+)/);
      videoId = match ? match[1] : null;
    } else if (url.includes("youtube.com/embed/")) {
      // youtube.com/embed/VIDEO_ID
      const match = url.match(/youtube\.com\/embed\/([^?&]+)/);
      videoId = match ? match[1] : null;
    }
    
    if (videoId) {
      // 비디오 ID에서 불필요한 문자 제거
      videoId = videoId.split('&')[0].split('?')[0];
      return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    }
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
  }
  
  return null;
}

export function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  
  try {
    let videoId = null;
    
    // 다양한 유튜브 URL 형태 처리
    if (url.includes("youtube.com") || url.includes("www.youtube.com")) {
      // youtube.com/watch?v=VIDEO_ID or youtube.com/watch?v=VIDEO_ID&other_params
      const match = url.match(/[?&]v=([^&]+)/);
      videoId = match ? match[1] : null;
    } else if (url.includes("youtu.be")) {
      // youtu.be/VIDEO_ID or youtu.be/VIDEO_ID?other_params
      const match = url.match(/youtu\.be\/([^?&]+)/);
      videoId = match ? match[1] : null;
    } else if (url.includes("youtube.com/embed/")) {
      // youtube.com/embed/VIDEO_ID
      const match = url.match(/youtube\.com\/embed\/([^?&]+)/);
      videoId = match ? match[1] : null;
    }
    
    if (videoId) {
      // 비디오 ID에서 불필요한 문자 제거
      videoId = videoId.split('&')[0].split('?')[0];
      return videoId;
    }
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
  }
  
  return null;
}

export function isYoutubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}