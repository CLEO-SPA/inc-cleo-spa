export interface createProductInput{
    product_name: string,
    product_description?: string,
    product_remarks?: string,
    product_unit_sale_price: number,
    product_unit_cost_price: number,
    product_is_enabled: boolean,
    created_at: string,
    updated_at: string,
    product_category_id: number,
    product_sequence_no: number,
    created_by: number,
    updated_by: number 
}

export interface updateProductInput{
    id: number,
    product_name?: string,
    product_description?: string,
    product_remarks?: string,
    product_unit_sale_price?: number,
    product_unit_cost_price?: number,
    created_at?: string,
    updated_at: string,
    product_category_id?: number,
    product_sequence_no?: number | null,
    created_by?: number,
    updated_by: number 
}