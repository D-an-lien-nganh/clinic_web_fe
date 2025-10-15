"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Typography, Spin, message } from "antd";
import {
  useGetDoctorProcessDetailQuery,
  useEditDoctorProcessMutation,
  useCreateDoctorProcessMutation,
} from "@/api/app_treatment/apiTreatment";
import PrescriptionForm from "../CustomerInfomation/Prescription/PrescriptionForm";
import { DiagnosisMedicineDTO } from "../CustomerInfomation/Prescription/types";

const { Text } = Typography;

type Props = {
  open: boolean;
  /** id của doctorprocess cần xem/sửa */
  doctorProcessId?: number | null;
  /** receptionist | doctor (ảnh hưởng hiển thị cột tiền/khuyến mãi trong Form) */
  role?: "receptionist" | "doctor";
  customerId?: number | null;
  onCancel: () => void;
};

export default function PrescriptionInvoiceModal({
  open,
  doctorProcessId,
  role = "receptionist",
  onCancel,
}: Props) {
  const skip = !open || !doctorProcessId;
  const { data, isFetching } = useGetDoctorProcessDetailQuery(
    Number(doctorProcessId),
    { skip }
  );
  const [employeeName, setEmployeeName] = useState("");
  
  useEffect(() => {
    // Chỉ chạy trên client-side
    if (typeof window !== "undefined") {
      try {
        const employeeRaw = localStorage.getItem("user");
        if (employeeRaw) {
          const employee = JSON.parse(employeeRaw);
          const fullName = `${employee.first_name || ""} ${
            employee.last_name || ""
          }`.trim();
          setEmployeeName(fullName);
        }
      } catch (e) {
        console.error("Parse user error:", e);
      }
    }
  }, []);

  const [editDP, { isLoading: isSavingEdit }] = useEditDoctorProcessMutation();
  const [createDP, { isLoading: isSavingCreate }] =
    useCreateDoctorProcessMutation();

  // Map data chi tiết sang initial cho PrescriptionForm
  const initialMedicines: DiagnosisMedicineDTO[] = useMemo(() => {
    const list = (data?.diagnosis_medicines ?? []) as any[];
    return list.map((it) => ({
      id: Number(it?.id),
      doctor_process: Number(it?.doctor_process ?? doctorProcessId ?? 0),
      product: Number(it?.product),
      quantity: Number(it?.quantity ?? 1),
      unit: Number(it?.unit ?? 0),
      dose: it?.dose ?? null,
      note: it?.note ?? null,
      price: Number(it?.price ?? 0),
      booking_id: it?.booking_id ? Number(it.booking_id) : undefined,
      customer_id: it?.customer_id ? Number(it.customer_id) : undefined,
      doctor_id: it?.doctor_id ? Number(it.doctor_id) : undefined,
    }));
  }, [data, doctorProcessId]);

  const initialDoctorUserId = useMemo(() => {
    // ưu tiên field đồng nhất: data.doctor?.user || data.doctor_user_id || data.assigned_doctor?.user
    const v =
      data?.doctor?.user ??
      data?.doctor_user_id ??
      data?.assigned_doctor?.user ??
      data?.doctor_id; // fallback
    return v != null ? Number(v) : null;
  }, [data]);

  const notes = (data?.diagnosis_medicines || [])
    .map((m: any, idx: any) => (m.note ? `${idx + 1}. ${m.note}` : null))
    .filter(Boolean)
    .join(", ");

  const submitting = isSavingEdit || isSavingCreate;
  const customerId = data?.customer?.id ?? data?.customer_id ?? null;

  const serverSubtotal = Number(data?.total_amount ?? 0);
  const serverFinal = Number(data?.total_after_discount);

  const handleSubmit = async (payload: {
    doctor_id: number;
    items: Array<{
      id?: number;
      product: number;
      quantity: number;
      dose?: string;
      note?: string;
      price?: number | string;
    }>;
    medicine_discount?: number;
  }) => {
    try {
      if (doctorProcessId) {
        // UPDATE
        await editDP({
          id: Number(doctorProcessId),
          data: {
            doctor_id: payload.doctor_id,
            diagnosis_medicines: payload.items,
            medicine_discount: payload.medicine_discount,
          },
          // deleteMissing: true, // nếu endpoint của bạn hỗ trợ
        }).unwrap();
        message.success("Cập nhật đơn thuốc thành công.");
      } else {
        // CREATE
        await createDP({
          data: {
            customer_id: Number(customerId ?? 0),
            doctor_id: payload.doctor_id,
            diagnosis_medicines: payload.items,
          },
        }).unwrap();
        message.success("Tạo đơn thuốc thành công.");
      }
      onCancel();
    } catch (e: any) {
      message.error(e?.data?.detail || "Lưu đơn thuốc thất bại.");
    }
  };

  return (
    <Modal
      title={
        <div className="flex flex-col">
          <Text strong>Hóa đơn / Đơn thuốc</Text>
          {doctorProcessId ? (
            <Text type="secondary">Mã đơn: #{doctorProcessId}</Text>
          ) : null}
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={980}
      destroyOnClose
    >
      {isFetching ? (
        <div className="py-10 flex items-center justify-center">
          <Spin />
        </div>
      ) : (
        <PrescriptionForm
          role={role}
          customerId={data?.customer_details?.code || ""}
          initial={initialMedicines}
          initialDoctorUserId={initialDoctorUserId}
          serverSubtotal={serverSubtotal}
          serverFinalAmount={serverFinal}
          initialDiscountId={data?.medicine_discount ?? undefined}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitText="Lưu đơn thuốc"
          customerName={data?.customer_details?.name || ""}
          employeeName={employeeName || ""}
          note={notes || ""}
        />
      )}
    </Modal>
  );
}
