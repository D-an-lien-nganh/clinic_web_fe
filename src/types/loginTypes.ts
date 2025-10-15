
// apiTypes.ts
export interface LoginRequest {
  username?: string;
  password?: string;
  provider?: string;
  uid?: string;  
  token?: string;    
  extra_data?: {
    email?: string;  
    [key: string]: any;
  };
}

interface Company {
  id: number;
  created: string;
  name: string;
  short_name: string;
  MST: string;
  logo: string;
  user: number;
}

interface Division {
  id: number;
  created: string;
  code: string;
  title: string;
  user: number;
}

interface UserProfile {
  language: any;
  id: number;
  company: Company;
  division: Division;
  detail_function: any[];
  created: string;
  user_type: string;
  gender: string;
  user_mobile_number: null | string;
  user_address: null | string;
  image: null | string;
  desc: null | string;
  is_admin: boolean;
  user: number;
  branch: null | object; // Define the structure of "branch" if possible
}

export interface LoginResponse {
  user: {
    id: number;
    user_profile: UserProfile;
    date_joined: string;
    password: string;
    last_login: string;
    is_superuser: boolean;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_staff: boolean;
    is_active: boolean;
    groups: any[];
    user_permissions: any[];
  };
  access_token: string;
  refresh_token: string;
  error?: any;
}

export interface DetailFunction {
  en_title: string;
  subTitle: string;
  mobile_screen: string;
  id: number;
  created: string;
  code: string;
  title: string;
  link: string;
  user: number;
  category: number;
}

export interface AvailableFunctionsResponse {
  is_admin: boolean;
  categories: Category[];
}

interface Category {
  en_title: string;
  mobile_screen: string;
  title: string;
  detail_function_list: DetailFunction[];
}

export interface DetailFunction {
  title: string;
  link: string;
}
