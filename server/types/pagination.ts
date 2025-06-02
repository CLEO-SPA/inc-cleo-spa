
export interface MembershipTypePaginationParameter {
    page?: number;
    limit?: number;
};

export interface Pagination {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
};