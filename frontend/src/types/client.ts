export type ClientType = "individual" | "company";

export interface ClientDto {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  country: string;
  client_type: ClientType;
  tax_id?: string | null;
  tax_id_type?: string | null;
  currency: string;
  company_name?: string | null;
  website?: string | null;
  notes?: string | null;
  contact_id?: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ClientListDto {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
  country: string;
  client_type: ClientType;
  currency: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface ClientCreateRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  country?: string;
  client_type?: ClientType;
  tax_id?: string | null;
  tax_id_type?: string | null;
  currency?: string;
  company_name?: string | null;
  website?: string | null;
  notes?: string | null;
  contact_id?: string | null;
}

export type ClientUpdateRequest = Partial<ClientCreateRequest>;
