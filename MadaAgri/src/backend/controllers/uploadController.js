exports.uploadImage = (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'Aucun fichier envoyé.' });
  }
  return res.json({ imageUrl: req.file.path, publicId: req.file.filename });
};