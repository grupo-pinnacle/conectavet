export function parsePagination(query: { page?: string; limit?: string }, maxLimit = 50) {
  const page = Math.max(1, parseInt(query.page || '') || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit || '') || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function excludePassword<T extends Record<string, unknown>>(obj: T): Omit<T, 'password'> {
  const { password, ...rest } = obj;
  return rest as Omit<T, 'password'>;
}

export function asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
