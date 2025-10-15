import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessTokenFromCookie } from "@/utils/token";

export const apiCalender = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/app-customer/`,
        prepareHeaders: (headers, { getState }) => {
            const accessToken = getAccessTokenFromCookie();
            if (accessToken) {
                headers.set("Authorization", `Bearer ${accessToken}`);
            }
            return headers;
        },
    }),
    reducerPath: "CalenderApi",
    tagTypes: ["Calender"],
    endpoints: (builder) => ({
        getCalenderList: builder.query<any, { date: string }>({
            query: ({ date }) => `customers-grouped-by-time/?date=${date}`,
            providesTags: [{ type: "Calender" }],
        }),
    }),
});

export const {
    useGetCalenderListQuery
} = apiCalender;
