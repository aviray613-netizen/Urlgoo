export interface Link {
  id: string;
  originalUrl: string;
  title: string;
  description?: string;
  createdAt: string;
  clicksCount: number;
}

export interface Click {
  id: string;
  linkId: string;
  timestamp: string; // ISO String (UTC)
  userAgent: string;
  referer: string;
  ip: string;
  channel?: string; // Track which channel (e.g., Facebook, Email, Twitter) the click came from
}

export interface Stats {
  totalLinks: number;
  totalClicks: number;
  clicksOverTime: { date: string; count: number }[];
  clicksByLink: { linkId: string; title: string; clicksCount: number }[];
  clicksByChannel: { channel: string; count: number }[];
}

