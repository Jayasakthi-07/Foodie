/**
 * Converts relative image URLs to absolute URLs for cross-device access
 * @param imagePath - Relative path like '/uploads/image.jpg' or full URL
 * @returns Absolute URL pointing to the server
 */
export const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) {
    return '';
  }

  // If it's already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Get API base URL from environment
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // If VITE_API_URL is set (for network access), use it
    // Remove /api suffix if present and add the image path
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}${imagePath}`;
  }

  // For local development, use relative path (works with Vite proxy)
  return imagePath;
};

