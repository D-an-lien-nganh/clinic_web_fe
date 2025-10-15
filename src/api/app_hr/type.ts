export interface ActorLeadSourcePerformanceDto {
  actor_id: number;
  full_name: string;
  total_revenue: number;
  total_customers: number;
  lead_source: string;
}

export interface ActorCustomerDetailDto {
  customer_id: number;
  name: string;
  mobile: string;
  total_invoices: number;
  total_revenue: number;
  details: Array<{
    created: string;
    invoice_type: string;
    revenue: number;
  }>;
}