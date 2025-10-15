"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Collapse, Empty, message, Spin } from "antd";
import type { CollapseProps } from "antd";

import {
  useGetDoctorProcessListQuery,
  useCreateDoctorProcessMutation,
  useEditDoctorProcessMutation,
} from "@/api/app_treatment/apiTreatment";

import PrescriptionForm from "./Prescription/PrescriptionForm";
import { DiagnosisMedicineDTO } from "./Prescription/types";

type Props = {
  customerId: string;
  role: "receptionist" | "doctor";
  /** Nếu cần gửi kèm khi lưu */
  defaultClinicalExaminationId?: number;
  /** Handler để nút ngoài Tabs gọi “thêm đơn thuốc mới” */
  registerAddHandler?: (fn: (() => void) | undefined) => void;
};

type DoctorProcessDTO = {
  id: number;
  doctor_id?: number | null;
  assigned_doctor_name?: string | null;
  clinical_examination_details?: {
    id: number;
    customer_name: string;
    department?: string | null;
  } | null;
  diagnosis_medicines?: DiagnosisMedicineDTO[];
  start_time?: string | null;
  end_time?: string | null;
};

export default function PrescriptionPanelList({
  customerId,
  role,
  registerAddHandler,
  defaultClinicalExaminationId,
}: Props) {
  const { data, isLoading, refetch } = useGetDoctorProcessListQuery(
    { customer_id: Number(customerId), page: 1, pageSize: 50 },
    { skip: !customerId }
  );

  const processes: DoctorProcessDTO[] = useMemo(
    () => (data?.results ?? data ?? []) as DoctorProcessDTO[],
    [data]
  );

  const [createProcess, { isLoading: creating }] =
    useCreateDoctorProcessMutation();
  const [updateProcess, { isLoading: updating }] =
    useEditDoctorProcessMutation();

  // =========================
  // Config FE -> BE field map
  // Đổi "assigned_doctor" thành "assigned_doctor_id" nếu BE nhận _id.
  const DOCTOR_FIELD_KEY = "doctor_id";
  // =========================

  // Panels "đơn mới" (nháp local)
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const addNewPanel = () =>
    setNewKeys((prev) => [...prev, `new-${Date.now()}`]);

  // Đăng ký handler cho nút ngoài Tabs
  useEffect(() => {
    registerAddHandler?.(addNewPanel);
    return () => registerAddHandler?.(undefined);
  }, [registerAddHandler]);

  // Chỉ bootstrap 1 lần: nếu danh sách rỗng => tạo panel nháp (không gọi API)
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (bootstrappedRef.current) return;

    const noServerItems = (processes?.length ?? 0) === 0;
    const noLocalDrafts = newKeys.length === 0;

    if (noServerItems && noLocalDrafts) {
      bootstrappedRef.current = true;
      addNewPanel();
    }
  }, [isLoading, processes?.length, newKeys.length]);

  // Lưu panel nháp => API create
  const handleCreate = async (
    payload: { doctor_id: number; items: any[] },
    key: string
  ) => {
    try {
      await createProcess({
        customer_id: Number(customerId),
        clinical_examination_id: defaultClinicalExaminationId,
        diagnosis_medicines: payload.items,
        [DOCTOR_FIELD_KEY]: Number(payload.doctor_id), // gửi bác sĩ
      }).unwrap();

      message.success("Tạo đơn thuốc (DoctorProcess) thành công");
      setNewKeys((prev) => prev.filter((k) => k !== key));
      refetch();
    } catch (err: any) {
      message.error(
        err?.data?.detail || err?.data?.error || "Tạo DoctorProcess thất bại"
      );
    }
  };

  // Cập nhật đơn đã có
  const handleUpdate = async (
    processId: number,
    payload: { doctor_id: number; items: any[] }
  ) => {
    try {
      const currentProcess = processes.find((p) => p.id === processId);
      const currentIds = new Set(
        (currentProcess?.diagnosis_medicines ?? []).map((x) => x.id)
      );

      // Lọc ra các item đã bị xóa (không còn trong payload.items)
      const cleanedItems = payload.items.map((it: any) =>
        currentIds.has(Number(it.id)) ? it : { ...it, id: undefined }
      );

      await updateProcess({
        id: processId,
        data: {
          diagnosis_medicines: cleanedItems,
          [DOCTOR_FIELD_KEY]: Number(payload.doctor_id),
        },
        deleteMissing: true, // Quan trọng: xóa các item không còn trong payload
      }).unwrap();

      message.success("Cập nhật đơn thuốc thành công");
      refetch(); // Làm mới dữ liệu
    } catch (err: any) {
      message.error(
        err?.data?.detail ||
          err?.data?.error ||
          "Cập nhật DoctorProcess thất bại"
      );
    }
  };

  // Render panels
  const items: CollapseProps["items"] = [
    ...processes.map((p) => {
      const meds = (p.diagnosis_medicines ?? []) as DiagnosisMedicineDTO[];
      const total = meds.reduce(
        (s, it) => s + Number(it.price || 0) * (it.quantity || 0),
        0
      );
      const doctorName = p.assigned_doctor_name ?? "—";

      return {
        key: String(p.id),
        label:
          `Đơn thuốc #${p.id} • Bác sĩ: ${doctorName}` +
          (role === "receptionist" ? ` • Tổng: ${total.toLocaleString()}` : ""),
        children: (
          <PrescriptionForm
            role={role}
            customerId={customerId}
            initial={meds}
            initialDoctorUserId={p.doctor_id ?? null}
            onSubmit={(payload) => handleUpdate(p.id, payload)}
            submitting={updating}
            submitText="Cập nhật đơn"
          />
        ),
      };
    }),

    // Panel "nháp" (local) — chỉ gọi API khi bấm Lưu
    ...newKeys.map((key) => ({
      key,
      label: "Đơn thuốc mới",
      children: (
        <PrescriptionForm
          role={role}
          customerId={customerId}
          initial={null}
          initialDoctorUserId={null}
          onSubmit={(payload) => handleCreate(payload, key)}
          submitting={creating}
          submitText="Lưu tạo mới"
        />
      ),
    })),
  ];

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : processes.length === 0 && newKeys.length === 0 ? (
        // Trường hợp hiếm (state bị clear)
        <Empty description="Chưa có đơn thuốc" />
      ) : (
        <Collapse items={items} accordion={false} />
      )}
    </div>
  );
}
