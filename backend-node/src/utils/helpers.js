export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function paginate(array, page = 1, limit = 10) {
  const start = (page - 1) * limit;
  return {
    data: array.slice(start, start + limit),
    total: array.length,
    page,
    pages: Math.ceil(array.length / limit),
  };
}
