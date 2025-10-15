import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/features/authSlice";
import cartReducer from "@/lib/features/cartSlice";
import collapseReducer from "@/lib/features/collapseSlice";
import searchParamsReducer from "@/lib/features/searchParamsSlice";

// APIs hiện có
import { apiAccounting as accountingApi } from "@/api/app_accounting/apiAccounting";
import { apiCost as costApi } from "@/api/app_finance/apiCost";
import { apiAccount as accountApi } from "@/api/app_home/apiAccount";
import { apiConfiguration as configurationApi } from "@/api/app_home/apiConfiguration";
import { apiSetup as setupApi } from "@/api/app_home/apiSetup";
import { apiCalender as calenderApi } from "@/api/app_treatment/apiCalender";
import { apiTreatment as treatmentApi } from "@/api/app_treatment/apiTreatment";
import { apiMarketing as marketingApi } from "@/api/app_customer/apiMarketing";
import { apiCustomerManagement as customerManagementApi } from "@/api/app_home/apiCustomerManagement";
import { apiService as serviceApi } from "@/api/app_product/apiService";
import { apiHR as hrApi } from "@/api/app_hr/apiHR";

// ⬇️ MỚI: RTK Query cho thanh toán
import { apiPayment as paymentApi } from "@/api/app_treatment/apiPayment";
import { apiTreatmentReport as treatmentReportApi } from "@/api/app_treatment/treatmentReportApi";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      collapse: collapseReducer,
      searchParams: searchParamsReducer,

      // RTK Query reducers
      [accountApi.reducerPath]: accountApi.reducer,
      [configurationApi.reducerPath]: configurationApi.reducer,
      [costApi.reducerPath]: costApi.reducer,
      [setupApi.reducerPath]: setupApi.reducer,
      [accountingApi.reducerPath]: accountingApi.reducer,
      [calenderApi.reducerPath]: calenderApi.reducer,
      [treatmentApi.reducerPath]: treatmentApi.reducer,
      [marketingApi.reducerPath]: marketingApi.reducer,
      [customerManagementApi.reducerPath]: customerManagementApi.reducer,
      [serviceApi.reducerPath]: serviceApi.reducer,
      [hrApi.reducerPath]: hrApi.reducer,

      // ⬇️ MỚI: PaymentApi
      [paymentApi.reducerPath]: paymentApi.reducer,
      [treatmentReportApi.reducerPath]: treatmentReportApi.reducer,

    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        accountApi.middleware,
        configurationApi.middleware,
        costApi.middleware,
        setupApi.middleware,
        accountingApi.middleware,
        calenderApi.middleware,
        treatmentApi.middleware,
        marketingApi.middleware,
        customerManagementApi.middleware,
        serviceApi.middleware,
        hrApi.middleware,

        // ⬇️ MỚI: PaymentApi middleware
        paymentApi.middleware,
        treatmentReportApi.middleware,
      ),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
