import { getAccessTokenFromCookie } from "@/utils/token";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiCost = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/`,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = getAccessTokenFromCookie();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "costApi",
  tagTypes: ["CostCategory", "SubCostCategory", "TaxRate", "Cost", "TaxType"],
  endpoints: (builder) => ({
    getCostCategoryList: builder.query<any, void>({
      query: () => `cost-category/`,
      providesTags: [{ type: "CostCategory" }],
      //   providesTags: (result) => (result ? result.map(({ id }: { id: string }) => ({ type: "Account", id })) : []),
    }),
    createCostCategory: builder.mutation({
      query: (data) => ({
        url: "cost-category/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "CostCategory" }]),
    }),
    getCostCategory: builder.query({
      query: ({ costCategoryId }) => `cost-category/${costCategoryId}/`,
      providesTags: (result, error, { costCategoryId }) => [{ type: "CostCategory", id: costCategoryId }],
    }),
    editCostCategory: builder.mutation({
      query: (body) => ({
        url: `cost-category/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) =>
        error ? [] : [{ type: "CostCategory", id }, { type: "CostCategory" }],
    }),
    deleteCostCategory: builder.mutation({
      query: ({ costCategoryId }) => ({
        url: `cost-category/${costCategoryId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "CostCategory" }]),
    }),
    getSubCostCategoryList: builder.query<any, void>({
      query: () => `sub-cost-category/`,
      providesTags: [{ type: "SubCostCategory" }],
      //   providesTags: (result) => (result ? result.map(({ id }: { id: string }) => ({ type: "Account", id })) : []),
    }),
    createSubCostCategory: builder.mutation({
      query: (data) => ({
        url: "sub-cost-category/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "SubCostCategory" }]),
    }),
    getSubCostCategory: builder.query({
      query: ({ subCostCategoryId }) => `sub-cost-category/${subCostCategoryId}/`,
      providesTags: (result, error, { subCostCategoryId }) => [{ type: "SubCostCategory", id: subCostCategoryId }],
    }),
    editSubCostCategory: builder.mutation({
      query: (body) => ({
        url: `sub-cost-category/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) =>
        error ? [] : [{ type: "SubCostCategory", id }, { type: "SubCostCategory" }],
    }),
    deleteSubCostCategory: builder.mutation({
      query: ({ subCostCategoryId }) => ({
        url: `sub-cost-category/${subCostCategoryId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "SubCostCategory" }]),
    }),
    getTaxRateList: builder.query<any, void>({
      query: () => `tax-rate/`,
      providesTags: [{ type: "TaxRate" }],
      //   providesTags: (result) => (result ? result.map(({ id }: { id: string }) => ({ type: "Account", id })) : []),
    }),
    createTaxRate: builder.mutation({
      query: (data) => ({
        url: "tax-rate/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "TaxRate" }]),
    }),
    getTaxRate: builder.query({
      query: ({ taxRateId }) => `tax-rate/${taxRateId}/`,
      providesTags: (result, error, { taxRateId }) => [{ type: "TaxRate", id: taxRateId }],
    }),
    editTaxRate: builder.mutation({
      query: (body) => ({
        url: `tax-rate/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "TaxRate", id }, { type: "TaxRate" }]),
    }),
    deleteTaxRate: builder.mutation({
      query: ({ taxRateId }) => ({
        url: `tax-rate/${taxRateId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "TaxRate" }],
    }),
    getCostList: builder.query<
      any,
      {
        page?: number;
        pageSize?: number;
        startDate?: string;
        endDate?: string;
        category?: number[];
        account_choice?: number[];
        subcategory?: number[];
        searchTerm?: string;
      }
    >({
      query: ({ page = 1, pageSize = 10, startDate, endDate, searchTerm, subcategory, account_choice, category }) => {
        let queryString = `cost/?page=${page}&pageSize=${pageSize}`;
        if (startDate) queryString += `&startDate=${startDate}`;
        if (endDate) queryString += `&endDate=${endDate}`;
        if (subcategory) queryString += `&subcategory=${subcategory.toString()}`;
        if (account_choice) queryString += `&account_choice=${account_choice.toString()}`;
        if (category) queryString += `&category=${category.toString()}`;
        if (searchTerm) queryString += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        return queryString;
      },
      providesTags: [{ type: "Cost" }],
    }),
    createCost: builder.mutation({
      query: (data) => ({
        url: "cost/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "Cost" }]),
    }),
    createMultiCost: builder.mutation({
      query: (data) => ({
        url: "cost/create-multiple-costs/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "Cost" }]),
    }),
    getCost: builder.query({
      query: ({ costId }) => `cost/${costId}/`,
      providesTags: (result, error, { costId }) => [{ type: "Cost", id: costId }],
    }),
    editCost: builder.mutation({
      query: (body) => ({
        url: `cost/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Cost", id }, { type: "Cost" }],
    }),
    deleteCost: builder.mutation({
      query: ({ costId }) => ({
        url: `cost/${costId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "Cost" }]),
    }),

    getTaxTypeList: builder.query<any, void>({
      query: () => `tax-types/`,
      providesTags: [{ type: "TaxType" }],
      //   providesTags: (result) => (result ? result.map(({ id }: { id: string }) => ({ type: "Account", id })) : []),
    }),
    createTaxType: builder.mutation({
      query: (data) => ({
        url: "tax-type/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "TaxType" }]),
    }),
    getTaxType: builder.query({
      query: ({ taxTypeId }) => `tax-type/${taxTypeId}/`,
      providesTags: (result, error, { taxTypeId }) => [{ type: "TaxType", id: taxTypeId }],
    }),
    editTaxType: builder.mutation({
      query: (body) => ({
        url: `tax-type/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => (error ? [] : [{ type: "TaxType", id }, { type: "TaxType" }]),
    }),
    deleteTaxType: builder.mutation({
      query: ({ taxTypeId }) => ({
        url: `tax-type/${taxTypeId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "TaxType" }],
    }),
  }),
});

export const {
  // Cost Category
  useGetCostCategoryListQuery,
  useCreateCostCategoryMutation,
  useEditCostCategoryMutation,
  useDeleteCostCategoryMutation,
  useGetCostCategoryQuery,
  // Cost SubCostCategory
  useCreateSubCostCategoryMutation,
  useDeleteSubCostCategoryMutation,
  useEditSubCostCategoryMutation,
  useGetSubCostCategoryListQuery,
  useGetSubCostCategoryQuery,
  // TaxRate
  useCreateTaxRateMutation,
  useDeleteTaxRateMutation,
  useEditTaxRateMutation,
  useGetTaxRateListQuery,
  useGetTaxRateQuery,
  // Cost
  useCreateCostMutation,
  useCreateMultiCostMutation,
  useDeleteCostMutation,
  useEditCostMutation,
  useGetCostListQuery,
  useGetCostQuery,
  //TaxType
  useCreateTaxTypeMutation,
  useDeleteTaxTypeMutation,
  useEditTaxTypeMutation,
  useGetTaxTypeListQuery,
  useGetTaxTypeQuery,
} = apiCost;
