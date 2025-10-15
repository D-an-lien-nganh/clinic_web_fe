import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessTokenFromCookie } from "@/utils/token";

type CustomerStatusQuery = {
  main_status: number; // BẮT BUỘC
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  source?: number; // id nguồn
  startDate?: string; // ISO: 2025-09-15T00:00:00.000Z
  endDate?: string; // ISO
};

export const apiMarketing = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-customer/v1`,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = getAccessTokenFromCookie();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "MarketingApi",
  tagTypes: [
    "Marketing",
    "Comment",
    "CustomerRequest",
    "LeadStatus",
    "CustomerCare",
    "FeedBack",
    "CustomerProblem",
    "LeadSourceActor",
  ],
  endpoints: (builder) => ({
    getMarketingList: builder.query<
      any,
      {
        page?: number;
        pageSize?: number;
        searchTerm?: string;
      }
    >({
      query: ({ page = 1, pageSize = 10, searchTerm }) => {
        let queryString = `customer/?page=${page}&pageSize=${pageSize}`;
        if (searchTerm)
          queryString += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        return queryString;
      },
      providesTags: [{ type: "Marketing" }],
    }),
    getCustomerList: builder.query<any, void>({
      query: () => `customer/`,
      providesTags: [{ type: "Marketing" }],
    }),
    getMarketing: builder.query({
      query: (marketingId) => `/customer/${marketingId}`,
      providesTags: (result, error, marketingId) => [
        { type: "Marketing", id: marketingId },
      ],
    }),
    getCustomerListByStatus: builder.query<any, CustomerStatusQuery>({
      query: (args) => {
        const {
          main_status,
          page,
          pageSize,
          searchTerm,
          source,
          startDate,
          endDate,
        } = args || {};

        const fmt = (d?: string) =>
          d && /^\d{4}-\d{2}-\d{2}$/.test(d)
            ? d
            : d
            ? new Date(d).toISOString().split("T")[0]
            : undefined;

        // 🚫 Đừng set bừa "undefined" → BE sẽ filter main_status="undefined"
        const params: Record<string, any> = {};
        if (main_status !== undefined && main_status !== null)
          params["main-status"] = String(main_status);
        if (page) params.page = String(page);
        if (pageSize) params.pageSize = String(pageSize);
        if (searchTerm) params.searchTerm = searchTerm;
        if (typeof source === "number") params.source = String(source);
        if (startDate) params.startDate = fmt(startDate);
        if (endDate) params.endDate = fmt(endDate);

        return {
          url: "customer/", // ✅ có dấu /
          params, // ✅ để baseQuery stringify
        };
      },
      providesTags: () => [{ type: "Marketing" }],
    }),
    createMarketing: builder.mutation({
      query: (data) => ({
        url: "customer/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Marketing" }],
    }),
    editMarketing: builder.mutation({
      query: (body) => ({
        url: `customer/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Marketing", id },
        { type: "Marketing" },
      ],
    }),
    deleteMarketing: builder.mutation({
      query: ({ id }) => {
        return {
          url: `/customer/${id}/`,
          method: "DELETE",
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Marketing", id }],
    }),
    getCustomerRequest: builder.query<any, void>({
      query: () => `customer-requests`,
      providesTags: ["CustomerRequest"],
    }),
    getLeadStatusList: builder.query<any, void>({
      query: () => `lead-status/`,
      providesTags: ["LeadStatus"],
    }),
    getCustomerCareList: builder.query<any, void>({
      query: () => `customer-care/`,
      providesTags: ["CustomerCare"],
    }),
    getCustomerCare: builder.query({
      query: (customerCareId) => `/customer-care/${customerCareId}`,
      providesTags: (result, error, { customerCareId }) => [
        { type: "CustomerCare", id: customerCareId },
      ],
    }),
    createCustomerCare: builder.mutation({
      query: (body) => ({
        url: "customer-care/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "CustomerCare" }],
    }),
    editCustomerCare: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `customer-care/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "CustomerCare", id },
        { type: "CustomerCare" },
      ],
    }),
    deleteCustomerCare: builder.mutation({
      query: ({ customerCareId }) => ({
        url: `customer-care/${customerCareId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "CustomerCare", id },
      ],
    }),
    getCustomerCareByCustomer: builder.query<any[], number | string>({
      query: (customerId) => `customer-care/?customerId=${customerId}`,
      transformResponse: (response: any) =>
        Array.isArray(response) ? response : response?.results ?? [],
      providesTags: (result, error, customerId) => [
        { type: "CustomerCare", id: customerId },
      ],
    }),
    getFeedBackList: builder.query<any, void>({
      query: () => `feedback/`,
      providesTags: ["FeedBack"],
    }),
    getFeedBack: builder.query({
      query: (feedBackId) => `/feedback/${feedBackId}`,
      providesTags: (result, error, { feedBackId }) => [
        { type: "FeedBack", id: feedBackId },
      ],
    }),
    createFeedBack: builder.mutation({
      query: (body) => ({
        url: "feedback/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "FeedBack" }],
    }),
    deleteFeedBack: builder.mutation({
      query: ({ feedBackId }) => ({
        url: `feedback/${feedBackId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "FeedBack", id }],
    }),

    // ===== Customer Problems (đã cập nhật URL & payload) =====
    getCustomerProblems: builder.query<
      any[],
      { customerId: number | string; page?: number; pageSize?: number }
    >({
      query: ({ customerId, page = 1, pageSize = 10 }) =>
        `customer-problems/?customer=${customerId}&page=${page}&page_size=${pageSize}`,
      transformResponse: (res: any) =>
        Array.isArray(res) ? res : res?.results ?? [],
      providesTags: (result, error, { customerId }) => [
        { type: "CustomerProblem", id: customerId },
      ],
    }),

    getCustomerProblem: builder.query<any, number | string>({
      query: (id) => `customer-problems/${id}/`,
      providesTags: (result, error, id) => [{ type: "CustomerProblem", id }],
    }),

    createCustomerProblem: builder.mutation<
      any,
      {
        customer: number | string;
        problem: string;
        encounter_pain: string;
        desire: string;
      }
    >({
      query: (body) => ({
        url: "customer-problems/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "CustomerProblem" }],
    }),

    editCustomerProblem: builder.mutation<
      any,
      {
        id: number | string;
        problem?: string;
        encounter_pain?: string;
        desire?: string;
        // customer sẽ bị BE chặn đổi — không gửi nếu không cần
      }
    >({
      query: ({ id, ...body }) => ({
        url: `customer-problems/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "CustomerProblem", id },
        { type: "CustomerProblem" },
      ],
    }),

    deleteCustomerProblem: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `customer-problems/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "CustomerProblem", id }],
    }),

    // 📄 List actors (lọc theo source, q; phân trang)
    getLeadSourceActors: builder.query<
      any[],
      {
        source?: number | string;
        q?: string;
        page?: number;
        pageSize?: number;
      } | void
    >({
      query: (args) => {
        const page = args?.page ?? 1;
        const pageSize = args?.pageSize ?? 10;
        let qs = `lead-source-actors/?page=${page}&pageSize=${pageSize}`;
        if (args?.source) qs += `&source=${args.source}`;
        if (args?.q) qs += `&q=${encodeURIComponent(args.q)}`;
        return qs;
      },
      transformResponse: (res: any) =>
        Array.isArray(res) ? res : res?.results ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((x: any) => ({
                type: "LeadSourceActor" as const,
                id: x.id,
              })),
              { type: "LeadSourceActor" as const, id: "LIST" },
            ]
          : [{ type: "LeadSourceActor" as const, id: "LIST" }],
    }),

    // ➕ Tạo actor mới (báo lỗi nếu trùng name trong cùng source)
    createLeadSourceActor: builder.mutation<
      any,
      {
        source: number;
        name: string;
        code?: string;
        external_id?: string;
        hr_profile?: number;
        note?: string;
      }
    >({
      query: (body) => ({
        url: `lead-source-actors/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "LeadSourceActor", id: "LIST" }],
    }),

    // ✏️ Sửa actor
    updateLeadSourceActor: builder.mutation<
      any,
      {
        id: number | string;
        patch: Partial<{
          source: number;
          name: string;
          code: string;
          external_id: string;
          hr_profile: number;
          note: string;
        }>;
      }
    >({
      query: ({ id, patch }) => ({
        url: `lead-source-actors/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "LeadSourceActor", id },
        { type: "LeadSourceActor", id: "LIST" },
      ],
    }),

    // 🗑️ Xoá actor
    deleteLeadSourceActor: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `lead-source-actors/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (r, e, id) => [
        { type: "LeadSourceActor", id },
        { type: "LeadSourceActor", id: "LIST" },
      ],
    }),

    // TOP referrers (mặc định min = 5)
    getReferralLeaders: builder.query<
      Array<{
        id: number;
        name: string;
        mobile: string | null;
        email: string | null;
        gender: string | null;
        address: string | null;
        code: string;
        referral_count: number;
      }>,
      { min?: number } | void
    >({
      query: (args) => {
        const min = args?.min ?? 5;
        return { url: "customer/referral-leaders/", params: { min } };
      },
    }),

    // Danh sách khách được {id} giới thiệu
    getReferredCustomers: builder.query<
      Array<{
        id: number;
        name: string;
        gender: string | null;
        mobile: string | null;
        created: string;
      }>,
      number
    >({
      query: (customerId) => `customer/${customerId}/referred-customers/`,
    }),
  }),
});

