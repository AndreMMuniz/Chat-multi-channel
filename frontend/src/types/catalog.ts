export type CatalogItemType = "product" | "service";
export type CatalogItemStatus = "active" | "inactive" | "discontinued" | "under_review";

export interface CatalogItemDto {
  id: string;
  reference: string;
  name: string;
  commercial_name: string;
  type: CatalogItemType;
  status: CatalogItemStatus;
  category: string;
  sku?: string | null;
  commercial_description: string;
  internal_notes?: string | null;
  base_price: number;
  unit: string;
  sla_or_delivery_time?: string | null;
  usage_rules?: string | null;
  active_for_support: boolean;
  can_be_quoted: boolean;
  allows_discount: boolean;
  tags: string[];
  replaced_by_catalog_item_id?: string | null;
  created_by_id?: string | null;
  updated_by_id?: string | null;
  created_at: string;
  updated_at: string;
  price_updated_at: string;
}

export interface CatalogItemCreateRequest {
  name: string;
  commercial_name: string;
  type: CatalogItemType;
  status: CatalogItemStatus;
  category: string;
  sku?: string | null;
  commercial_description: string;
  internal_notes?: string | null;
  base_price: number;
  unit: string;
  sla_or_delivery_time?: string | null;
  usage_rules?: string | null;
  active_for_support: boolean;
  can_be_quoted: boolean;
  allows_discount: boolean;
  tags: string[];
  replaced_by_catalog_item_id?: string | null;
}

export type CatalogItemUpdateRequest = Partial<CatalogItemCreateRequest>;
