const { NotFoundError, ValidationError } = require('../errors/ApiError');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { asyncHandler } = require('../middlewares/errorHandler');

const getResource = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validation additionnelle si nécessaire
  if (!id) {
    throw new ValidationError('ID is required', { id: 'Required' });
  }
});

const getResources = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
});

const createResource = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ValidationError('Missing required fields', {
      name: !name ? 'Required' : undefined,
      description: !description ? 'Required' : undefined,
    });
  }
});

const updateResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
});

const deleteResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
});

module.exports = {
  getResource,
  getResources,
  createResource,
  updateResource,
  deleteResource,
};
