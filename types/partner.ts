export interface Partner {
  _id: string;
  name: string;
  shortName?: string;
  code: string;
  logo: string;
  website: string;
  apiUrl: string;
  motto?: string;
  country?: string;
  city?: string;
  initial?: string;
  primaryColor: string;
  secondaryColor: string;
  status: "active" | "inactive" | "pending" | "suspended";
  displayOrder: number;
  features: {
    onlinePayment: boolean;
    pushNotifications: boolean;
    courseRegistration: boolean;
    library: boolean;
  };
  supportEmail?: string;
  supportPhone?: string;
  qrCodeUrl?: string;
  partnerSince: string;
  lastHealthCheck?: string;
  isHealthy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerInput {
  name: string;
  shortName?: string;
  code: string;
  logo?: string;
  website?: string;
  apiUrl?: string;
  motto?: string;
  country?: string;
  city?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status?: Partner["status"];
  displayOrder?: number;
  features?: Partial<Partner["features"]>;
  supportEmail?: string;
  supportPhone?: string;
}
