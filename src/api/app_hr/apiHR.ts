import { getAccessTokenFromCookie } from "@/utils/token";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ActorCustomerDetailDto, ActorLeadSourcePerformanceDto } from "./type";

export const apiHR = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-hr/v1/`,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = getAccessTokenFromCookie();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "hrApi",
  tagTypes: [
    "Employee",
    "Collaborators",
    "CollaboratorRevenue",
    "CollaboratorCustomer",
    "ActorLeadSourcePerformance", 
    "ActorCustomerDetail"
  ] as const,
  endpoints: (builder) => ({
    getCollaboratorsList: builder.query<any, void>({
      query: () => `get-collaborators-list/`,
      providesTags: [{ type: "Collaborators" }],
    }),

    getEmployeeList: builder.query<
      any,
      {
        page: number;
        pageSize: number;
        searchTerm?: string; // Thêm ? để làm cho nó optional
        startDate?: string; // Thêm tham số startDate, optional
        endDate?: string; // Thêm tham số endDate, optional
        format?: string;
        department?: string; // Thêm tham số format, optional
        type?: string;
      }
    >({
      query: ({
        page,
        pageSize,
        searchTerm,
        startDate,
        endDate,
        format,
        type,
      }) => {
        let queryString = `hr-management/?page=${page}&pageSize=${pageSize}`;

        // Thêm các tham số khác nếu chúng tồn tại
        if (searchTerm)
          queryString += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        if (startDate)
          queryString += `&startDate=${encodeURIComponent(startDate)}`;
        if (endDate) queryString += `&endDate=${encodeURIComponent(endDate)}`;
        if (format) queryString += `&format=${encodeURIComponent(format)}`;
        if (type) queryString += `&type=${encodeURIComponent(type)}`;

        return queryString;
      },
      providesTags: [{ type: "Employee" }],
    }),

    createEmployee: builder.mutation({
      query: (data) => ({
        url: "hr-management/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Employee" }],
    }),
    getEmployee: builder.query({
      query: (EmployeeId) => `/hr-management/${EmployeeId}/`,
      providesTags: (result, error, { EmployeeId }) => [
        { type: "Employee", id: EmployeeId },
      ],
    }),
    editEmployee: builder.mutation({
      query: ({ id, body }) => ({
        url: `hr-management/${id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Employee", id },
        { type: "Employee" },
      ],
    }),
    deleteEmployee: builder.mutation({
      query: (EmployeeId) => ({
        url: `hr-management/${EmployeeId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Employee", id }],
    }),

    // --- MỚI: Tổng hợp doanh thu theo CTV ---
    getCollaboratorRevenues: builder.query<
      Array<{
        id: number;
        username: string;
        full_name: string;
        invoices: number;
        total_revenue: number;
        referrals: number; // số lượt KH được CTV giới thiệu (distinct)
        referrals_paid?: number; // nếu BE có trả (optional)
      }>,
      { startDate?: string; endDate?: string; searchTerm?: string } | void
    >({
      query: (params) => {
        let qs = "collaborators/revenues/";
        if (params) {
          const q = new URLSearchParams();
          if (params.startDate) q.set("startDate", params.startDate);
          if (params.endDate) q.set("endDate", params.endDate);
          if (params.searchTerm) q.set("searchTerm", params.searchTerm);
          const s = q.toString();
          if (s) qs += `?${s}`;
        }
        return qs;
      },
      providesTags: [{ type: "CollaboratorRevenue" }],
    }),

    // --- MỚI: Chi tiết khách hàng theo 1 CTV ---
    getCollaboratorCustomers: builder.query<
      Array<{
        customer_id: number;
        name: string;
        mobile: string;
        total_invoices: number;
        total_revenue: number;
        details: Array<{
          created: string;
          invoice_type: string;
          revenue: number;
        }>;
      }>,
      {
        userId: number;
        startDate?: string;
        endDate?: string;
        searchTerm?: string;
      }
    >({
      query: ({ userId, startDate, endDate, searchTerm }) => {
        const q = new URLSearchParams();
        if (startDate) q.set("startDate", startDate);
        if (endDate) q.set("endDate", endDate);
        if (searchTerm) q.set("searchTerm", searchTerm);
        const s = q.toString();
        return `collaborators/${userId}/customers/${s ? `?${s}` : ""}`;
      },
      providesTags: (r, e, { userId }) => [
        { type: "CollaboratorCustomer", id: userId },
      ],
    }),

    // --- Mới: Tổng hợp doanh thu theo Actor từ mọi LeadSource ---
    getActorLeadSourcePerformance: builder.query<
      ActorLeadSourcePerformanceDto[],
      { startDate?: string; endDate?: string; searchTerm?: string }
    >({
      query: ({ startDate, endDate, searchTerm }) => {
        const q = new URLSearchParams();
        if (startDate) q.set("startDate", startDate);
        if (endDate) q.set("endDate", endDate);
        if (searchTerm) q.set("searchTerm", searchTerm);
        const s = q.toString();
        return `actor-leadsource-performance/${s ? `?${s}` : ""}`;
      },
      providesTags: [{ type: "ActorLeadSourcePerformance" }],
    }),

    getActorCustomerDetail: builder.query<ActorCustomerDetailDto[], { userId: number; startDate?: string; endDate?: string; searchTerm?: string }>({
      query: ({ userId, startDate, endDate, searchTerm }) => {
        const q = new URLSearchParams();
        if (startDate) q.set("startDate", startDate);
        if (endDate) q.set("endDate", endDate);
        if (searchTerm) q.set("searchTerm", searchTerm);
        const s = q.toString();
        return `collaborators/${userId}/customers/${s ? `?${s}` : ""}`;
      },
      providesTags: (r, e, { userId }) => [
        { type: "ActorCustomerDetail", id: userId },
      ],
    }),
  }),
});

export const {
  //Employee
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useEditEmployeeMutation,
  useGetEmployeeListQuery,
  useGetEmployeeQuery,
  //Collaborators
  useGetCollaboratorsListQuery,

  // NEW
  useGetCollaboratorRevenuesQuery,
  useGetCollaboratorCustomersQuery,

  useGetActorLeadSourcePerformanceQuery,
  useGetActorCustomerDetailQuery,
} = apiHR;
