const cloudinary = require("cloudinary").v2;

exports.getPublicIdFromUrl = (url) => {
  const parts = url.split("/upload/")[1];
  const noVersion = parts.replace(/^v\d+\//, "");
  const withoutExt = noVersion.replace(/\.[^/.]+$/, "");
  return withoutExt;
};

exports.deleteFromCloudinary = async (fileUrl) => {
  const publicId = exports.getPublicIdFromUrl(fileUrl);
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};
