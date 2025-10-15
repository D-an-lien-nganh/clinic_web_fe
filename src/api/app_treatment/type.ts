export type TechniqueItemPayload = {
  id?: number;                    // có thì update, không có thì create
  techical_setting_id?: number;   // bắt buộc khi create
  expert_ids?: number[];
  duration_minutes?: number;
  room?: string | null;
  has_come?: boolean;
};

export type SessionPayload = {
  id?: number;                    // có thì update, không có thì create
  note?: string;
  receiving_day?: string;         // 'YYYY-MM-DD'
  set_date?: string;              // 'YYYY-MM-DDTHH:mm:ss'
  techniques?: TechniqueItemPayload[];
};

export type TreatmentRequestCreatePayload = {
  customer_id: number;         // ⬅️ bắt buộc
  service_id: number;
  selected_package_id: number;
  treatment_package_id: number;
  doctor_id?: number | null;
  diagnosis?: string;
  note?: string;
  sessions?: SessionPayload[];
};

export type TreatmentRequestUpsertPayload = {
  id: number;                     // ID phác đồ cần PATCH
  service_id?: number;
  treatment_package_id?: number;
  doctor_id?: number | null;
  diagnosis?: string;
  note?: string;
  selected_package_id?: number;
  discount_id?: number | null; 
  sessions?: SessionPayload[];    // chứa cả buổi cũ (có id) & buổi mới (không id)
};

export type MarkComeBody = {
  item_id: number;
  has_come: boolean;
};

export type BillMethod = "cash" | "transfer";

export type CreateBillPayload = {
  customer: number;            // ⬅️ bắt buộc
  method?: BillMethod;         // default: "cash"
  paid_ammount?: number | string; // đúng chính tả backend: paid_ammount
  note?: string;
};

export type Bill = {
  id: number;
  code: string;
  created: string;             // ISO datetime
  user?: number | null;
  customer: number | { id: number; full_name?: string } | null;
  method: BillMethod;
  paid_ammount: string;        // DRF Decimal -> string
  note?: string | null;
  fully_paid: boolean;
};

// 1) Thêm type cho response
export type CustomerBillSummary = {
  ma_kh: string | null;                    // Customer.code
  ho_ten: string | null;                   // Customer.name
  cac_loai_dich_vu_su_dung: string[];      // ['phác đồ','đơn thuốc','xuất vật tư',...]
  so_tien_da_thanh_toan: string;           // tổng PaymentHistory.paid_amount (string để giữ format Decimal)
  lan_thanh_toan_gan_nhat: string | null;  // ISO datetime hoặc null
};

// 2) Thêm query params type (tái dụng filter của Bill + filter thời gian thanh toán)
export type GetBillCustomersSummaryParams = {
  // filter Bill hiện đang có (nếu bạn dùng ở BillViewSet.get_queryset):
  page?: number;            // optional, không bắt buộc cho summary
  pageSize?: number;        // optional
  startDate?: string;       // lọc theo ngày của Bill (vd '2025-09-01')
  endDate?: string;
  searchTerm?: string;
  customer?: number | string;
  // ... tùy backend BillViewSet có hỗ trợ params gì thì thêm nấy

  // filter thêm cho PaymentHistory:
  paymentStart?: string;    // lọc theo ngày thanh toán
  paymentEnd?: string;
};


export type CustomerBillDetail = {
  type: string;           // Loại hóa đơn
  method: string;         // Phương thức thanh toán
  amount: string;         // string để giữ Decimal
  created: string;        // ISO
};

export type GetCustomerBillsDetailParams = {
  customer_id?: number | string;      // nếu bạn có id
  customer_code?: string;             // ma_kh từ summary
  startDate?: string;
  endDate?: string;
};
