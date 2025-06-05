import { time } from 'console';
import { pool, getProdPool as prodPool } from '../config/database.js';
import {
    DataToExportList,
    MemberDetailsData,
    UnusedMemberCarePackageData,
    UnusedMemberVoucherData
} from '../types/dataExportTypes.js';

const getMemberDetails = async (): Promise<{ success: boolean, data?: DataToExportList<MemberDetailsData>, message: string }> => {

    const client = await pool().connect();
    try {
        const query = `
        SELECT id as member_id, name, email, contact, dob, sex, remarks, address, nric
        FROM members
        ORDER BY id;
    `;

        const result = await client.query(query);
        const data = {
            dataToExportList: result.rows
        };

        if (result.rows.length > 0) {
            return { success: true, data: data, message: "Member Details retrieve successfully." }
        } else {
            return { success: false, data: { dataToExportList: [] }, message: "There are no Member Details records." }
        }
    } catch (error) {
        console.error('Error fetching member details:', error);
        throw new Error('Failed to fetch member details');
    } finally {
        client.release();
    }
};

const getUnusedMemberVoucher = async (timeInput: number): Promise<{ success: boolean, data?: DataToExportList<UnusedMemberVoucherData>, message: string }> => {

    const client = await pool().connect();
    try {
        const query = `
        SELECT 
            m.name as member_name, 
            m.contact, 
            m.email, 
            mv.member_voucher_name, 
            EXTRACT(DAY FROM (CURRENT_DATE - mv.created_at)) as days_since_use,
            mv.created_at
        FROM members m
        JOIN member_vouchers mv ON m.id = mv.member_id
        WHERE EXTRACT(DAY FROM (CURRENT_DATE - mv.created_at)) >= $1
        ORDER BY mv.created_at;
        `;

        const result = await client.query(query, [timeInput]);
        const data = {
            dataToExportList: result.rows
        };

        if (result.rows.length > 0) {
            return { success: true, data: data, message: "Unused Member Voucher retrieve successfully." }
        } else {
            return { success: false, data: { dataToExportList: [] }, message: "There are no Unused Member Voucher records." }
        }
    } catch (error) {
        console.error('Error fetching unused member voucher:', error);
        throw new Error('Failed to fetch unused member voucher');
    } finally {
        client.release();
    }
};

const getUnusedMemberCarePackage = async (timeInput: number): Promise<{ success: boolean, data?: DataToExportList<UnusedMemberCarePackageData>, message: string }> => {

    const client = await pool().connect();
    try {
        const query = `
        SELECT 
            m.name as member_name, 
            m.contact, 
            m.email, 
            mcp.package_name as member_care_package_name, 
            EXTRACT(DAY FROM (CURRENT_DATE - mcp.created_at)) as days_since_use,
            mcp.created_at
        FROM members m
        JOIN member_care_packages mcp ON m.id = mcp.member_id
        WHERE EXTRACT(DAY FROM (CURRENT_DATE - mcp.created_at)) >= $1
        ORDER BY mcp.created_at;
    `;

        const result = await client.query(query, [timeInput]);
        const data = {
            dataToExportList: result.rows
        };

        if (result.rows.length > 0) {
            return { success: true, data: data, message: "Unused Member Care Package retrieve successfully." }
        } else {
            return { success: false, data: { dataToExportList: [] }, message: "There are no Unused Member Care Package records." }
        }
    } catch (error) {
        console.error('Error fetching unused member care package:', error);
        throw new Error('Failed to fetch unused member care package');
    } finally {
        client.release();
    }
};

export default {
    getMemberDetails,
    getUnusedMemberVoucher,
    getUnusedMemberCarePackage
};