export const {
  useGetMarketingListQuery,
  useGetCustomerListQuery,
  useGetCustomerListByStatusQuery,
  useLazyGetCustomerListByStatusQuery,
  useGetMarketingQuery,
  useCreateMarketingMutation,
  useEditMarketingMutation,
  useDeleteMarketingMutation,
  useGetCustomerRequestQuery,
  useGetLeadStatusListQuery,
  useGetCustomerCareListQuery,
  useGetCustomerCareQuery,
  useCreateCustomerCareMutation,
  useEditCustomerCareMutation,
  useDeleteCustomerCareMutation,
  useGetCustomerCareByCustomerQuery,
  useGetFeedBackListQuery,
  useGetFeedBackQuery,
  useCreateFeedBackMutation,
  useDeleteFeedBackMutation,
  // Vấn đề của khách hàng
  useGetCustomerProblemsQuery,
  useGetCustomerProblemQuery,
  useCreateCustomerProblemMutation,
  useEditCustomerProblemMutation,
  useDeleteCustomerProblemMutation,

  useCreateLeadSourceActorMutation,
  useDeleteLeadSourceActorMutation,
  useGetLeadSourceActorsQuery,
  useUpdateLeadSourceActorMutation,

  useGetReferralLeadersQuery,
  useGetReferredCustomersQuery,
} = apiMarketing;
