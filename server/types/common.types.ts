export interface PaginatedOptions {
  after?: string | null;
  before?: string | null;
  page?: number | null;
  searchTerm?: string | null;
}

export interface CursorPayload {
  createdAt: Date;
  id: number;
}

export interface PaginatedReturn<T> {
  data: T[];
  pageInfo: {
    startCursor?: string | null;
    endCursor?: string | null;
    hasNextPage?: boolean | null;
    hasPreviousPage?: boolean | null;
    totalCount?: number;
  };
}

export interface FieldMapping<T, N> {
  payloadKey: keyof T;
  dbKey: keyof N;
  transform?: (value: any) => any;
}
