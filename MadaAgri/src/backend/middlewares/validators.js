const { body, param, query, validationResult } = require('express-validator');
const { VALIDATION, PAGINATION } = require('../constants');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(error => {
      formattedErrors[error.param] = error.msg;
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  next();
};

const authValidators = {
  signup: [
    body('email')
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail(),
    body('password')
      .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
      .withMessage(`Le mot de passe doit avoir au moins ${VALIDATION.PASSWORD_MIN_LENGTH} caractères`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Le mot de passe doit contenir majuscules, minuscules et chiffres'),
    body('displayName')
      .isLength({ min: VALIDATION.DISPLAY_NAME_MIN_LENGTH, max: VALIDATION.DISPLAY_NAME_MAX_LENGTH })
      .withMessage(`Le nom doit avoir entre ${VALIDATION.DISPLAY_NAME_MIN_LENGTH} et ${VALIDATION.DISPLAY_NAME_MAX_LENGTH} caractères`)
      .trim(),
    body('role')
      .optional()
      .isIn(['farmer', 'client'])
      .withMessage('Rôle invalide'),
  ],
  login: [
    body('email')
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Le mot de passe est requis'),
  ],
};

const postValidators = {
  create: [
    body('content')
      .notEmpty()
      .withMessage('Le contenu est requis')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Le contenu doit avoir entre 1 et 5000 caractères')
      .trim(),
    body('culture')
      .optional()
      .isString()
      .trim(),
    body('location')
      .optional()
      .isString()
      .trim(),
  ],
  update: [
    param('id')
      .isInt()
      .withMessage('ID invalide'),
    body('content')
      .optional()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Le contenu doit avoir entre 1 et 5000 caractères')
      .trim(),
  ],
};

const userValidators = {
  updateProfile: [
    body('displayName')
      .optional()
      .isLength({ min: VALIDATION.DISPLAY_NAME_MIN_LENGTH, max: VALIDATION.DISPLAY_NAME_MAX_LENGTH })
      .withMessage(`Le nom doit avoir entre ${VALIDATION.DISPLAY_NAME_MIN_LENGTH} et ${VALIDATION.DISPLAY_NAME_MAX_LENGTH} caractères`)
      .trim(),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('La bio doit avoir maximum 500 caractères')
      .trim(),
    body('location')
      .optional()
      .isString()
      .trim(),
    body('culture')
      .optional()
      .isString()
      .trim(),
  ],
};

const productValidators = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Le nom est requis')
      .isLength({ min: 2, max: 100 })
      .withMessage('Le nom doit avoir entre 2 et 100 caractères')
      .trim(),
    body('description')
      .notEmpty()
      .withMessage('La description est requise')
      .trim(),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Le prix doit être un nombre positif'),
    body('quantity')
      .isInt({ gt: 0 })
      .withMessage('La quantité doit être un entier positif'),
    body('culture')
      .notEmpty()
      .withMessage('La culture est requise')
      .trim(),
  ],
};

const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION.MAX_LIMIT })
    .withMessage(`La limite doit être entre 1 et ${PAGINATION.MAX_LIMIT}`)
    .toInt(),
];

module.exports = {
  handleValidationErrors,
  authValidators,
  postValidators,
  userValidators,
  productValidators,
  paginationValidators,
};
