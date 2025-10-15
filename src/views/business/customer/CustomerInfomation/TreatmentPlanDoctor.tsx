"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, message, Typography } from "antd";
import dayjs from "dayjs";

import { useGetEmployeeListQuery } from "@/api/app_hr/apiHR";
import { useGetServiceListQuery } from "@/api/app_product/apiService";

import {
  useCreateTreatmentRequestMutation,
  useUpdateTreatmentRequestMutation,
  useDeleteSessionTechSettingMutation,
  useMarkComeMutation,
} from "@/api/app_treatment/apiTreatment";
import {
  TreatmentRequestCreatePayload,
  TreatmentRequestUpsertPayload,
} from "@/api/app_treatment/type";
import TreatmentSessions, {
  ServicePkg,
  Session,
  SessionItem,
} from "./Treatment/TreatmentSessions";
import TreatmentInfoForm from "./Treatment/TreatmentInfoForm";
import TechniquesTable, { Technique } from "./Treatment/TechniquesTable";

const { Text } = Typography;

/* ========= Shared types ========= */
type ServiceLite = {
  id: number;
  name: string;
  code: string;
  type: string; // "TLDS" | "TLCB" ...
  packages: ServicePkg[];
  techniques: Technique[];
};

export type ServerTR = {
  id: number;
  diagnosis?: string;
  note?: string;
  service?: { id: number; name: string; type?: string };
  treatment_package_id?: number;
  doctor_id?: number;
  created_at?: string;
  selected_package_id?: number;
  treatment_sessions?: Array<{
    id: number;
    index_no: number;
    note?: string;
    receiving_day?: string;
    set_date?: string;
    techniques: Array<{
      id: number;
      techical_setting_id: number;
      duration_minutes?: number;
      room?: string | null;
      has_come?: boolean;
      experts?: Array<{ id: number; full_name: string }>;
    }>;
  }>;
};

type Props = {
  customerId?: string | null;
  initialData?: ServerTR;
  onSaved?: () => void;
  role?: "receptionist" | "doctor";
};

/* ========= Constants ========= */
const TREATMENT_TYPES = [
  { value: "TLDS", label: "Trị liệu dưỡng sinh" },
  { value: "TLCB", label: "Trị liệu chữa bệnh" },
];

