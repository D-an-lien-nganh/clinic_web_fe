import { getAccessTokenFromCookie } from "@/utils/token";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";


export const apiCustomerManagement = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-home/v1/`,
        prepareHeaders: (headers, { getState }) => {
            const accessToken = getAccessTokenFromCookie();
            if (accessToken) {
                headers.set("Authorization", `Bearer ${accessToken}`);
            }
            return headers;
        },
    }),
    reducerPath: "CustomerManagement",
    tagTypes: ["CustomerSource", "CustomerSocial", "CustomerStaus", "TimeFrame", "AllUsers"],
    endpoints: (builder) => ({
        getCustomerSourceList: builder.query<any, void>({
            query: () => `lead-source/`,
            providesTags: ["CustomerSource"],
        }),
        getCustomerSocialList: builder.query<any, void>({
            query: () => `customer-social/`,
            providesTags: ["CustomerSocial"],
        }),
        getCustomerStatusList: builder.query<any, void>({
            query: () => `customer-status/`,
            providesTags: ["CustomerStaus"],
        }),
    })
})

export const {
    useGetCustomerSourceListQuery,
    useGetCustomerSocialListQuery,
    useGetCustomerStatusListQuery,
} = apiCustomerManagement