const multer = require('multer')
const path = require('path');

module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
      let ext = path.extname(file.originalname);
      if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".PNG" && ext !== ".JPG" && ext !== ".JPEG") {
        cb(new Error("Unsupported file type!"), false);
        return;
      }
      cb(null, true);
    },
  });


// Storage configuration
// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, 'uploads/'); // folder to temporarily store uploaded files
//     },
//     filename: function(req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     }
// });

// // File filter (optional, for images only)
// const fileFilter = (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|gif/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (extname && mimetype) cb(null, true);
//     else cb('Error: Images Only!');
// };

// const upload = multer({ storage, fileFilter });