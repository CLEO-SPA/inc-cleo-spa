export interface PaginatedOptions {
  after?: CursorPayload | null;
  before?: CursorPayload | null;
  page?: number | null;
  searchTerm?: string | null;
}

export interface CursorPayload {
  createdAt?: Date;
  id?: number;
}

export interface PaginatedReturn<T> {
  data: [T];
  pageInfo: {
    startCursor?: string | null;
    endCursor?: string | null;
    hasNextPage?: boolean | null;
    hasPreviousPage?: boolean | null;
    totalCount?: number;
  };
}
