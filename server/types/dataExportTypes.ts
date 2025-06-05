import { pool, getProdPool as prodPool } from '../config/database.js';
import pg from "pg";

export interface DataToExportList<L> {
    dataToExportList: L[]
};

export interface UnusedMemberVoucherData {
    member_name: string;
    contact: string;
    email: string;
    member_voucher_name: string;
    days_since_use: number;
    created_at: Date;
};

export interface UnusedMemberCarePackageData {
    member_name: string;
    contact: string;
    email: string;
    member_care_package_name: string;
    days_since_use: number;
    created_at: Date;
};

export interface MemberDetailsData {
    member_id: number;
    name: string;
    email: string;
    contact: string;
    dob: Date;
    sex: string;
    remarks: string;
    address: string;
    nric: string;
};
