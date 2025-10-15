// src/api/app_treatment/apiPayment.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessTokenFromCookie } from "@/utils/token";

/* ===================== Types ===================== */
export type ARStatus = "open" | "partial" | "closed";
export type ARSourceType = "treatmentrequest" | "doctorprocess";

export interface ARItemDto {
  id: number;
  created: string;
  customer: number;
  description: string;
  amount_original: string;
  amount_paid: string;
  status: ARStatus;
  source_type: ARSourceType;
  source_id: number;
}

export interface PaymentHistoryDto {
  id: number;
  customer: number;
  ar_item: number;
  paid_amount: string;
  paid_method: "cash" | "transfer";
  note?: string;
  created: string;
  status?: string;
}

/* ---------- Reports DTOs ---------- */
export interface RevenueRowDto {
  customer_id: number;
  customer_name: string;
  mobile?: string;
  ar_item_id: number;
  invoice_type?: string;
  paid_method: string;
  paid_amount: string;
  created: string;
}
export interface RevenueListResp {
  results: RevenueRowDto[];
  summary: { total_revenue: string | number };
}
type GetRevenueParams = Partial<{
  startDate: string;
  endDate: string;
  customer_id: number;
  paid_method: string;
  searchTerm: string;
}>;

export interface ReceivableSummaryRow {
  customer_id: number;
  customer_name: string;
  customer_code: string;
  opening_debit: string | number;
  period_debit: string | number;
  period_credit: string | number;
  ending_debit: string | number;
}
export interface ReceivableSummaryResp {
  results: ReceivableSummaryRow[];
  summary: {
    opening_debit: string | number;
    period_debit: string | number;
    period_credit: string | number;
    ending_debit: string | number;
  };
}
type GetSummaryParams = {
  startDate: string;
  endDate: string;
  searchTerm?: string;
};

// 3) Chi tiết công nợ theo khách hàng
export interface ReceivableDetailEntry {
  date: string;
  description: string;
  debit: string | number;
  credit: string | number;
  balance_debit?: string | number;
  balance_credit?: string | number;
}
export interface ReceivableDetailResp {
  customer_id: number;
  entries: ReceivableDetailEntry[];
  summary: {
    // BE mới
    total_debit?: string | number;
    total_credit?: string | number;
    ending_debit: string | number;
    ending_credit?: string | number;
    // alias BE cũ (fallback)
    period_debit?: string | number;
    period_credit?: string | number;
  };
}
type GetDetailParams = {
  customer_id: number;
  startDate?: string;
  endDate?: string;
};

type GetARItemsParams = Partial<{
  customer_id: number;
  status: string;
  source_type: ARSourceType | string;
  page: number;
  page_size: number;
}>;

// 4) Doanh thu chưa thực hiện
export interface UnrealizedRevenueRow {
  customer_id: number;
  customer_code?: string;
  customer_name: string;
  mobile?: string;
  total_sessions: number; // tổng số buổi trong phác đồ
  used_sessions: number; // số buổi đã thực hiện
  usage_status: string; // ví dụ "5/10"
  total_package_price: string | number; // tổng tiền gói
  total_paid: string | number; // tổng đã thanh toán
  used_amount: string | number; // số tiền đã sử dụng
  unused_amount: string | number; // số tiền chưa sử dụng
}

export interface UnrealizedRevenueResp {
  results: UnrealizedRevenueRow[];
  summary: {
    total_package_price: string | number;
    total_paid: string | number;
    used_amount: string | number;
    unused_amount: string | number;
  };
}

type GetUnrealizedRevenueParams = Partial<{
  startDate: string;
  endDate: string;
  searchTerm: string;
}>;

