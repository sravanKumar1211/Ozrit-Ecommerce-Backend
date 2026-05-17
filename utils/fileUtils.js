export const buildImagePath = (file) => {
  if (!file) return null;
  return `uploads/${file.filename}`;
};

export const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const baseUrl = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
  const normalizedPath = imagePath.replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.lastIndexOf("/uploads/");
  const publicPath =
    uploadsIndex >= 0 ? normalizedPath.slice(uploadsIndex + 1) : normalizedPath.replace(/^\/+/, "");

  return `${baseUrl}/${publicPath}`;
};
