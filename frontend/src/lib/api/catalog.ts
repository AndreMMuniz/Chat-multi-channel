import { apiGet, apiGetList, apiMutate } from "@/lib/apiClient";
import type { CatalogItemCreateRequest, CatalogItemDto, CatalogItemUpdateRequest } from "@/types/catalog";

export async function listCatalogItems(params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGetList<CatalogItemDto>(`/admin/catalog-items${suffix}`);
}

export async function getCatalogItem(itemId: string): Promise<CatalogItemDto> {
  return apiGet<CatalogItemDto>(`/admin/catalog-items/${itemId}`);
}

export async function createCatalogItem(body: CatalogItemCreateRequest): Promise<CatalogItemDto> {
  return apiMutate<CatalogItemCreateRequest, CatalogItemDto>("/admin/catalog-items", "POST", body);
}

export async function updateCatalogItem(itemId: string, body: CatalogItemUpdateRequest): Promise<CatalogItemDto> {
  return apiMutate<CatalogItemUpdateRequest, CatalogItemDto>(`/admin/catalog-items/${itemId}`, "PATCH", body);
}

export async function duplicateCatalogItem(itemId: string): Promise<CatalogItemDto> {
  return apiMutate<undefined, CatalogItemDto>(`/admin/catalog-items/${itemId}/duplicate`, "POST");
}

export async function updateCatalogItemStatus(itemId: string, status: string): Promise<CatalogItemDto> {
  return apiMutate<{ status: string }, CatalogItemDto>(`/admin/catalog-items/${itemId}/status`, "PATCH", { status });
}
