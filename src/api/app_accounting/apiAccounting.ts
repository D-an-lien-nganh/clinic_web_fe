import { getAccessTokenFromCookie } from "@/utils/token";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiAccounting = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-accounting/v1/`,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = getAccessTokenFromCookie();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "accountingApi",
  tagTypes: ["Accounting", "JournalEntry", "SupplierDebt", "Bills"], // Thêm "Bills" vào tagTypes
  endpoints: (builder) => ({
    // Account endpoints
    getAccountList: builder.query<any, void>({
      query: () => `account/`,
      providesTags: [{ type: "Accounting" }],
    }),
    createAccount: builder.mutation({
      query: (account) => ({
        url: "account/",
        method: "POST",
        body: account,
      }),
      invalidatesTags: [{ type: "Accounting" }],
    }),
    createMultiAccount: builder.mutation({
      query: (account) => ({
        url: "account/create-multiple-accounts/",
        method: "POST",
        body: account,
      }),
      invalidatesTags: [{ type: "Accounting" }],
    }),
    getAccount: builder.query({
      query: (accId) => `account/${accId}`,
    }),
    editAccount: builder.mutation({
      query: ({ id, account }) => ({
        url: `account/${id}/`,
        method: "PATCH",
        body: account,
      }),
      invalidatesTags: [{ type: "Accounting" }],
    }),
    deleteAccount: builder.mutation({
      query: (accId) => ({
        url: `account/${accId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Accounting" }],
    }),

    // Journal Entry endpoints
    getJournalEntryList: builder.query<any, void>({
      query: () => `journal-entry/`,
      providesTags: [{ type: "JournalEntry" }],
    }),
    createJournalEntry: builder.mutation({
      query: (account) => ({
        url: "journal-entry/",
        method: "POST",
        body: account,
      }),
      invalidatesTags: [{ type: "JournalEntry" }],
    }),
    createMultiJournalEntry: builder.mutation({
      query: (entries) => ({
        url: "journal-entry/create-multiple-entries/",
        method: "POST",
        body: entries,
      }),
      invalidatesTags: [{ type: "JournalEntry" }],
    }),
    getJournalEntry: builder.query({
      query: (id) => `journal-entry/${id}`,
    }),
    editJournalEntry: builder.mutation({
      query: ({ id, data }) => ({
        url: `journal-entry/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "JournalEntry" }],
    }),
    deleteJournalEntry: builder.mutation({
      query: (id) => ({
        url: `journal-entry/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "JournalEntry" }],
    }),

    // Supplier Debt endpoints
    getSupplierDebtList: builder.query<any, void>({
      query: () => `supplier-debt/`,
      providesTags: [{ type: "SupplierDebt" }],
    }),

    //debt payment
    getSupplierDebtPaymentList: builder.query<
      any,
      { supplier_id?: number; stock_in_id?: number }
    >({
      query: ({ supplier_id, stock_in_id }) => {
        let queryString = `supplier-debt-payment/?`;
        if (supplier_id) queryString += `&supplier_id=${supplier_id}`;
        if (stock_in_id) queryString += `&stock_in_id=${stock_in_id}`;
        return queryString;
      },
      providesTags: [{ type: "SupplierDebt" }],
    }),

    getSupplierDebtPaymentById: builder.query({
      query: (id) => `supplier-debt-payment/${id}`,
    }),
    createSupplierDebtPayment: builder.mutation({
      query: (account) => ({
        url: "supplier-debt-payment/",
        method: "POST",
        body: account,
      }),
      invalidatesTags: [{ type: "SupplierDebt" }],
    }),
    editSupplierDebtPayment: builder.mutation({
      query: ({ id, data }) => ({
        url: `supplier-debt-payment/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "SupplierDebt" }],
    }),
    deleteSupplierDebtPayment: builder.mutation({
      query: (id) => ({
        url: `supplier-debt-payment/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "SupplierDebt" }],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateAccountMutation,
  useCreateMultiJournalEntryMutation,
  useCreateMultiAccountMutation,
  useEditAccountMutation,
  useDeleteAccountMutation,
  useGetAccountQuery,
  useGetAccountListQuery,

  useCreateJournalEntryMutation,
  useDeleteJournalEntryMutation,
  useEditJournalEntryMutation,
  useGetJournalEntryListQuery,
  useGetJournalEntryQuery,

  useGetSupplierDebtListQuery,
  useGetSupplierDebtPaymentListQuery,
  useGetSupplierDebtPaymentByIdQuery,
  useCreateSupplierDebtPaymentMutation,
  useDeleteSupplierDebtPaymentMutation,
  useEditSupplierDebtPaymentMutation,

} = apiAccounting;