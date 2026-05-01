const { PAGINATION } = require('../constants');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const createPaginationMeta = (page, limit, total) => {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
};

module.exports = {
  parsePagination,
  createPaginationMeta,
};