/* ===================== API ===================== */
export const apiPayment = createApi({
  reducerPath: "PaymentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-treatment/v1/`,
    prepareHeaders: (headers) => {
      const token = getAccessTokenFromCookie();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ARItem", "PaymentHistory", "ARSummary", "Revenue"],
  endpoints: (builder) => ({
    getARItems: builder.query<
      { count?: number; results?: ARItemDto[] } | ARItemDto[],
      GetARItemsParams | undefined
    >({
      query: (params) => {
        const q = params ?? {};
        const p: string[] = [];
        if (q.customer_id) p.push(`customer_id=${q.customer_id}`);
        if (q.status) p.push(`status=${encodeURIComponent(q.status)}`);
        if (q.source_type) p.push(`source_type=${q.source_type}`);
        if (q.page) p.push(`page=${q.page}`);
        if ((q as any).page_size) p.push(`page_size=${(q as any).page_size}`);
        return `ar-items/${p.length ? `?${p.join("&")}` : ""}`;
      },
      providesTags: [{ type: "ARItem" }],
    }),

    getARItemsByCustomer: builder.query<ARItemDto[], { customer_id: number }>({
      query: ({ customer_id }) => `ar-items/by-customer/${customer_id}/`,
      providesTags: [{ type: "ARItem" }],
    }),

    createPaymentHistory: builder.mutation<
      PaymentHistoryDto,
      {
        ar_item: number;
        paid_amount: string | number;
        paid_method: "cash" | "transfer";
        note?: string;
      }
    >({
      query: (body) => ({
        url: `payment-history/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PaymentHistory" }, { type: "ARItem" }],
    }),

    getRevenue: builder.query<RevenueListResp, GetRevenueParams | undefined>({
      query: (params) => {
        const p: string[] = [];
        if (params?.startDate) p.push(`startDate=${params.startDate}`);
        if (params?.endDate) p.push(`endDate=${params.endDate}`);
        if (params?.customer_id) p.push(`customer_id=${params.customer_id}`);
        if (params?.paid_method) p.push(`paid_method=${params.paid_method}`);
        if (params?.searchTerm)
          p.push(`searchTerm=${encodeURIComponent(params.searchTerm)}`);
        return `revenue/${p.length ? `?${p.join("&")}` : ""}`;
      },
      providesTags: [{ type: "Revenue" }],
    }),

    getReceivablesSummary: builder.query<
      ReceivableSummaryResp,
      GetSummaryParams
    >({
      query: ({ startDate, endDate, searchTerm }) => {
        const p = [`startDate=${startDate}`, `endDate=${endDate}`];
        if (searchTerm) p.push(`searchTerm=${encodeURIComponent(searchTerm)}`);
        return `ar-summary/?${p.join("&")}`;
      },
      providesTags: [{ type: "ARSummary" }],
    }),

    // ✅ URL đúng theo BE: /ar-detail-by-customer/
    getReceivablesDetailByCustomer: builder.query<
      ReceivableDetailResp,
      GetDetailParams
    >({
      query: ({ customer_id, startDate, endDate }) => {
        const p = [`customer_id=${customer_id}`];
        if (startDate) p.push(`startDate=${startDate}`);
        if (endDate) p.push(`endDate=${endDate}`);
        return `ar-detail/?${p.join("&")}`;
      },
      providesTags: [{ type: "ARItem" }],
    }),

    // 4) Doanh thu chưa thực hiện
    getUnrealizedRevenue: builder.query<
      UnrealizedRevenueResp,
      GetUnrealizedRevenueParams | undefined
    >({
      query: (params) => {
        const p: string[] = [];
        if (params?.startDate) p.push(`startDate=${params.startDate}`);
        if (params?.endDate) p.push(`endDate=${params.endDate}`);
        if (params?.searchTerm)
          p.push(`searchTerm=${encodeURIComponent(params.searchTerm)}`);
        return `revenue-unrealized/${p.length ? `?${p.join("&")}` : ""}`;
      },
      providesTags: [{ type: "Revenue" }],
    }),
  }),
});

export const {
  useGetARItemsQuery,
  useGetARItemsByCustomerQuery,
  useCreatePaymentHistoryMutation,
  useGetRevenueQuery,
  useGetReceivablesSummaryQuery,
  useGetReceivablesDetailByCustomerQuery,
  useGetUnrealizedRevenueQuery,
} = apiPayment;
