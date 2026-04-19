/**
 * Modèle de contrôleur - À utiliser comme template
 * 
 * Emplacement: src/backend/controllers/[nomController].js
 */

const { NotFoundError, ValidationError } = require('../errors/ApiError');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Récupérer une ressource
 */
const getResource = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validation additionnelle si nécessaire
  if (!id) {
    throw new ValidationError('ID is required', { id: 'Required' });
  }

  // Logique métier
  // const resource = await Resource.findById(id);
  
  // if (!resource) {
  //   throw new NotFoundError('Resource not found');
  // }

  // logger.info(`Resource ${id} retrieved`);

  // sendSuccess(res, resource);
});

/**
 * Récupérer toutes les ressources
 */
const getResources = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  // Logique métier
  // const resources = await Resource.find()
  //   .limit(limit)
  //   .skip((page - 1) * limit);
  // const total = await Resource.countDocuments();

  // sendPaginatedSuccess(res, resources, { page, limit, total });
});

/**
 * Créer une ressource
 */
const createResource = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Validation supplémentaire
  if (!name || !description) {
    throw new ValidationError('Missing required fields', {
      name: !name ? 'Required' : undefined,
      description: !description ? 'Required' : undefined,
    });
  }

  // Logique métier
  // const resource = new Resource({ name, description });
  // await resource.save();

  // logger.info(`Resource created: ${resource.id}`);

  // sendSuccess(res, resource, 201, 'Resource created successfully');
});

/**
 * Mettre à jour une ressource
 */
const updateResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  // Logique métier
  // const resource = await Resource.findById(id);
  // if (!resource) {
  //   throw new NotFoundError('Resource not found');
  // }

  // if (name) resource.name = name;
  // if (description) resource.description = description;
  // await resource.save();

  // logger.info(`Resource ${id} updated`);

  // sendSuccess(res, resource, 200, 'Resource updated successfully');
});

/**
 * Supprimer une ressource
 */
const deleteResource = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Logique métier
  // const resource = await Resource.findByIdAndDelete(id);
  // if (!resource) {
  //   throw new NotFoundError('Resource not found');
  // }

  // logger.info(`Resource ${id} deleted`);

  // sendSuccess(res, null, 200, 'Resource deleted successfully');
});

module.exports = {
  getResource,
  getResources,
  createResource,
  updateResource,
  deleteResource,
};
