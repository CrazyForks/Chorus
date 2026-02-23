// src/types/admin.ts
// Super Admin related type definitions

// Company list item
export interface CompanyListItem {
  uuid: string;
  name: string;
  emailDomains: string[];
  oidcEnabled: boolean;
  userCount: number;
  agentCount: number;
  createdAt: string;
}

// Company detail
export interface CompanyDetail extends CompanyListItem {
  oidcIssuer: string | null;
  oidcClientId: string | null;
  updatedAt: string;
}

// Company creation input
export interface CompanyCreateInput {
  name: string;
  emailDomains?: string[];
  oidcIssuer?: string;
  oidcClientId?: string;
}

// Company update input
export interface CompanyUpdateInput {
  name?: string;
  emailDomains?: string[];
  oidcIssuer?: string | null;
  oidcClientId?: string | null;
  oidcEnabled?: boolean;
}

// Email identification response
export interface IdentifyResponse {
  type: "super_admin" | "oidc" | "default_auth" | "not_found";
  company?: {
    uuid: string;
    name: string;
    oidcIssuer: string;
    oidcClientId: string;
  };
  message?: string;
}
