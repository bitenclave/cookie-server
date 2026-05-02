export type StoredCookie = {
  domain?: string;
  expirationDate?: number | null;
  hostOnly?: boolean;
  httpOnly?: boolean;
  name?: string;
  path?: string;
  sameSite?: string | null;
  secure?: boolean;
  session?: boolean;
  storeId?: string | null;
  value?: string;
  [key: string]: unknown;
};

export type ProfileInput = {
  cookies: StoredCookie[];
  group?: string;
  groupName?: string;
  id?: string;
  name: string;
  tags?: string[];
};

export type ProfileDto = {
  cookieCount: number;
  cookies: StoredCookie[];
  createdAt: string;
  domains: string[];
  group: string;
  groupName: string;
  id: string;
  name: string;
  tags: string[];
  updatedAt: string;
};

export type ProfileFilters = {
  domain?: string;
  group?: string;
  q?: string;
  sort?: 'count' | 'group' | 'name' | 'updated';
  tag?: string;
};

export type GroupSummary = {
  cookieCount: number;
  name: string;
  profileCount: number;
};
