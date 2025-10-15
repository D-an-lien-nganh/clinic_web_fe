import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessTokenFromCookie } from "@/utils/token";

export const apiService = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/app-product/v1/`,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = getAccessTokenFromCookie();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "ServiceApi",
  tagTypes: [
    "Service",
    "Product",
    "Maintenance",
    "FixSchedule",
    "Suppliers",
    "Facility",
    "StockIn",
    "StockOut",
    "Warehouse",
    "TechnicaSetting",
  ],
  endpoints: (builder) => ({
    getServiceList: builder.query<
      any,
      {
        page?: number;
        pageSize?: number;
        searchTerm?: string;
      }
    >({
      query: ({ page = 1, pageSize = 10, searchTerm }) => {
        let queryString = `service/?page=${page}&pageSize=${pageSize}`;
        if (searchTerm)
          queryString += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        return queryString;
      },
      providesTags: [{ type: "Service" }],
    }),
    getService: builder.query({
      query: (serviceId) => `/service/${serviceId}`,
      providesTags: (result, error, { serviceId }) => [
        { type: "Service", id: serviceId },
      ],
    }),
    createService: builder.mutation({
      query: (body) => ({
        url: "service/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Service" }],
    }),
    editService: builder.mutation({
      query: (body) => ({
        url: `service/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Service", id },
        { type: "Service" },
      ],
    }),
    deleteService: builder.mutation({
      query: ({ serviceId }) => ({
        url: `service/${serviceId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Service", id }],
    }),
    getProductList: builder.query<
      any,
      {
        page?: number;
        pageSize?: number;
        searchTerm?: string;
      }
    >({
      query: ({ page = 1, pageSize = 10, searchTerm }) => {
        let queryString = `product/?page=${page}&pageSize=${pageSize}`;
        if (searchTerm)
          queryString += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        return queryString;
      },
      providesTags: [{ type: "Product" }],
    }),
    getProduct: builder.query({
      query: (productId) => `/product/${productId}`,
      providesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
      ],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: "product/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Product" }],
    }),
    editProduct: builder.mutation({
      query: (body) => ({
        url: `product/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        { type: "Product" },
      ],
    }),
    deleteProduct: builder.mutation({
      query: ({ productId }) => ({
        url: `product/${productId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Product", id }],
    }),
    getMaintenanceList: builder.query<any, void>({
      query: () => `maintenance/`,
      providesTags: ["Maintenance"],
    }),
    getMaintenance: builder.query({
      query: (maintenanceId) => `/maintenance/${maintenanceId}`,
      providesTags: (result, error, { maintenanceId }) => [
        { type: "Maintenance", id: maintenanceId },
      ],
    }),
    createMaintenance: builder.mutation({
      query: (body) => ({
        url: "maintenance/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Maintenance" }],
    }),
    editMaintenance: builder.mutation({
      query: (body) => ({
        url: `maintenance/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Maintenance", id },
        { type: "Maintenance" },
      ],
    }),
    deleteMaintenance: builder.mutation({
      query: ({ maintenanceId }) => ({
        url: `maintenance/${maintenanceId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Maintenance", id }],
    }),
    getFixScheduleList: builder.query<any, void>({
      query: () => `fix-schedule/`,
      providesTags: ["FixSchedule"],
    }),
    getFixSchedule: builder.query({
      query: (fixScheduleId) => `/fix-schedule/${fixScheduleId}`,
      providesTags: (result, error, { fixScheduleId }) => [
        { type: "FixSchedule", id: fixScheduleId },
      ],
    }),
    createFixSchedule: builder.mutation({
      query: (body) => ({
        url: "fix-schedule/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "FixSchedule" }],
    }),
    editFixSchedule: builder.mutation({
      query: (body) => ({
        url: `fix-schedule/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "FixSchedule", id }],
    }),
    deleteFixSchedule: builder.mutation({
      query: ({ fixScheduleId }) => ({
        url: `fix-schedule/${fixScheduleId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "FixSchedule", id }],
    }),
    getFacilityList: builder.query<
      any,
      {
        page?: number;
        pageSize?: number;
        searchTerm?: string;
      }
    >({
      query: ({ page = 1, pageSize = 10, searchTerm }) => {
        let queryString = `facility/?page=${page}&pageSize=${pageSize}`;
        if (searchTerm)
          queryString += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        return queryString;
      },
      providesTags: [{ type: "Facility" }],
    }),
    getFacility: builder.query({
      query: (facilityId) => `/facility/${facilityId}`,
      providesTags: (result, error, { facilityId }) => [
        { type: "Facility", id: facilityId },
      ],
    }),
    createFacility: builder.mutation({
      query: (data) => ({
        url: "facility/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Facility" }],
    }),
    editFacility: builder.mutation({
      query: (body) => ({
        url: `facility/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Facility", id },
        { type: "Facility" },
      ],
    }),
    deleteFacility: builder.mutation({
      query: ({ id }) => {
        return {
          url: `/facility/${id}/`,
          method: "DELETE",
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Facility", id },
        { type: "Facility" },
      ],
    }),
    getStockInList: builder.query<any, void>({
      query: () => `stock-in/`,
      providesTags: ["StockIn"],
    }),
    getStockIn: builder.query({
      query: (stockInId) => `/stock-in/${stockInId}`,
      providesTags: (result, error, { stockInId }) => [
        { type: "StockIn", id: stockInId },
      ],
    }),
    createStockIn: builder.mutation({
      query: (body) => ({
        url: "stock-in/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "StockIn" }],
    }),
    editStockIn: builder.mutation({
      query: (body) => ({
        url: `stock-in/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StockIn", id },
        { type: "StockIn" },
      ],
    }),
    deleteStockIn: builder.mutation({
      query: ({ stockInId }) => ({
        url: `stock-in/${stockInId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "StockIn", id }],
    }),
    changeStockInStatus: builder.mutation({
      query: ({ id, data }) => ({
        url: `stock-in/${id}/change_status/`,
        method: "POST",
        body: data,
      }),
    }),
    getStockOutList: builder.query<any, void>({
      query: () => `stock-out/`,
      providesTags: ["StockOut"],
    }),
    getStockOut: builder.query({
      query: (stockOutId) => `/stock-out/${stockOutId}`,
      providesTags: (result, error, { stockOutId }) => [
        { type: "StockOut", id: stockOutId },
      ],
    }),

    getStockOutDetail: builder.query<any, number>({
      query: (id) => `/stock-out/${id}/`,
      providesTags: (result, error, id) => [{ type: "StockOut", id }],
    }),
    createStockOut: builder.mutation({
      query: (body) => ({
        url: "stock-out/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "StockOut" }],
    }),
    editStockOut: builder.mutation({
      query: (body) => ({
        url: `stock-out/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "StockOut", id },
        { type: "StockOut" },
      ],
    }),
    deleteStockOut: builder.mutation({
      query: ({ stockOutId }) => ({
        url: `stock-out/${stockOutId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "StockOut", id }],
    }),
    changeStockOutStatus: builder.mutation({
      query: ({ id, data }) => ({
        url: `stock-out/${id}/change_status/`,
        method: "POST",
        body: data,
      }),
    }),
    getWarehouseList: builder.query<any, void>({
      query: () => `warehouse/`,
      providesTags: ["Warehouse"],
    }),
    getWarehouse: builder.query({
      query: (warehouseId) => `/warehouse/${warehouseId}`,
      providesTags: (result, error, { warehouseId }) => [
        { type: "Warehouse", id: warehouseId },
      ],
    }),
    createWarehouse: builder.mutation({
      query: (body) => ({
        url: "warehouse/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Warehouse" }],
    }),
    editWarehouse: builder.mutation({
      query: (body) => ({
        url: `warehouse/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Warehouse", id },
        { type: "Warehouse" },
      ],
    }),
    deleteWarehouse: builder.mutation({
      query: ({ warehouseId }) => ({
        url: `warehouse/${warehouseId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Warehouse", id }],
    }),
    getSuppliersList: builder.query<
      any,
      {
        startDate?: string;
        endDate?: string;
        page?: number;
        pageSize?: number;
        searchTerm?: string;
      }
    >({
      query: ({ startDate, endDate, page, pageSize, searchTerm }) => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (page !== undefined) params.append("page", page.toString());
        if (pageSize !== undefined)
          params.append("pageSize", pageSize.toString());
        if (searchTerm) params.append("searchTerm", searchTerm);

        return `supplier/?${params.toString()}`;
      },
      providesTags: ["Suppliers"],
    }),

    getSupplier: builder.query({
      query: (supplierId) => `/supplier/${supplierId}`,
      providesTags: (result, error, { supplierId }) => [
        { type: "Suppliers", id: supplierId },
      ],
    }),
    createSupplier: builder.mutation({
      query: (body) => ({
        url: "supplier/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Suppliers" }],
    }),
    editSupplier: builder.mutation({
      query: (body) => ({
        url: `supplier/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Suppliers", id },
        { type: "Suppliers" },
      ],
    }),
    deleteSupplier: builder.mutation({
      query: ({ supplierId }) => ({
        url: `supplier/${supplierId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Suppliers", id }],
    }),
    getTechnicalSettingList: builder.query<
      any,
      {
        page: number;
        pageSize: number;
        searchTerm: string;
      }
    >({
      query: ({ page, pageSize, searchTerm }) => {
        let queryString = `technical-settings/?page=${page}&pageSize=${pageSize}`;
        if (searchTerm) queryString += `&searchTerm=${searchTerm}`;
        return queryString;
      },
      providesTags: ["TechnicaSetting"],
    }),
    getAllTechnicalSettingList: builder.query<any, void>({
      query: () => {
        return `technical-settings/`;
      },
      providesTags: ["TechnicaSetting"],
    }),
    getTechnicalSettingById: builder.query({
      query: (supplierId) => `/technical-settings/${supplierId}`,
      providesTags: (result, error, { supplierId }) => [
        { type: "TechnicaSetting", id: supplierId },
      ],
    }),
    createTechnicalSetting: builder.mutation({
      query: (body) => ({
        url: "technical-settings/",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "TechnicaSetting" }],
    }),
    editTechnicalSetting: builder.mutation({
      query: (body) => ({
        url: `technical-settings/${body.id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TechnicaSetting", id },
        { type: "TechnicaSetting" },
      ],
    }),
    deleteTechnicalSetting: builder.mutation({
      query: (id) => ({
        url: `technical-settings/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TechnicaSetting", id },
      ],
    }),

    getWarehouseLedger: builder.query<
      any,
      {
        warehouseId: number;
        type: "import" | "export";
        scope?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >({
      query: ({ warehouseId, type, scope, dateFrom, dateTo }) => {
        let url = `warehouse/${warehouseId}/ledger?type=${type}`;
        if (scope) url += `&scope=${scope}`;
        if (dateFrom) url += `&date_from=${dateFrom}`;
        if (dateTo) url += `&date_to=${dateTo}`;
        return url;
      },
      providesTags: (result, error, { warehouseId, type }) => [
        { type: "Warehouse", id: `${warehouseId}-${type}` },
      ],
    }),

    // 1) Tổng hợp tồn kho
    getInventorySummary: builder.query<
      any,
      { page?: number; pageSize?: number; startDate?: string; endDate?: string; search?: string }
    >({
      query: ({ page = 1, pageSize = 20, startDate, endDate, search } = {}) => {
        let qs = `inventory/inventory-summary/?page=${page}&pageSize=${pageSize}`;
        if (startDate) qs += `&start_date=${encodeURIComponent(startDate)}`;
        if (endDate) qs += `&end_date=${encodeURIComponent(endDate)}`;
        if (search) qs += `&search=${encodeURIComponent(search)}`; // nếu bạn thêm filter search ở backend
        return qs;
      },
      providesTags: [{ type: "Warehouse" }],
    }),

    // 2) Chi tiết theo sản phẩm (id)
    getInventoryDetail: builder.query<
      any,
      { productId: number; page?: number; pageSize?: number; startDate?: string; endDate?: string }
    >({
      query: ({ productId, page = 1, pageSize = 50, startDate, endDate }) => {
        let qs = `inventory/${productId}/inventory-detail/?page=${page}&pageSize=${pageSize}`;
        if (startDate) qs += `&start_date=${encodeURIComponent(startDate)}`;
        if (endDate) qs += `&end_date=${encodeURIComponent(endDate)}`;
        return qs;
      },
      providesTags: (_res, _err, { productId }) => [{ type: "Warehouse", id: `INV_${productId}` }],
    }),
  }),
});

export const {
  useGetServiceListQuery,
  useGetServiceQuery,
  useCreateServiceMutation,
  useEditServiceMutation,
  useDeleteServiceMutation,
  //
  useGetProductListQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useEditProductMutation,
  useDeleteProductMutation,
  //
  useGetMaintenanceListQuery,
  useGetMaintenanceQuery,
  useCreateMaintenanceMutation,
  useEditMaintenanceMutation,
  useDeleteMaintenanceMutation,
  //
  useGetFixScheduleListQuery,
  useGetFixScheduleQuery,
  useCreateFixScheduleMutation,
  useEditFixScheduleMutation,
  useDeleteFixScheduleMutation,
  //supplier
  useGetSuppliersListQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useEditSupplierMutation,
  useDeleteSupplierMutation,
  //
  useGetStockInListQuery,
  useGetStockInQuery,
  useCreateStockInMutation,
  useEditStockInMutation,
  useDeleteStockInMutation,
  useChangeStockInStatusMutation,
  //
  useGetStockOutListQuery,
  useGetStockOutQuery,
  useCreateStockOutMutation,
  useEditStockOutMutation,
  useDeleteStockOutMutation,
  useChangeStockOutStatusMutation,
  //
  useGetWarehouseListQuery,
  useGetWarehouseQuery,
  useCreateWarehouseMutation,
  useEditWarehouseMutation,
  useDeleteWarehouseMutation,
  //
  useGetFacilityListQuery,
  useGetFacilityQuery,
  useCreateFacilityMutation,
  useEditFacilityMutation,
  useDeleteFacilityMutation,
  //
  useGetTechnicalSettingListQuery,
  useGetTechnicalSettingByIdQuery,
  useCreateTechnicalSettingMutation,
  useEditTechnicalSettingMutation,
  useDeleteTechnicalSettingMutation,
  useGetAllTechnicalSettingListQuery,

  useGetStockOutDetailQuery,

  useGetWarehouseLedgerQuery,

  useGetInventorySummaryQuery,
  useGetInventoryDetailQuery,
} = apiService;
