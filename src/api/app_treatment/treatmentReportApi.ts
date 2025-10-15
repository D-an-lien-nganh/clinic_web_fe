import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessTokenFromCookie } from "@/utils/token";

/* ===================== Types ===================== */
export type TreatmentReportQuery = {
  search?: string;
  date?: string;        // lọc đúng 1 ngày (YYYY-MM-DD)
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  serviceType?: string; // "TLCB" | "TLDS"
};

export interface TreatmentReportRow {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  mobile: string;
  treatment_type?: string | null;
  total_sessions: number;
  done_sessions: number;
  remaining_sessions: number;
  status: string; // "Đã hoàn thành" | "Chưa hoàn thành"
}

/* ===================== API ===================== */
export const apiTreatmentReport = createApi({
  reducerPath: "TreatmentReportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-customer/v1/`,
    prepareHeaders: (headers) => {
      const token = getAccessTokenFromCookie();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["TreatmentReport"],
  endpoints: (builder) => ({
    getTreatmentReport: builder.query<TreatmentReportRow[], TreatmentReportQuery | void>({
      query: (params) => {
        const p: string[] = [];
        if (params?.search) p.push(`search=${encodeURIComponent(params.search)}`);
        if (params?.date) p.push(`date=${params.date}`);
        if (params?.startDate) p.push(`startDate=${params.startDate}`);
        if (params?.endDate) p.push(`endDate=${params.endDate}`);
        if (params?.serviceType) p.push(`serviceType=${params.serviceType}`);
        return `customer/treatment-report/${p.length ? `?${p.join("&")}` : ""}`;
      },
      providesTags: [{ type: "TreatmentReport" }],
    }),
  }),
});

export const { useGetTreatmentReportQuery } = apiTreatmentReport;
