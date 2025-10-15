import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessTokenFromCookie } from "@/utils/token";
import {
  Bill,
  CreateBillPayload,
  CustomerBillDetail,
  CustomerBillSummary,
  GetBillCustomersSummaryParams,
  GetCustomerBillsDetailParams,
  MarkComeBody,
  TreatmentRequestCreatePayload,
  TreatmentRequestUpsertPayload,
} from "./type";

export type DoctorHealthPayload = {
  nearest_examination?: string;
  blood_presure?: string;
  heart_beat?: string;
  height?: number;
  weight?: number;
  breathing_beat?: number;
  customer: number;
};

export const apiTreatment = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-treatment/v1/`,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = getAccessTokenFromCookie();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "TreatmentApi",
  tagTypes: [
    "Booking",
    "DoctorHealthCheck",
    "NurseProcess",
    "DoctorProcess",
    "ServiceAssign",
    "Bills",
    "PaymentHistory",
    "ReExamination",
    "TreatmentSession",
    "SessionService",
    "ExaminationOrder",
    "DiagnosisMedicines",
    "TreatmentRequest",
    "SessionTechicalSetting",
    "Payroll",
    "ARItem",
    "PaymentAllocation",
    "PaymentMethods",
    "ARSummary",
  ],
  endpoints: (builder) => ({
    //#region Lịch hẹn
    getBookingList: builder.query<
      any,
      {
        page: number;
        pageSize: number;
        is_treatment?: boolean;
        searchTerm?: string;
        time_frame_id?: number;
        startDate?: string;
        endDate?: string;
        types?: string[] | string;
        customer?: number;
        has_come?: boolean;
      }
    >({
      query: (p) => ({
        url: "booking/",
        params: {
          page: p.page,
          pageSize: p.pageSize,
          ...(p.startDate && p.endDate
            ? { startDate: p.startDate, endDate: p.endDate }
            : {}),
          ...(p.is_treatment !== undefined
            ? { is_treatment: p.is_treatment }
            : {}),
          ...(p.has_come !== undefined ? { has_come: p.has_come } : {}),
          ...(p.searchTerm ? { searchTerm: p.searchTerm } : {}),
          ...(p.time_frame_id ? { time_frame_id: p.time_frame_id } : {}),
          ...(p.customer ? { customer: p.customer } : {}),
          ...(p.types
            ? {
                types: Array.isArray(p.types)
                  ? p.types
                      .filter(Boolean)
                      .map((s) => s.trim())
                      .sort()
                      .filter((v, i, a) => (i === 0 ? true : v !== a[i - 1])) // dedupe sau sort
                      .join(",")
                  : p.types,
              }
            : {}),
        },
      }),
      keepUnusedDataFor: 30, // mượt khi flip tab
    }),
    getBooking: builder.query({
      query: (id) => `/booking/${id}`,
      providesTags: (result, error, { id }) => [{ type: "Booking", id: id }],
    }),
    createBooking: builder.mutation({
      query: (body) => ({
        url: "booking/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Booking" }],
    }),
    editBooking: builder.mutation({
      query: (body) => ({
        url: `booking/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        { type: "Booking" },
      ],
    }),
    updateStatusBooking: builder.mutation({
      query: (body) => ({
        url: `booking/${body.id}/update-status/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        { type: "Booking" },
      ],
    }),
    updateHasCome: builder.mutation({
      query: (body) => ({
        url: `booking/${body.id}/update-has-come/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        { type: "Booking" },
      ],
    }),
    deleteBooking: builder.mutation<void, number>({
      query: (id) => ({
        url: `booking/${id}/`,
        method: "DELETE",
      }),
      // đừng destructure — tham số thứ 3 chính là id (number)
      invalidatesTags: (result, error, id) => [
        { type: "Booking", id },
        { type: "Booking", id: "LIST" }, // (tùy) giúp list tự refresh
      ],
    }),
    //#endregion

    // ---------------- DoctorHealthCheck (NEW) ----------------
    getDoctorHealthCheckList: builder.query<
      any,
      {
        customer_id?: number;
        status?: string;
        is_treatment?: boolean;
        searchTerm?: string;
      }
    >({
      query: ({ customer_id, status, is_treatment, searchTerm } = {}) => {
        let qs = `doctor-health-check/`;
        const params: string[] = [];
        if (customer_id) params.push(`customer_id=${customer_id}`);
        if (status) params.push(`status=${status}`);
        if (is_treatment !== undefined)
          params.push(`is_treatment=${is_treatment}`);
        if (searchTerm)
          params.push(`searchTerm=${encodeURIComponent(searchTerm)}`);
        if (params.length) qs += `?${params.join("&")}`;
        return qs;
      },
      providesTags: [{ type: "DoctorHealthCheck" }],
    }),

    createDoctorHealthCheck: builder.mutation<
      any,
      { booking: number } & DoctorHealthPayload
    >({
      query: (body) => ({
        url: "doctor-health-check/",
        method: "POST",
        body, // gửi trực tiếp
      }),
      invalidatesTags: [{ type: "DoctorProcess" }],
    }),

    editDoctorHealthCheck: builder.mutation<
      any,
      { id: number; data: DoctorHealthPayload }
    >({
      query: ({ id, data }) => ({
        url: `doctor-health-check/${id}/`,
        method: "PATCH",
        body: data, // gửi trực tiếp
      }),
      invalidatesTags: [{ type: "DoctorProcess" }],
    }),

    deleteDoctorHealthCheck: builder.mutation<any, number>({
      query: (id) => ({
        url: `doctor-health-check/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DoctorHealthCheck" }],
    }),

    //#region Chờ y tá tiếp nhận
    getNurseProcessList: builder.query<any, void>({
      query: () => `nurse-process/`,
      providesTags: [{ type: "NurseProcess" }],
    }),
    createNurseProcess: builder.mutation({
      query: (body) => ({
        url: "nurse-process/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "NurseProcess" }],
    }),
    editNurseProcess: builder.mutation({
      query: (body) => ({
        url: `nurse-process/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "NurseProcess", id },
        { type: "NurseProcess" },
      ],
    }),
    deleteNurseProcess: builder.mutation({
      query: (id) => ({
        url: `nurse-process/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "NurseProcess", id },
      ],
    }),
    //#endregion

    //#region Chờ bác sĩ thăm khám
    getDoctorProcessList: builder.query<
      any,
      {
        page?: number;
        pageSize?: number;
        booking?: number[] | number;
        customer_id?: number[] | number;
        doctor?: number[] | number;
      } | void
    >({
      query: ({ page, pageSize, booking, customer_id, doctor } = {}) => {
        let qs = `doctor-process/`;
        const params: string[] = [];

        if (page) params.push(`page=${page}`);
        if (pageSize) params.push(`pageSize=${pageSize}`);

        const joinIds = (v: number[] | number | undefined) =>
          Array.isArray(v)
            ? v.join(",")
            : typeof v === "number"
            ? String(v)
            : undefined;

        const bookingStr = joinIds(booking);
        const customerStr = joinIds(customer_id);
        const doctorStr = joinIds(doctor);

        if (bookingStr) params.push(`booking=${bookingStr}`);
        if (customerStr) params.push(`customer_id=${customerStr}`);
        if (doctorStr) params.push(`doctor=${doctorStr}`);

        if (params.length) qs += `?${params.join("&")}`;
        return qs;
      },
      providesTags: [{ type: "DoctorProcess" }],
    }),
    createDoctorProcess: builder.mutation({
      query: (body) => ({
        url: "doctor-process/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "DoctorProcess" }],
    }),
    editDoctorProcess: builder.mutation<
      any,
      { id: number; data: any; deleteMissing?: boolean }
    >({
      query: ({ id, data, deleteMissing }) => ({
        url:
          `doctor-process/${id}/` +
          (deleteMissing ? `?delete_missing=true` : ""),
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "DoctorProcess", id },
        { type: "DoctorProcess" },
      ],
    }),
    deleteDoctorProcess: builder.mutation({
      query: (id) => ({
        url: `doctor-process/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "DoctorProcess", id },
      ],
    }),
    //#endregion

    //#region
    getServiceAssignList: builder.query<any, void>({
      query: () => `service-assign/`,
      providesTags: [{ type: "ServiceAssign" }],
    }),
    createServiceAssign: builder.mutation({
      query: (body) => ({
        url: "service-assign/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "ServiceAssign" }],
    }),
    editServiceAssign: builder.mutation({
      query: (body) => ({
        url: `service-assign/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ServiceAssign", id },
        { type: "ServiceAssign" },
      ],
    }),
    deleteServiceAssign: builder.mutation({
      query: (id) => ({
        url: `service-assign/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ServiceAssign", id },
      ],
    }),
    //#endregion

    //#region Bills
    getBillsList: builder.query<
      any,
      {
        page: number;
        pageSize: number;
        startDate: string;
        endDate: string;
        customer?: number[];
        type?: string;
      }
    >({
      query: ({ page, pageSize, startDate, endDate, customer, type }) => {
        let queryString = `bills/?page=${page}&pageSize=${pageSize}`;

        if (startDate && endDate)
          queryString += `&startDate=${startDate}&endDate=${endDate}`;
        if (customer) queryString += `&customer_id=${customer}`;
        if (type) queryString += `&type=${type}`;

        return queryString;
      },
      providesTags: [{ type: "Bills" }],
    }),

    getBillsById: builder.query({
      query: (id) => `bills/${id}`,
    }),
    createBills: builder.mutation<Bill, CreateBillPayload>({
      query: (body) => ({
        url: "bills/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Bills" }],
    }),
    editBills: builder.mutation({
      query: ({ id, data }) => ({
        url: `bills/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "Bills" }],
    }),
    deleteBills: builder.mutation({
      query: (id) => ({
        url: `bills/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Bills" }],
    }),

    getUsedProductServiceById: builder.query({
      query: (id) => `bills/${id}/used_products_services`,
    }),
    //#endregion

    //#region Payment History
    getPaymentHistoryListByBill: builder.query<
      any,
      {
        bill_id: number;
      }
    >({
      query: ({ bill_id }) => {
        let queryString = `payment-history/?`;
        if (bill_id) queryString += `&bill_id=${bill_id}`;
        return queryString;
      },
      providesTags: [{ type: "PaymentHistory" }],
    }),
    createPaymentHistory: builder.mutation({
      query: (data) => ({
        url: "payment-history/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "PaymentHistory" }],
    }),
    editPaymentHistory: builder.mutation({
      query: ({ id, data }) => ({
        url: `payment-history/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "PaymentHistory" }],
    }),
    deletePaymentHistory: builder.mutation({
      query: (id) => ({
        url: `payment-history/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "PaymentHistory" }],
    }),
    //#endregion
    //#region re_examination
    createReExamination: builder.mutation({
      query: (data) => ({
        url: "re_examination/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "ReExamination" }],
    }),
    //#endregion
    //#region treatment_session
    editTreatmentSession: builder.mutation({
      query: ({ id, data }) => ({
        url: `treatment-session/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "TreatmentSession" }],
    }),
    //#endregion

    deleteSessionService: builder.mutation({
      query: (id) => ({
        url: `session-service/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "SessionService" }],
    }),
    CreateSessionService: builder.mutation({
      query: (body) => ({
        url: "session-service/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "SessionService" }],
    }),
    PatchSessionService: builder.mutation({
      query: ({ body, id }) => ({
        url: `session-service/${id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: [{ type: "SessionService" }],
    }),

    // ================= ExaminationOrder =================
    getExaminationOrderList: builder.query<
      any,
      {
        page?: number;
        pageSize?: number;
        booking?: number[] | number;
        customer_id?: number[] | number; // yêu cầu chính: lọc theo customer
        doctor?: number[] | number;
      }
    >({
      query: ({ page, pageSize, booking, customer_id, doctor } = {}) => {
        let qs = `examination-order/`;
        const params: string[] = [];

        if (page) params.push(`page=${page}`);
        if (pageSize) params.push(`pageSize=${pageSize}`);

        // _parse_ids(get("booking")) -> chuỗi "1,2,3"
        const joinIds = (v: number[] | number | undefined) =>
          Array.isArray(v)
            ? v.join(",")
            : typeof v === "number"
            ? String(v)
            : undefined;

        const bookingStr = joinIds(booking);
        const customerStr = joinIds(customer_id);
        const doctorStr = joinIds(doctor);

        if (bookingStr) params.push(`booking=${bookingStr}`);
        if (customerStr) params.push(`customer_id=${customerStr}`);
        if (doctorStr) params.push(`doctor=${doctorStr}`);

        if (params.length) qs += `?${params.join("&")}`;
        return qs;
      },
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((it: any) => ({
                type: "ExaminationOrder" as const,
                id: it.id,
              })),
              { type: "ExaminationOrder" as const },
            ]
          : [{ type: "ExaminationOrder" }],
    }),

    createExaminationOrder: builder.mutation<
      any,
      {
        customer_id?: number;
        booking?: number;
        doctor?: number;
        diagnosis?: string;
        note?: string;
        items?: Array<{
          test_service: number;
          quantity?: number;
          price_override?: string | number | null;
          note?: string;
          test_result?: string;
        }>;
      }
    >({
      query: (body) => ({
        url: "examination-order/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ExaminationOrder" }],
    }),

    updateExaminationOrder: builder.mutation<
      any,
      {
        id: number;
        data: {
          booking?: number;
          doctor?: number;
          diagnosis?: string;
          note?: string;
          // Nếu gửi items => backend sẽ xoá hết items cũ và tạo lại
          items?: Array<{
            test_service: number;
            quantity?: number;
            price_override?: string | number | null;
            note?: string;
            test_result?: string;
          }>;
        };
      }
    >({
      query: ({ id, data }) => ({
        url: `examination-order/${id}/`,
        method: "PUT", // cập nhật toàn bộ
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ExaminationOrder", id },
        { type: "ExaminationOrder" },
      ],
    }),

    // ================= DiagnosisMedicine =================
    getDiagnosisMedicineList: builder.query<
      any,
      {
        page?: number;
        pageSize?: number;
        booking?: number[] | number;
        customer?: number[] | number;
        doctor?: number[] | number;
      }
    >({
      query: ({ page, pageSize, booking, customer, doctor } = {}) => {
        let qs = `diagnosis-medicines/`;
        const params: string[] = [];

        if (page) params.push(`page=${page}`);
        if (pageSize) params.push(`pageSize=${pageSize}`);

        const joinIds = (v: number[] | number | undefined) =>
          Array.isArray(v)
            ? v.join(",")
            : typeof v === "number"
            ? String(v)
            : undefined;

        const bookingStr = joinIds(booking);
        const customerStr = joinIds(customer);
        const doctorStr = joinIds(doctor);

        if (bookingStr) params.push(`booking=${bookingStr}`);
        if (customerStr) params.push(`customer=${customerStr}`);
        if (doctorStr) params.push(`doctor=${doctorStr}`);

        if (params.length) qs += `?${params.join("&")}`;
        return qs;
      },
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((it: any) => ({
                type: "DiagnosisMedicines" as const,
                id: it.id,
              })),
              { type: "DiagnosisMedicines" as const },
            ]
          : [{ type: "DiagnosisMedicines" }],
    }),

    createDiagnosisMedicine: builder.mutation<
      any,
      {
        doctor_process: number;
        product: number;
        quantity?: number;
        unit?: number;
        dose?: string;
        note?: string;
        price?: string | number;
      }
    >({
      query: (body) => ({
        url: "diagnosis-medicines/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DiagnosisMedicines" }],
    }),

    updateDiagnosisMedicine: builder.mutation<
      any,
      {
        id: number;
        data: {
          doctor_process?: number;
          product?: number;
          quantity?: number;
          unit?: number;
          dose?: string;
          note?: string;
          price?: string | number;
        };
      }
    >({
      query: ({ id, data }) => ({
        url: `diagnosis-medicines/${id}/`,
        method: "PUT", // Cập nhật toàn bộ, tương tự mẫu
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "DiagnosisMedicines", id },
        { type: "DiagnosisMedicines" },
      ],
    }),

    //#region TreatmentRequest
    getTreatmentRequests: builder.query<
      any,
      { customer_id?: number; page?: number; pageSize?: number }
    >({
      query: ({ customer_id, page, pageSize }) => {
        let qs = `treatment-request/?`;
        if (customer_id) qs += `customer_id=${customer_id}&`;
        if (page) qs += `page=${page}&`;
        if (pageSize) qs += `pageSize=${pageSize}&`;
        return qs;
      },
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((tr: any) => ({
                type: "TreatmentRequest" as const,
                id: tr.id,
              })),
              { type: "TreatmentRequest" as const, id: "LIST" },
            ]
          : [{ type: "TreatmentRequest" as const, id: "LIST" }],
    }),

    getTreatmentRequest: builder.query<any, number>({
      query: (id) => `treatment-request/${id}/`,
      providesTags: (result, error, id) => [
        { type: "TreatmentRequest" as const, id },
      ],
    }),

    createTreatmentRequest: builder.mutation<
      any,
      TreatmentRequestCreatePayload
    >({
      query: (body) => ({ url: `treatment-request/`, method: "POST", body }),
      invalidatesTags: [
        { type: "TreatmentRequest", id: "LIST" },
        { type: "TreatmentSession" },
      ],
    }),

    updateTreatmentRequest: builder.mutation<
      any,
      TreatmentRequestUpsertPayload
    >({
      query: ({ id, ...rest }) => ({
        url: `treatment-request/${id}/`,
        method: "PATCH",
        body: rest,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "TreatmentRequest", id },
        { type: "TreatmentRequest", id: "LIST" },
        { type: "TreatmentSession" },
      ],
    }),
    //#endregion

    //#region TreatmentSession
    getTreatmentSessions: builder.query<
      any,
      { treatment_request?: number; page?: number; pageSize?: number }
    >({
      query: ({ treatment_request, page, pageSize }) => {
        let qs = `treatment-session/?`;
        if (treatment_request) qs += `treatment_request=${treatment_request}&`;
        if (page) qs += `page=${page}&`;
        if (pageSize) qs += `pageSize=${pageSize}&`;
        return qs;
      },
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((s: any) => ({
                type: "TreatmentSession" as const,
                id: s.id,
              })),
              { type: "TreatmentSession" as const, id: "LIST" },
            ]
          : [{ type: "TreatmentSession" as const, id: "LIST" }],
    }),

    getTreatmentSession: builder.query<any, number>({
      query: (id) => `treatment-session/${id}/`,
      providesTags: (r, e, id) => [{ type: "TreatmentSession" as const, id }],
    }),

    createTreatmentSession: builder.mutation<any, any>({
      query: (body) => ({ url: `treatment-session/`, method: "POST", body }),
      invalidatesTags: [{ type: "TreatmentSession" as const, id: "LIST" }],
    }),

    updateTreatmentSession: builder.mutation<any, any>({
      query: ({ id, ...rest }) => ({
        url: `treatment-sessions/${id}/`,
        method: "PATCH",
        body: rest,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "TreatmentSession" as const, id },
        { type: "TreatmentSession" as const, id: "LIST" },
      ],
    }),

    addDesignatedExperts: builder.mutation<
      any,
      { session_id: number; user_ids: number[] }
    >({
      query: ({ session_id, user_ids }) => ({
        url: `treatment-sessions/${session_id}/add-designated-experts/`,
        method: "POST",
        body: { user_ids },
      }),
      invalidatesTags: (r, e, { session_id }) => [
        { type: "TreatmentSession" as const, id: session_id },
      ],
    }),
    //#endregion

    //#region SessionTechicalSetting actions
    createSessionTechSettings: builder.mutation<
      any,
      {
        session_id: number;
        session_techical_settings: Array<{
          techical_setting: number;
          experts?: number[];
          duration_minutes?: number;
          room?: string | null;
          has_come?: boolean;
        }>;
      }
    >({
      query: ({ session_id, session_techical_settings }) => ({
        url: `treatment-sessions/${session_id}/create-techical-setting/`,
        method: "POST",
        body: { session_techical_settings },
      }),
      invalidatesTags: (r, e, { session_id }) => [
        { type: "TreatmentSession" as const, id: session_id },
      ],
    }),

    updateSessionTechSetting: builder.mutation<
      any,
      {
        session_id: number;
        id: number;
        techical_setting_id?: number;
        expert_ids?: number[];
        duration_minutes?: number;
        room?: string | null;
        has_come?: boolean;
      }
    >({
      query: ({ session_id, ...rest }) => ({
        url: `treatment-sessions/${session_id}/update-techical-setting/`,
        method: "PATCH",
        body: rest,
      }),
      invalidatesTags: (r, e, { session_id }) => [
        { type: "TreatmentSession" as const, id: session_id },
      ],
    }),

    deleteSessionTechSetting: builder.mutation<
      void,
      { session_id: number; item_id: number }
    >({
      query: ({ session_id, item_id }) => ({
        url: `treatment-session/${session_id}/delete-techical-setting/${item_id}`,
        method: "DELETE",
      }),
      invalidatesTags: (r, e, { session_id }) => [
        { type: "TreatmentSession" as const, id: session_id },
      ],
    }),

    deleteDiagnosisMedicine: builder.mutation<void, number>({
      query: (id) => ({
        url: `diagnosis-medicines/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DiagnosisMedicines" }],
    }),

    markComeTechSetting: builder.mutation<
      any,
      { session_id: number; body: MarkComeBody }
    >({
      query: ({ session_id, body }) => ({
        url: `treatment-sessions/${session_id}/mark-come/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { session_id }) => [
        { type: "TreatmentSession" as const, id: session_id },
      ],
    }),
    //#endregion

    /** Lương hiệu suất theo khoảng thời gian */
    getPayroll: builder.query<
      any[],
      { startDate: string; endDate: string; search?: string }
    >({
      query: ({ startDate, endDate, search }) => {
        let url = `${process.env.NEXT_PUBLIC_API_URL}/api/app-treatment/v1/payroll/?start_date=${startDate}&end_date=${endDate}`;
        if (search) url += `&q=${encodeURIComponent(search)}`;
        return { url, method: "GET" };
      },
      providesTags: ["Payroll"],
    }),

    getExpertTechniqueDetails: builder.query<
      {
        employee: { id: number; full_name: string | null };
        summary: { total_customers: number; total_sessions: number };
        groups: Array<{
          customer: { id: number; name: string; code?: string };
          treatment_type: "TLCB" | "TLDS" | null;
          total_count: number;
          details: Array<{
            date: string;
            technique_name: string;
            count: number;
          }>;
        }>;
      },
      {
        expertId: number;
        type?: "TLCB" | "TLDS";
        startDate?: string;
        endDate?: string;
      }
    >({
      query: ({ expertId, type, startDate, endDate }) => ({
        url: `treatment/payroll/experts/${expertId}/technique-details/`,
        method: "GET",
        params: { type, startDate, endDate },
      }),
      providesTags: (_r, _e, arg) => [
        { type: "Payroll", id: `expert-${arg.expertId}` },
      ],
    }),

    markCome: builder.mutation<any, { sessionId: number; body: MarkComeBody }>({
      query: ({ sessionId, body }) => ({
        url: `treatment-session/${sessionId}/mark-come/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SessionTechicalSetting"],
    }),

    // ✅ Bổ sung mới
    getDoctorProcessDetail: builder.query<any, number>({
      query: (id) => `doctor-process/${id}/`,
      providesTags: (result, error, id) => [{ type: "DoctorProcess", id }],
    }),
    getTreatmentRequestDetail: builder.query<any, number>({
      query: (id) => `treatment-request/${id}/`,
      providesTags: (result, error, id) => [{ type: "TreatmentRequest", id }],
      keepUnusedDataFor: 0,
    }),

    getBillCustomersSummary: builder.query<
      | CustomerBillSummary[]
      | { results: CustomerBillSummary[]; total_revenue?: string },
      GetBillCustomersSummaryParams | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.startDate && args?.endDate) {
          params.set("startDate", args.startDate);
          params.set("endDate", args.endDate);
        }
        if (args?.customer) params.set("customer", String(args.customer));
        if (args?.searchTerm) params.set("searchTerm", String(args.searchTerm));
        if (args?.customer) params.set("customer", String(args.customer));
        if (args?.paymentStart) params.set("paymentStart", args.paymentStart);
        if (args?.paymentEnd) params.set("paymentEnd", args.paymentEnd);
        const qs = params.toString();
        return `bills/customers-summary/${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: "ARSummary" }, { type: "Bills" }],
    }),

    getCustomerBillsDetail: builder.query<
      CustomerBillDetail[],
      GetCustomerBillsDetailParams
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args.customer_id)
          params.set("customer_id", String(args.customer_id));
        if (args.customer_code)
          params.set("customer_code", String(args.customer_code));
        if (args.startDate && args.endDate) {
          params.set("startDate", args.startDate);
          params.set("endDate", args.endDate);
        }
        const qs = params.toString();
        return `bills/customer-bills/${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: "Bills" }],
    }),
  }),
});

export const {
  // Lịch hẹn
  useGetBookingListQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useEditBookingMutation,
  useUpdateStatusBookingMutation,
  useUpdateHasComeMutation,
  useDeleteBookingMutation,

  // Chờ y tá tiếp nhận
  useGetNurseProcessListQuery,
  useCreateNurseProcessMutation,
  useEditNurseProcessMutation,
  useDeleteNurseProcessMutation,

  // Chờ bác sĩ thăm khám
  useGetDoctorProcessListQuery,
  useCreateDoctorProcessMutation,
  useEditDoctorProcessMutation,
  useDeleteDoctorProcessMutation,

  //
  useGetServiceAssignListQuery,
  useCreateServiceAssignMutation,
  useEditServiceAssignMutation,
  useDeleteServiceAssignMutation,

  //bills
  useGetBillsListQuery,
  useGetBillsByIdQuery,
  useCreateBillsMutation,
  useDeleteBillsMutation,
  useEditBillsMutation,
  useGetUsedProductServiceByIdQuery,

  //payment-history
  useGetPaymentHistoryListByBillQuery,
  useCreatePaymentHistoryMutation,
  useEditPaymentHistoryMutation,
  useDeletePaymentHistoryMutation,

  //re_examination
  useCreateReExaminationMutation,

  //treatment_session
  useEditTreatmentSessionMutation,

  //session-service
  useDeleteSessionServiceMutation,
  useCreateSessionServiceMutation,
  usePatchSessionServiceMutation,

  // DoctorHealthCheck (NEW)
  useGetDoctorHealthCheckListQuery,
  useCreateDoctorHealthCheckMutation,
  useEditDoctorHealthCheckMutation,
  useDeleteDoctorHealthCheckMutation,

  // ExaminationOrder
  useGetExaminationOrderListQuery,
  useCreateExaminationOrderMutation,
  useUpdateExaminationOrderMutation,

  // DiagnosisMedicine
  useGetDiagnosisMedicineListQuery,
  useCreateDiagnosisMedicineMutation,
  useUpdateDiagnosisMedicineMutation,

  // TreatmentRequest
  useGetTreatmentRequestsQuery,
  useGetTreatmentRequestQuery,
  useCreateTreatmentRequestMutation,
  useUpdateTreatmentRequestMutation,

  // TreatmentSession
  useGetTreatmentSessionsQuery,
  useGetTreatmentSessionQuery,
  useCreateTreatmentSessionMutation,
  useUpdateTreatmentSessionMutation,
  useAddDesignatedExpertsMutation,

  // SessionTechicalSetting
  useCreateSessionTechSettingsMutation,
  useUpdateSessionTechSettingMutation,
  useDeleteSessionTechSettingMutation,
  useMarkComeTechSettingMutation,

  useGetPayrollQuery,

  useGetExpertTechniqueDetailsQuery,

  // Cập nhật trạng thái đã đến
  useMarkComeMutation,

  useGetDoctorProcessDetailQuery,
  useGetTreatmentRequestDetailQuery,

  useGetBillCustomersSummaryQuery,

  useGetCustomerBillsDetailQuery,

  useDeleteDiagnosisMedicineMutation,
} = apiTreatment;
