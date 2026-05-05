export type ProposalStatus = "draft" | "sent" | "approved" | "rejected" | "archived";

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
  created_at: string;
  updated_at: string;
}

export interface ProposalDetailDto extends ProposalDto {
  items: ProposalItemDto[];
}

export interface ProposalCreateRequest {
  title: string;
  customer_name?: string | null;
  notes?: string | null;
  status?: ProposalStatus;
}

export interface ProposalFromCatalogRequest {
  title?: string | null;
  customer_name?: string | null;
  notes?: string | null;
  quantity?: number;
}
