import {
  getAccessTokenFromCookie,
  refreshAccessToken,
  saveNewAccessToken,
} from "@/utils/token";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSetup = createApi({
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
  reducerPath: "setupApi",
  endpoints: (builder) => ({
    getSetup: builder.query<any, void>({
      query: () => `set-up/`,
    }),
  }),
});

export const {
  useGetSetupQuery,
} = apiSetup;
