import { getAccessTokenFromCookie } from "@/utils/token";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiConfiguration = createApi({
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
  reducerPath: "configurationApi",
  tagTypes: [
    "Position",
    "Department",
    "Floor",
    "TimeFrame",
    "Discount",
    "Commission",
    "Protocol",
    "Unit",
    "Source",
    "Treatment-packages",
    "Test-services"
  ],
  endpoints: (builder) => ({
    // Vị trí công việc
    getPositionList: builder.query<any, void>({
      query: () => `position/`,
      providesTags: [{ type: "Position" }],
    }),
    // Tạo 1 vị trí
    createPosition: builder.mutation({
      query: (position) => ({
        url: "position/",
        method: "POST",
        body: position,
      }),
      invalidatesTags: [{ type: "Position" }],
    }),
    // lấy thông tin của 1 vị trí
    getPosition: builder.query({
      query: ({ positionId }) => `position/${positionId}/`,
      providesTags: (result, error, { positionId }) => [{ type: "Position", id: positionId }],
    }),
    // cập nhật vị trí
    editPosition: builder.mutation({
      query: (body) => ({
        url: `position/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Position", id }, { type: "Position" }],
    }),
    // xóa vị trí
    deletePosition: builder.mutation({
      query: (positionId) => ({
        url: `position/${positionId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Position" }],
    }),
    // department
    getDepartmentList: builder.query<any, void>({
      query: () => `department/`,
      providesTags: [{ type: "Department" }],
    }),
    getDepartmentListAll: builder.query<any, void>({
      query: () => `department/?pageSize=9999`,
      providesTags: [{ type: "Department" }],
    }),
    createDepartment: builder.mutation({
      query: (department) => ({
        url: "department/",
        method: "POST",
        body: department,
      }),
      invalidatesTags: [{ type: "Department" }],
    }),
    getDepartment: builder.query({
      query: ({ departmentId }) => `department/${departmentId}/`,
      providesTags: (result, error, { departmentId }) => [{ type: "Department", id: departmentId }],
    }),
    editDepartment: builder.mutation({
      query: (body) => ({
        url: `department/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Department", id }, { type: "Department" }],
    }),
    deleteDepartment: builder.mutation({
      query: (departmentId) => ({
        url: `department/${departmentId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Department" }],
    }),
    // floor
    getFloorList: builder.query<any, void>({
      query: () => `floor/`,
      providesTags: [{ type: "Floor" }],
    }),
    createFloor: builder.mutation({
      query: (floor) => ({
        url: "floor/",
        method: "POST",
        body: floor,
      }),
      invalidatesTags: [{ type: "Floor" }],
    }),
    getFloor: builder.query({
      query: ({ floorId }) => `floor/${floorId}/`,
      providesTags: (result, error, { floorId }) => [{ type: "Floor", id: floorId }],
    }),
    editFloor: builder.mutation({
      query: (body) => ({
        url: `floor/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Floor", id }, { type: "Floor" }],
    }),
    deleteFloor: builder.mutation({
      query: (floorId) => ({
        url: `floor/${floorId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Floor" }],
    }),
    // time-frame
    getTimeFrameList: builder.query<any, void>({
      query: () => `time-frame/`,
      providesTags: [{ type: "TimeFrame" }],
    }),
    createTimeFrame: builder.mutation({
      query: (time) => ({
        url: "time-frame/",
        method: "POST",
        body: time,
      }),
      invalidatesTags: [{ type: "TimeFrame" }],
    }),
    getTimeFrame: builder.query({
      query: ({ timeId }) => `time-frame/${timeId}/`,
      providesTags: (result, error, { timeId }) => [{ type: "TimeFrame", id: timeId }],
    }),
    editTimeFrame: builder.mutation({
      query: (body) => ({
        url: `time-frame/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "TimeFrame", id }, { type: "TimeFrame" }],
    }),
    deleteTimeFrame: builder.mutation({
      query: (timeId) => ({
        url: `time-frame/${timeId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "TimeFrame" }],
    }),
    // Discount
    getDiscountList: builder.query<any, void>({
      query: () => `discount/`,
      providesTags: [{ type: "Discount" }],
    }),
    createDiscount: builder.mutation({
      query: (discount) => ({
        url: "discount/",
        method: "POST",
        body: discount,
      }),
      invalidatesTags: [{ type: "Discount" }],
    }),
    getDiscount: builder.query({
      query: ({ disId }) => `discount/${disId}/`,
      providesTags: (result, error, { disId }) => [{ type: "Discount", id: disId }],
    }),
    editDiscount: builder.mutation({
      query: (body) => ({
        url: `discount/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Discount", id }, { type: "Discount" }],
    }),
    deleteDiscount: builder.mutation({
      query: (disId) => ({
        url: `discount/${disId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Discount" }],
    }),
    // Commission
    getCommissionList: builder.query<any, void>({
      query: () => `commission/`,
      providesTags: [{ type: "Commission" }],
    }),
    createCommission: builder.mutation({
      query: (commission) => ({
        url: "commission/",
        method: "POST",
        body: commission,
      }),
      invalidatesTags: [{ type: "Commission" }],
    }),
    getCommission: builder.query({
      query: ({ comId }) => `commission/${comId}/`,
      providesTags: (result, error, { comId }) => [{ type: "Commission", id: comId }],
    }),
    editCommission: builder.mutation({
      query: (body) => ({
        url: `commission/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Commission", id }, { type: "Commission" }],
    }),
    deleteCommission: builder.mutation({
      query: (comId) => ({
        url: `commission/${comId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Commission" }],
    }),
    // Protocol 
    getProtocolList: builder.query<any, void>({
      query: () => `protocol/`,
      providesTags: [{ type: "Protocol" }],
    }),
    createProtocol: builder.mutation({
      query: (protocol) => ({
        url: "protocol/",
        method: "POST",
        body: protocol,
      }),
      invalidatesTags: [{ type: "Protocol" }],
    }),
    getProtocol: builder.query({
      query: ({ proId }) => `protocol/${proId}/`,
      providesTags: (result, error, { proId }) => [{ type: "Protocol", id: proId }],
    }),
    editProtocol: builder.mutation({
      query: (body) => ({
        url: `protocol/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Protocol", id }, { type: "Protocol" }],
    }),
    deleteProtocol: builder.mutation({
      query: (proId) => ({
        url: `protocol/${proId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Protocol" }],
    }),
    // Unit 
    getUnitList: builder.query<any, void>({
      query: () => `unit/`,
      providesTags: [{ type: "Unit" }],
    }),
    createUnit: builder.mutation({
      query: (unit) => ({
        url: "unit/",
        method: "POST",
        body: unit,
      }),
      invalidatesTags: [{ type: "Unit" }],
    }),
    getUnit: builder.query({
      query: ({ unitId }) => `unit/${unitId}/`,
      providesTags: (result, error, { unitId }) => [{ type: "Unit", id: unitId }],
    }),
    editUnit: builder.mutation({
      query: (body) => ({
        url: `unit/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Unit", id }, { type: "Unit" }],
    }),
    deleteUnit: builder.mutation({
      query: (unitId) => ({
        url: `unit/${unitId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Unit" }],
    }),
    // Source  
    getSourceList: builder.query<any, void>({
      query: () => `lead-source/`,
      providesTags: [{ type: "Source" }],
    }),
    createSource: builder.mutation({
      query: (body) => ({
        url: "lead-source/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Source" }],
    }),
    getSource: builder.query({
      query: ({ sourceId }) => `lead-source/${sourceId}/`,
      providesTags: (result, error, { sourceId }) => [{ type: "Source", id: sourceId }],
    }),
    editSource: builder.mutation({
      query: (body) => ({
        url: `lead-source/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Source", id }, { type: "Source" }],
    }),
    deleteSource: builder.mutation({
      query: (sourceId) => ({
        url: `lead-source/${sourceId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Source" }],
    }),
    // Treatment-packages
    getTreatmentList: builder.query<any, void>({
      query: () => `treatment-packages/`,
      providesTags: [{ type: "Treatment-packages" }],
    }),
    createTreatment: builder.mutation({
      query: (treatment) => ({
        url: "treatment-packages/",
        method: "POST",
        body: treatment,
      }),
      invalidatesTags: [{ type: "Treatment-packages" }],
    }),
    getTreatment: builder.query({
      query: ({ treatmentId }) => `treatment-packages/${treatmentId}/`,
      providesTags: (result, error, { treatmentId }) => [{ type: "Treatment-packages", id: treatmentId }],
    }),
    editTreatment: builder.mutation({
      query: (body) => ({
        url: `treatment-packages/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Treatment-packages", id }, { type: "Treatment-packages" }],
    }),
    deleteTreatment: builder.mutation({
      query: (treatmentId) => ({
        url: `treatment-packages/${treatmentId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Treatment-packages" }],
    }),
    // Test-services
    getTestServiceList: builder.query<any, void>({
      query: () => `test-services/`,
      providesTags: [{ type: "Test-services" }],
    }),
    createTestService: builder.mutation({
      query: (testServices) => ({
        url: "test-services/",
        method: "POST",
        body: testServices,
      }),
      invalidatesTags: [{ type: "Test-services" }],
    }),
    getTestService: builder.query({
      query: ({ testServicesId }) => `test-services/${testServicesId}/`,
      providesTags: (result, error, { testServicesId }) => [{ type: "Test-services", id: testServicesId }],
    }),
    editTestService: builder.mutation({
      query: (body) => ({
        url: `test-services/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Test-services", id }, { type: "Test-services" }],
    }),
    deleteTestService: builder.mutation({
      query: (testServicesId) => ({
        url: `test-services/${testServicesId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Test-services" }],
    }),
  }),
});

export const {
  // Position
  useGetPositionListQuery,
  useCreatePositionMutation,
  useEditPositionMutation,
  useDeletePositionMutation,
  useGetPositionQuery,
  // Department
  useGetDepartmentListQuery,
  useGetDepartmentListAllQuery,
  useCreateDepartmentMutation,
  useEditDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentQuery,
  // Floor - Tầng điều trị
  useGetFloorListQuery,
  useCreateFloorMutation,
  useEditFloorMutation,
  useDeleteFloorMutation,
  useGetFloorQuery,
  // time-frame 
  useGetTimeFrameListQuery,
  useCreateTimeFrameMutation,
  useEditTimeFrameMutation,
  useDeleteTimeFrameMutation,
  useGetTimeFrameQuery,
  // Discount
  useGetDiscountListQuery,
  useCreateDiscountMutation,
  useEditDiscountMutation,
  useDeleteDiscountMutation,
  useGetDiscountQuery,
  // Commission
  useGetCommissionListQuery,
  useCreateCommissionMutation,
  useEditCommissionMutation,
  useDeleteCommissionMutation,
  useGetCommissionQuery,
  // Protocol
  useGetProtocolListQuery,
  useCreateProtocolMutation,
  useEditProtocolMutation,
  useDeleteProtocolMutation,
  useGetProtocolQuery,
  // Unit
  useGetUnitListQuery,
  useCreateUnitMutation,
  useEditUnitMutation,
  useDeleteUnitMutation,
  useGetUnitQuery,
  // source
  useGetSourceListQuery,
  useCreateSourceMutation,
  useEditSourceMutation,
  useDeleteSourceMutation,
  useGetSourceQuery,
  // Treatment-packages
  useGetTreatmentListQuery,
  useCreateTreatmentMutation,
  useEditTreatmentMutation,
  useDeleteTreatmentMutation,
  useGetTreatmentQuery,
  // Test-services
  useGetTestServiceListQuery,
  useCreateTestServiceMutation,
  useGetTestServiceQuery,
  useEditTestServiceMutation,
  useDeleteTestServiceMutation,
} = apiConfiguration;