export default function TreatmentPlanDoctor({
  customerId,
  initialData,
  onSaved,
  role,
}: Props) {
  const [form] = Form.useForm();

  // Kiểm tra quyền chỉnh sửa
  const isDoctor = role === "doctor";

  // Helper function để kiểm tra quyền trước khi thực hiện thay đổi
  const checkPermission = () => {
    console.log("isDoctor", isDoctor);
    if (!isDoctor) {
      message.warning("Chỉ bác sĩ mới có quyền chỉnh sửa");
      return false;
    }
    return true;
  };

  /* ===== Employees (bác sĩ/kỹ thuật viên) ===== */
  const { data: empData, isLoading: empLoading } = useGetEmployeeListQuery({
    page: 1,
    pageSize: 200,
    searchTerm: "",
    startDate: "",
    endDate: "",
    format: "",
    department: "",
  });

  const employeeOptions = useMemo(
    () =>
      (empData?.results ?? [])
        .filter((e: any) => String(e?.type || "").toLowerCase() === "employee")
        .map((e: any) => {
          const typeVal = String(
            e?.type ?? e?.employee_type ?? e?.employeeType
          ).toLowerCase();
          const label = `${e?.full_name ?? "Không rõ tên"}${
            e?.position?.department_name ?? e?.department ?? e?.position?.title
              ? ` — ${
                  e?.position?.department_name ??
                  e?.department ??
                  e?.position?.title
                }`
              : ""
          }`;

          return {
            value: Number(e?.id),
            label,
            typeVal,
          };
        }),
    [empData]
  );

  const collaboratorOptions = useMemo(
    () =>
      (empData?.results ?? [])
        .filter(
          (e: any) => String(e?.type || "").toLowerCase() === "employee"
        )
        .map((e: any) => ({
          value: e?.id,
          label: `${e?.full_name} - ${e?.code ?? "Không rõ tên"}`,
        })),
    [empData]
  );

  /* ===== Services (lọc theo loại + packages/techniques) ===== */
  const { data: serviceResp, isLoading: serviceLoading } =
    useGetServiceListQuery({
      page: 1,
      pageSize: 1000,
      searchTerm: "",
    });

  const allServices: ServiceLite[] = useMemo(
    () =>
      (serviceResp?.results ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        type: s.type,
        packages: (s.treatment_packages_info ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price ?? 0),
          duration: p.duration,
          note: p.note,
        })),
        techniques: (s.technical_settings_info ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
        })),
      })),
    [serviceResp]
  );

  /* ===== Form watchers ===== */
  const selectedType: string | undefined = Form.useWatch(
    "treatment_type",
    form
  );
  const selectedServiceId: number | undefined = Form.useWatch(
    "service_id",
    form
  );
  const selectedPackageId: number | undefined = Form.useWatch(
    "selected_package_id",
    form
  );

  const servicesByType = useMemo(
    () =>
      selectedType
        ? allServices.filter((s) => s.type === selectedType)
        : allServices,
    [selectedType, allServices]
  );

  const serviceOptions = useMemo(
    () => servicesByType.map((s) => ({ value: s.id, label: s.name })),
    [servicesByType]
  );

  const selectedService = useMemo(
    () => allServices.find((s) => s.id === selectedServiceId),
    [allServices, selectedServiceId]
  );

  const packageOptions = useMemo(
    () =>
      (selectedService?.packages ?? []).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [selectedService]
  );

  const selectedPackage = useMemo(
    () => selectedService?.packages.find((p) => p.id === selectedPackageId),
    [selectedService, selectedPackageId]
  );

  const techniqueOptions = useMemo(
    () =>
      (selectedService?.techniques ?? []).map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [selectedService]
  );

  /* ===== Sessions state (mặc định 1 buổi) ===== */
  const makeItem = (): SessionItem => ({
    id: Date.now() + Math.random(),
    attended: false,
    durationMin: 10,
  });

  const makeSession = (): Session => ({
    id: Date.now() + Math.random(),
    appointment: null,
    items: [makeItem()],
  });

  const [sessions, setSessions] = useState<Session[]>([makeSession()]);

  const addSession = () => {
    if (!checkPermission()) return;
    setSessions((prev) => [...prev, makeSession()]);
  };

  const setSession = (sid: number, patch: Partial<Session>) => {
    if (!checkPermission()) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === sid ? { ...s, ...patch } : s))
    );
  };

  const addItem = (sid: number) => {
    if (!checkPermission()) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sid ? { ...s, items: [...s.items, makeItem()] } : s
      )
    );
  };

  const removeItemLocal = (sid: number, itemId: number) => {
    if (!checkPermission()) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sid
          ? { ...s, items: s.items.filter((x) => x.id !== itemId) }
          : s
      )
    );
  };

  const setItem = (sid: number, itemId: number, patch: Partial<SessionItem>) => {
    if (!checkPermission()) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sid
          ? {
              ...s,
              items: s.items.map((it) =>
                it.id === itemId ? { ...it, ...patch } : it
              ),
            }
          : s
      )
    );
  };

  /* ===== Handlers top dropdowns ===== */
  const onChangeType = () => {
    if (!checkPermission()) return;
    form.setFieldsValue({
      service_id: undefined,
      selected_package_id: undefined,
    });
  };

  const onChangeService = () => {
    if (!checkPermission()) return;
    form.setFieldsValue({ selected_package_id: undefined });
  };

  /* ===== API hooks ===== */
  const [createTR, { isLoading: creating }] =
    useCreateTreatmentRequestMutation();
  const [updateTR, { isLoading: updating }] =
    useUpdateTreatmentRequestMutation();
  const [markCome] = useMarkComeMutation();
  const [deleteItem] = useDeleteSessionTechSettingMutation();

  /* ===== Prefill khi EDIT ===== */
  useEffect(() => {
    if (!initialData) return;

    form.setFieldsValue({
      selected_package_id: initialData?.selected_package_id ?? undefined,
      doctor_id: initialData?.doctor_id ?? undefined,
      diagnosis: initialData?.diagnosis ?? "",
      note: initialData?.note ?? "",
      treatment_type: initialData?.service?.type ?? undefined,
      service_id: initialData?.service?.id ?? undefined,
      package_id: initialData?.treatment_package_id ?? undefined,
    });

    const srvSessions: Session[] = (initialData?.treatment_sessions ?? []).map(
      (s) => {
        const appointment =
          s.receiving_day && s.set_date
            ? dayjs(`${s.receiving_day} ${s.set_date}`, "YYYY-MM-DD HH:mm:ss")
            : s.receiving_day
            ? dayjs(s.receiving_day, "YYYY-MM-DD").hour(9).minute(0).second(0)
            : s.set_date
            ? dayjs(s.set_date, "HH:mm:ss")
            : null;

        return {
          id: Date.now() + Math.random(),
          serverId: s.id,
          appointment,
          items: s.techniques.map((t) => ({
            id: Date.now() + Math.random(),
            serverId: t.id,
            technicianId: t.experts?.[0]?.id ?? undefined,
            techniqueId: t.techical_setting_id,
            durationMin: t.duration_minutes ?? 10,
            room: t.room ?? undefined,
            attended: !!t.has_come,
            _saved: true,
          })),
        };
      }
    );

    setSessions(srvSessions.length ? srvSessions : [makeSession()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    const svcId = form.getFieldValue("service_id");
    if (!svcId || !allServices.length) return;

    const svc = allServices.find((s) => s.id === svcId);
    if (svc?.type) {
      const curType = form.getFieldValue("treatment_type");
      if (curType !== svc.type) {
        form.setFieldsValue({ treatment_type: svc.type });
      }
    }
  }, [allServices, form, selectedServiceId]);

  /* ===== Helpers ===== */
  const toIsoDate = (d?: dayjs.Dayjs | null) =>
    d ? d.format("YYYY-MM-DD") : undefined;
  const toIsoDateTime = (d?: dayjs.Dayjs | null) =>
    d ? d.format("YYYY-MM-DDTHH:mm:ss") : undefined;

  const buildCreateBody = (): TreatmentRequestCreatePayload => {
    const fv = form.getFieldsValue();
    return {
      selected_package_id: fv.selected_package_id,
      customer_id: Number(customerId),
      service_id: fv.service_id,
      treatment_package_id: fv.selected_package_id,
      doctor_id: fv.doctor_id,
      diagnosis: fv.diagnosis,
      note: fv.note,
      sessions: sessions.map((s, idx) => ({
        note: `Buổi ${idx + 1}`,
        receiving_day: toIsoDate(s.appointment),
        set_date: toIsoDateTime(s.appointment),
        techniques: s.items.map((it) => ({
          techical_setting_id: it.techniqueId!,
          expert_ids: it.technicianId ? [it.technicianId] : [],
          duration_minutes: it.durationMin ?? 10,
          room: it.room ?? null,
          has_come: !!it.attended,
        })),
      })),
    };
  };

  const buildUpdateBody = (id: number): TreatmentRequestUpsertPayload => {
    const fv = form.getFieldsValue();
    return {
      id,
      selected_package_id: fv.selected_package_id,
      service_id: fv.service_id,
      treatment_package_id: fv.selected_package_id,
      doctor_id: fv.doctor_id,
      diagnosis: fv.diagnosis,
      note: fv.note,
      sessions: sessions.map((s, idx) => ({
        id: s.serverId,
        note: `Buổi ${idx + 1}`,
        receiving_day: toIsoDate(s.appointment),
        set_date: toIsoDateTime(s.appointment),
        techniques: s.items.map((it) => ({
          id: it.serverId,
          techical_setting_id: it.techniqueId,
          expert_ids: it.technicianId ? [it.technicianId] : [],
          duration_minutes: it.durationMin ?? 10,
          room: it.room ?? null,
          has_come: !!it.attended,
        })),
      })),
    };
  };

  /* ===== Actions ===== */
  const onSaveAll = async () => {
    if (!checkPermission()) return;

    try {
      await form.validateFields();
      if (!customerId) return message.error("Thiếu customerId");
      if (!form.getFieldValue("service_id"))
        return message.error("Chọn dịch vụ");
      if (!form.getFieldValue("selected_package_id"))
        return message.error("Chọn liệu trình");

      // UPDATE
      if (initialData?.id) {
        const body = buildUpdateBody(initialData.id);
        await updateTR(body).unwrap();
        message.success("Cập nhật phác đồ thành công");
        onSaved?.();
        return;
      }

      await createTR(buildCreateBody()).unwrap();
      message.success("Tạo phác đồ thành công");
      form.resetFields(["diagnosis", "note"]);
      setSessions([makeSession()]);
      onSaved?.();
    } catch (e: any) {
      message.error(
        e?.data?.detail || e?.data?.error || "Không thể lưu phác đồ"
      );
    }
  };

  const onToggleAttended = async (
    s: Session,
    it: SessionItem,
    checked: boolean
  ) => {
    if (!checkPermission()) return;

    if (s.serverId && it.serverId) {
      try {
        await markCome({
          sessionId: s.serverId,
          body: { item_id: it.serverId, has_come: checked },
        }).unwrap();
        message.success("Cập nhật trạng thái thành công");
        setItem(s.id, it.id, { attended: checked, _saved: true });
      } catch {
        message.error("Cập nhật trạng thái không thành công");
      }
    } else {
      setItem(s.id, it.id, { attended: checked });
    }
  };

  const onDeleteItem = async (s: Session, it: SessionItem) => {
    if (!checkPermission()) return;

    if (s.serverId && it.serverId) {
      try {
        await deleteItem({
          session_id: s.serverId,
          item_id: it.serverId,
        }).unwrap();
        removeItemLocal(s.id, it.id);
        message.success("Xoá kỹ thuật thành công");
      } catch {
        message.error("Xoá item không thành công");
      }
    } else {
      removeItemLocal(s.id, it.id);
    }
  };

  /* ===== Render ===== */
  return (
    <div className="space-y-6">
      {/* (1) Thông tin phác đồ */}
      <TreatmentInfoForm
        form={form}
        technicianOptions={employeeOptions}
        treatmentTypeOptions={TREATMENT_TYPES}
        serviceOptions={serviceOptions}
        packageOptions={packageOptions}
        selectedType={selectedType}
        selectedServiceId={selectedServiceId}
        empLoading={empLoading}
        serviceLoading={serviceLoading}
        onChangeType={onChangeType}
        onChangeService={onChangeService}
        disabled={!isDoctor}
      />

      {/* Hàng thứ 2: 2 cột */}
      <Row gutter={16}>
        {/* (2) Bảng kỹ thuật trong gói */}
        <Col xs={24} md={7}>
          <TechniquesTable
            techniques={selectedService?.techniques}
            hasServiceSelected={!!selectedService}
          />
        </Col>

        {/* (3) Phác đồ dịch vụ */}
        <Col xs={24} md={17}>
          <TreatmentSessions
            sessions={sessions}
            selectedPackage={selectedPackage}
            selectedService={selectedService}
            technicianOptions={collaboratorOptions}
            techniqueOptions={techniqueOptions}
            addSession={addSession}
            addItem={addItem}
            setSession={setSession}
            setItem={setItem}
            removeItemLocal={removeItemLocal}
            onToggleAttended={onToggleAttended}
            onDeleteItem={onDeleteItem}
            onSaveAll={onSaveAll}
            saving={creating || updating}
            disabled={!isDoctor}
          />
        </Col>
      </Row>
    </div>
  );
}