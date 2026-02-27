export interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

export interface CustomDomain {
  _id: string | null;
  tenantId: string;
  domain: string;
  status: "pending_verification" | "active" | "failed";
  dnsRecords: DnsRecord[];
  source?: "managed" | "cloud_run";
  verifiedAt?: string;
  createdBy?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}
