const axios = require('axios');

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload an image buffer to imgbb and return the CDN URL.
 * Throws error if IMGBB_API_KEY is not configured (production requirement).
 */
const uploadToImgbb = async (buffer, filename = 'image.jpg') => {
    const apiKey = process.env.IMGBB_API_KEY;
    
    if (!apiKey) {
        throw new Error('IMGBB_API_KEY is required. Images must be uploaded to CDN for persistence across deployments.');
    }

    try {
        const base64 = buffer.toString('base64');
        const response = await axios.post(
            IMGBB_API_URL,
            { image: base64, name: filename },
            {
                params: { key: apiKey },
                timeout: 20000,
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );
        
        if (response.data?.data?.url) {
            console.log(`[imgbb] Uploaded: ${filename} → ${response.data.data.url}`);
            return response.data.data.url;
        }
        
        throw new Error('ImgBB response missing image URL');
    } catch (error) {
        const errorMsg = error?.response?.data?.error?.message || error.message;
        console.error(`[imgbb] Upload failed for ${filename}:`, errorMsg);
        throw new Error(`Image upload to CDN failed: ${errorMsg}`);
    }
};

module.exports = { uploadToImgbb };
