// Data set for the API contract of fetching the membership type list
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

// Blueprint of the properties that would be used in the membership type store
export type MembershipTypeState = {
    loading: boolean,
    success: boolean,
    error: boolean,
    errorMessage: string | null,

    membershipTypeList: MembershipType[],
    selectedMembershipTypeId: number,

    isCreating: boolean,
    isConfirming: boolean,
    isUpdating: boolean,
    isDeleting: boolean,
};

// Blueprint of the actions inside the membership type store
type MembershipTypeFunctions = {
    fetchAllMembershipType: () => Promise<void>;
    getMembershipTypeById: (id: number) => MembershipType | undefined;
    createMembershipType: (data: NewMembershipType) => Promise<{success: boolean, error?: string}>;
    updateMembershipType: (data: UpdatedMembershipType) => Promise<{success: boolean, error?: string}>;
    deleteMembershipType: (id: number) => Promise<{success: boolean, error?: string}>;
    setIsCreating: (value: boolean) => void;
    setIsUpdating: (value: boolean) => void;
    setIsConfirming: (value: boolean) => void;
    setSelectedMembershipTypeId: (value: number) => void;
    setIsDeleting: (value: boolean) => void;
    initialize: () => Promise<void>;
    reset: () => void;
}   

export type UseMembershipTypeStore = MembershipTypeState & MembershipTypeFunctions;

export interface ConfirmationPopUpProps {
    open: boolean;
    title?: string;
    body?: React.ReactNode | "-";
    onConfirm: () => void;
    onCancel: () => void;
};
