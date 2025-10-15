import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessTokenFromCookie } from "@/utils/token";
import { LoginRequest, LoginResponse } from "@/types/loginTypes";

export const apiAccount = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-home/v1/`,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = getAccessTokenFromCookie();
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      return headers;
    }
  }),
  reducerPath: "accountApi",
  tagTypes: ["UserProfile", "Account", "Function"],
  endpoints: (builder) => ({
    // login
    userLogin: builder.mutation<LoginResponse, LoginRequest>({
      query: ({ username, password, provider, uid, token, extra_data }) => ({
        url: "user-login/",
        method: "POST",
        body: {
          ...(username && password ? { username, password } : {}),
          ...(provider && uid && token ? { provider, uid, token, extra_data } : {}),
        },
      }),
      invalidatesTags: [{ type: "Function" }],
    }),
    // function
    availableFunctions: builder.query({
      query: () => "get-available-functions/",
      providesTags: [{ type: "Function" }],
    }),
    allFunctions: builder.query({
      query: () => "get-all-functions/",
      providesTags: [{ type: "Function" }],
    }),
    updateProfile: builder.mutation({
      query: (data: any) => ({
        url: "update-profile/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "UserProfile" }], // and used here
    }),
    // change password    
    changePassword: builder.mutation({
      query: (data: any) => ({
        url: "change-password/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Account" }], // and used here
    }),
    // tạo account người dùng mới
    createAccount: builder.mutation({
      query: (account) => ({
        url: "user-account/",
        method: "POST",
        body: account,
      }),
      invalidatesTags: [{ type: "Account" }],
    }),
    // Define a single query that optionally accepts a userId
    getAccount: builder.query({
      // The query function checks if userId is provided
      query: (userId) => `user-account/${userId ? `?user_id=${userId}` : ''}`,
    }),
    getAllUser: builder.query<any, void>({
      query: () => `user-account/`
    }),
    // cập nhật thông tin của 1 người dùng bất kỳ
    editAccount: builder.mutation({
      query: (account) => ({
        url: `user-account/`,
        method: "PATCH",
        body: account,
      }),
      invalidatesTags: [{ type: "Account" }],
    }),
    // xóa 1 người dùng bất kỳ
    deleteAccount: builder.mutation({
      query: (userId) => ({
        url: `user-account/`,
        method: "DELETE",
        body: { user_id: userId },  // Ensure the body is structured correctly
      }),
      invalidatesTags: [{ type: "Account" }],
    }),
  }),
});

export const {
  // login
  useUserLoginMutation,
  //function
  useAvailableFunctionsQuery,
  useAllFunctionsQuery,
  // User Profile API
  useUpdateProfileMutation,
  // Password API
  useChangePasswordMutation,
  // Account CRUD API
  useCreateAccountMutation,
  useEditAccountMutation,
  useDeleteAccountMutation,
  useGetAccountQuery,
  useGetAllUserQuery,
} = apiAccount;