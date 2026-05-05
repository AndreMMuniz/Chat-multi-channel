import { apiGet, apiGetList, apiMutate } from "@/lib/apiClient";
import type { ProposalCreateRequest, ProposalDetailDto, ProposalDto, ProposalFromCatalogRequest } from "@/types/proposal";

export async function listProposals(params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiGetList<ProposalDto>(`/admin/proposals${suffix}`);
}

export async function getProposal(proposalId: string): Promise<ProposalDetailDto> {
  return apiGet<ProposalDetailDto>(`/admin/proposals/${proposalId}`);
}

export async function createProposal(body: ProposalCreateRequest): Promise<ProposalDto> {
  return apiMutate<ProposalCreateRequest, ProposalDto>("/admin/proposals", "POST", body);
}

export async function createProposalFromCatalog(
  catalogItemId: string,
  body: ProposalFromCatalogRequest,
): Promise<ProposalDetailDto> {
  return apiMutate<ProposalFromCatalogRequest, ProposalDetailDto>(
    `/admin/proposals/from-catalog/${catalogItemId}`,
    "POST",
    body,
  );
}
