export interface createServiceInput{
    service_name: string,
    service_description?: string,
    service_remarks?: string,
    service_duration: number,
    service_price: number,
    service_is_enabled: boolean,
    created_at: string,
    updated_at: string,
    service_category_id: number,
    service_sequence_no: number,
    created_by: number,
    updated_by: number 
}

export interface updateServiceInput{
    id: number,
    service_name?: string,
    service_description?: string,
    service_remarks?: string,
    service_duration?: number,
    service_price?: number,
    created_at?: string,
    updated_at: string,
    service_category_id?: number,
    service_sequence_no?: number | null,
    created_by?: number,
    updated_by: number 
}
