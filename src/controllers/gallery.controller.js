const { success, error } = require('../utils/response');
const GalleryService = require('../services/gallery.service');

const GalleryController = {
  async list(req, res, next) {
    try {
      const photos = GalleryService.list();
      return success(res, { photos });
    } catch (err) {
      next(err);
    }
  },

  async upload(req, res, next) {
    try {
      if (!req.file) return error(res, 'الملف مطلوب');
      return success(res, {
        photo: {
          name: req.file.filename,
          url: '/gallery-img/' + encodeURIComponent(req.file.filename)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      GalleryService.delete(req.params.name);
      return success(res);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = GalleryController;
