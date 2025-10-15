export interface Company {
  id: number;
  total_allowed_users: number;
  exceeds_user_limit: boolean;
  can_use_service: boolean;
  current_users_count: number;
  package_type_str: string;
  created: string;
  name: string;
  short_name: string;
  MST: string;
  logo: string;
  address: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  zip_code: string | null;
  fax: string | null;
  hotline: string | null;
  youtube_channel: string | null;
  facebook_page: string | null;
  tiktok: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  qr_code: string | null;
  deadline: string;
  additional_users: number;
  token: string;
  user: number;
  package_type: number;
  customer_type: string;
}

export interface Division {
  id: number;
  created: string;
  code: string;
  title: string;
  user: number;
}

export interface DetailFunction {
  id: number;
  created: string;
  code: string;
  title: string;
  link: string;
  user: number;
  category: number;
}

export interface UserProfile {
  branch: any;
  position: any;
  id: number;
  company: Company;
  division: Division;
  detail_function: DetailFunction[];
  created: string;
  user_type: null | string;
  gender: null | string;
  user_mobile_number: null | string;
  user_address: null | string;
  image: null | string;
  desc: null | string;
  is_admin: boolean;
  user: number;
}

export interface User {
  user: any;
  id: number;
  user_profile: UserProfile;
  password: string;
  last_login: string;
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  groups: any[]; // You may want to further specify the type of the items in this array
  user_permissions: any[]; // Same here
}

export interface UserState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}
