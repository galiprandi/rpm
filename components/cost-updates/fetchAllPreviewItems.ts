/**
 * The preview API caps pageSize at 100 but a filtered product set can be
 * larger. This helper requests every page sequentially and merges items so
 * the preview table shows (and can exclude across) the full filtered set.
 */

export async function fetchAllPreviewItems<
  R extends { items: { id: string }[]; totalItems: number },
>(
  request: (body: { page: number; pageSize: number }) => Promise<R>,
  opts: { pageSize: number; maxPages?: number },
): Promise<R> {
  const { pageSize, maxPages = 10 } = opts;

  const first = await request({ page: 1, pageSize });

  if (first.items.length < pageSize) {
    return first;
  }

  const items = [...first.items];
  const totalPages = Math.min(
    Math.ceil(first.totalItems / pageSize),
    maxPages,
  );

  for (let page = 2; page <= totalPages; page++) {
    const next = await request({ page, pageSize });
    items.push(...next.items);
    if (next.items.length < pageSize) break;
  }

  return { ...first, items };
}
