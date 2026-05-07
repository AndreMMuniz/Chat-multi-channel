export type ProposalStatus = "draft" | "sent" | "approved" | "rejected" | "archived" | "expired" | "cancelled";
export type ProposalType = "product" | "service";

export interface ProposalItemDto {
  id: string;
  proposal_id: string;
  catalog_item_id?: string | null;
  catalog_reference_code?: string | null;
  name_snapshot: string;
  commercial_name_snapshot: string;
  type_snapshot: string;
  sku_snapshot?: string | null;
  category_snapshot: string;
  commercial_description_snapshot: string;
  base_price_snapshot: number;
  unit_snapshot: string;
  sla_or_delivery_time_snapshot?: string | null;
  allows_discount_snapshot: boolean;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_amount: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalDto {
  id: string;
  reference: string;
  title: string;
  customer_name?: string | null;
  status: ProposalStatus;
  notes?: string | null;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  created_by_id: string;
  created_by_name?: string | null;
  items_count: number;
  // campos comerciais
  client_id?: string | null;
  owner_user_id?: string | null;
  proposal_type?: ProposalType | null;
  currency: string;
  payment_method?: string | null;
  payment_terms?: string | null;
  payment_installments?: number | null;
  delivery_deadline?: string | null;
  delivery_days?: number | null;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalServiceDetailsDto {
  id: string;
  proposal_id: string;
  service_name: string;
  scope_of_work?: string | null;
  methodology?: string | null;
  hourly_rate?: number | null;
  estimated_hours?: number | null;
  client_responsibilities: string[];
  delivery_responsibilities: string[];
  revision_rounds?: number | null;
  support_period_days?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalServiceDetailsRequest {
  service_name: string;
  scope_of_work?: string | null;
  methodology?: string | null;
  hourly_rate?: number | null;
  estimated_hours?: number | null;
  client_responsibilities: string[];
  delivery_responsibilities: string[];
  revision_rounds?: number | null;
  support_period_days?: number | null;
}

export interface ProposalDetailDto extends ProposalDto {
  items: ProposalItemDto[];
  service_details?: ProposalServiceDetailsDto | null;
}

export interface ProposalCreateRequest {
  title: string;
  customer_name?: string | null;
  notes?: string | null;
  status?: ProposalStatus;
  client_id?: string | null;
  owner_user_id?: string | null;
  proposal_type?: ProposalType | null;
  currency?: string;
  payment_method?: string | null;
  payment_terms?: string | null;
  payment_installments?: number | null;
  delivery_deadline?: string | null;
  delivery_days?: number | null;
  valid_until?: string | null;
}

export interface ProposalFromCatalogRequest {
  title?: string | null;
  customer_name?: string | null;
  notes?: string | null;
  quantity?: number;
}

export interface ProposalItemFromCatalogRequest {
  quantity?: number;
  discount_amount?: number;
}
