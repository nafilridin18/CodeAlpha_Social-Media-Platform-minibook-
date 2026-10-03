const fs = require('fs');
const path = require('path');
const multer = require('multer');

const root = path.join(__dirname, '..', 'uploads');
const avatarDirectory = path.join(root, 'avatars');
const postDirectory = path.join(root, 'posts');
const coverDirectory = path.join(root, 'covers');
fs.mkdirSync(avatarDirectory, { recursive: true });
fs.mkdirSync(postDirectory, { recursive: true });
fs.mkdirSync(coverDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = req.baseUrl === '/api/users'
      ? file.fieldname === 'cover' ? coverDirectory : avatarDirectory
      : postDirectory;
    callback(null, directory);
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`);
  },
});

function fileFilter(req, file, callback) {
  const validImage = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype);
  const validVideo = /^video\/(mp4|webm|quicktime)$/.test(file.mimetype);
  if (req.baseUrl === '/api/users' && !validImage) {
    return callback(Object.assign(new Error('Profile and cover photos must be JPEG, PNG, GIF, or WebP images.'), { status: 400 }));
  }
  if (validImage || validVideo) return callback(null, true);
  callback(Object.assign(new Error('Upload an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV).'), { status: 400 }));
}

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

module.exports = {
  profileUpload: uploader.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
  postUpload: uploader.single('media'),
};
