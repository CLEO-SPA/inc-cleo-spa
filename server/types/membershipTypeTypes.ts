import { Pagination } from "./pagination.js";
import { pool, getProdPool as prodPool } from '../config/database.js';
import pg from "pg";

export interface MembershipType {
    id: number;
    membership_type_name: string;
    default_percentage_discount_for_products: number;
    default_percentage_discount_for_services: number;
    created_at: Date;
    updated_at: Date;
    created_by: number;
    last_updated_by: number;
    status: string;
};

// Data set for a new Membership Type
export type NewMembershipType = Pick<
    MembershipType,
    'membership_type_name' |
    'default_percentage_discount_for_products' |
    'default_percentage_discount_for_services' |
    'created_by'
>;

// Data set for an updated Membership Type
export type UpdatedMembershipType = Omit<
    MembershipType,
    'created_at' |
    'updated_at' |
    'status'
>;

export interface MembershipTypeData {
    membershipTypeList: MembershipType[] | null,
    pagination: Pagination
}

// generalised function for simple statements that changes the database
export async function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};