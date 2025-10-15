export type DiagnosisMedicineDTO = {
  id: number;
  doctor_process: number;
  product: number;
  quantity: number;
  unit: number;
  dose: string | null;
  note: string | null;
  price: number | string;
  booking_id?: number;
  customer_id?: number;
  doctor_id?: number;
};

export type RowItem = {
  id?: number;
  productId?: number;
  productName?: string;
  quantity: number;
  unit?: string;
  dosage?: string;
  note?: string;
  price?: number;
};

export type ProductOption = {
  value: number;
  label: string;
  unit_name?: string;
  sell_price?: number;
};

export type DiscountOption = {
  value: number;
  label: string;
  type: "percentage" | "amount";
  rate: number;
};

export type PrescriptionFormProps = {
  role: "receptionist" | "doctor";
  customerId?: string | null;
  initial?: DiagnosisMedicineDTO[] | null;
  initialDoctorUserId?: number | null;
  serverSubtotal?: number;
  serverFinalAmount?: number;
  initialDiscountId?: number;
  customerName?: string;
  employeeName?: string;
  note?: string;
  onSubmit: (payload: {
    doctor_id: number;
    items: Array<{
      id?: number;
      product: number;
      quantity: number;
      dose?: string;
      note?: string;
      price?: number | string;
    }>;
    medicine_discount?: number | undefined;
  }) => Promise<any>;
  submitting?: boolean;
  submitText?: string;
};
