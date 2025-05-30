
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

export type DataExportState = {
    loading: boolean;
    success: boolean;
    error: boolean;
    errorMessage: string | null;
    dataExportList: DataToExportList<any> | null;
    columns: string[];
    selectedTable: string | null;
    isSelectingUnusedMemberVoucher: boolean;
    isSelectingUnusedMemberCarePackage: boolean;
    exportFormat: string | null;
    timeInput: number | null;
}

type DataExportFunctions = {
    fetchMemberDetails: () => Promise<void>;
    fetchMinimumTimeSinceUsedOfMemberVoucher: (time: number) => Promise<void>;
    fetchMinimumTimeSinceUsedOfMemberCarePackage: (time: number) => Promise<void>;
    getDataToExport: () => Promise<void>;
    setSelectedTable: (value: string) => void;
    setTimeInput: (value: number) => void;
    setExportFormat: (value: string) => void;
    setErrorMessage: (value: string) => void;
    setLoading: (value: boolean) => void;
    setColumns: (value: string[]) => void;
    reset: () => void;
}

export type UseDataExportStore = DataExportState & DataExportFunctions;