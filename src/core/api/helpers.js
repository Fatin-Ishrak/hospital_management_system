// Small helpers shared by all API files.
export const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};
// remove characters that would break a PostgREST filter string
export const clean = (s) => String(s ?? '').replace(/[,()*%\\]/g, ' ').trim();
export const span = (page, size) => [(page - 1) * size, page * size - 1];
export const paged = async (query, page, size) => {
  const { data, error, count } = await query.range(...span(page, size));
  if (error) throw error;
  return { rows: data ?? [], count: count ?? 0 };
};
