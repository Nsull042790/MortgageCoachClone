/**
 * Vimeo Upload Utility
 * Handles uploading recorded videos to Vimeo for sharing
 */

const VIMEO_ACCESS_TOKEN = '4ee3593a9127bb6586dd51925f553281';
const VIMEO_API_BASE = 'https://api.vimeo.com';

interface VimeoUploadResponse {
  success: boolean;
  videoId?: string;
  videoUri?: string;
  error?: string;
}

interface VimeoCreateVideoResponse {
  uri: string;
  link: string;
  upload: {
    upload_link: string;
    approach: string;
    size: number;
    status: string;
  };
}

/**
 * Upload a video blob to Vimeo
 * Uses the tus resumable upload protocol
 */
export async function uploadToVimeo(
  videoBlob: Blob,
  onProgress?: (percent: number) => void
): Promise<VimeoUploadResponse> {
  try {
    // Step 1: Create the video on Vimeo and get upload link
    const createResponse = await fetch(`${VIMEO_API_BASE}/me/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({
        upload: {
          approach: 'tus',
          size: videoBlob.size,
        },
        name: `Loan Scenario Video - ${new Date().toLocaleDateString()}`,
        description: 'Video message for loan scenario comparison',
        privacy: {
          view: 'anybody',
          embed: 'public',
        },
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('Vimeo create error:', errorData);
      return {
        success: false,
        error: `Failed to create video: ${createResponse.status} ${createResponse.statusText}`,
      };
    }

    const createData: VimeoCreateVideoResponse = await createResponse.json();
    const uploadLink = createData.upload.upload_link;
    const videoUri = createData.uri;

    // Extract video ID from URI (format: /videos/123456789)
    const videoId = videoUri.split('/').pop();

    // Step 2: Upload the video using tus protocol
    const uploadResponse = await fetch(uploadLink, {
      method: 'PATCH',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': '0',
        'Content-Type': 'application/offset+octet-stream',
      },
      body: videoBlob,
    });

    if (!uploadResponse.ok) {
      return {
        success: false,
        error: `Failed to upload video: ${uploadResponse.status}`,
      };
    }

    // Report 100% progress
    if (onProgress) {
      onProgress(100);
    }

    return {
      success: true,
      videoId,
      videoUri,
    };
  } catch (error) {
    console.error('Vimeo upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Check if a Vimeo video is ready for playback
 * Videos need time to transcode after upload
 */
export async function checkVideoStatus(videoId: string): Promise<{
  ready: boolean;
  status: string;
}> {
  try {
    const response = await fetch(`${VIMEO_API_BASE}/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4',
      },
    });

    if (!response.ok) {
      return { ready: false, status: 'error' };
    }

    const data = await response.json();
    const status = data.transcode?.status || data.status;

    return {
      ready: status === 'complete' || status === 'available',
      status,
    };
  } catch {
    return { ready: false, status: 'error' };
  }
}
