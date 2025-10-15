"use client";
import React, { useMemo } from "react";
import { Row, Col, Table, Form, Spin, Empty, Collapse } from "antd";
import type { ColumnsType } from "antd/es/table";

import { useGetEmployeeListQuery } from "@/api/app_hr/apiHR";
import { useGetServiceListQuery } from "@/api/app_product/apiService";
import { useGetTreatmentRequestsQuery } from "@/api/app_treatment/apiTreatment";
import TreatmentInfoForm from "./TreatmentInfoForm";
import dayjs from "dayjs";

type TechniqueLite = { id: number; name: string; duration_min?: number };

type Props = {
  /** Để lấy phác đồ theo khách hàng */
  customerId?: string | null;
  /** (Tuỳ chọn) Nếu truyền, sẽ ưu tiên mở panel phác đồ có id này */
  treatmentRequestId?: number;
};

/* ---------- Panel con: render 1 phác đồ (read-only) ---------- */
function ReceptionPlanPanel({
  tr,
  empOptions,
  services,
  empLoading,
  serviceLoading,
}: {
  tr: any;
  empOptions: { value: any; label: string }[];
  services: Array<{
    id: number;
    name: string;
    type?: string;
    packages: Array<{ id: number; name: string }>;
    techniques: TechniqueLite[];
  }>;
  empLoading: boolean;
  serviceLoading: boolean;
}) {
  const [form] = Form.useForm();
  const selectedServiceId: number | undefined = Form.useWatch(
    "service_id",
    form
  );

  // Tìm service và package tương ứng
  const currentService = useMemo(
    () => services.find((s) => s.id === tr?.service?.id),
    [services, tr?.service?.id]
  );
  const packageOptions = useMemo(
    () =>
      (currentService?.packages ?? []).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [currentService]
  );

  // Prefill form (read-only)
  React.useEffect(() => {
    if (!tr) return;
    form.setFieldsValue({
      doctor_id: tr?.doctor_id ?? undefined,
      diagnosis: tr?.diagnosis ?? "",
      note: tr?.note ?? "",
      treatment_type: tr?.service?.type ?? undefined,
      service_id: tr?.service?.id ?? undefined,
      package_id: tr?.treatment_package_id ?? undefined,
    });
  }, [tr, form]);

  React.useEffect(() => {
    const svcId = selectedServiceId ?? form.getFieldValue("service_id");
    if (!svcId || !services.length) return;

    const svc = services.find((s) => s.id === Number(svcId));
    if (svc?.type) {
      const curType = form.getFieldValue("treatment_type");
      if (curType !== svc.type) {
        form.setFieldsValue({ treatment_type: svc.type });
      }
    }
  }, [services, selectedServiceId, form]);

  // Bảng kỹ thuật của service
  const columns: ColumnsType<any> = [
    { title: "STT", dataIndex: "index", width: 80, align: "center" },
    { title: "Các kỹ thuật trong gói", dataIndex: "name" },
    {
      title: "Thời gian thực hiện",
      dataIndex: "duration_minutes",
      width: 180,
      align: "center",
      render: (v) => (v ? `${v} phút` : "-"),
    },
  ];
  const tableData = (currentService?.techniques ?? []).map(
    (t: TechniqueLite, i: number) => ({
      key: t.id ?? `${t.name}-${i}`,
      index: i + 1,
      name: t.name,
      duration_min: t.duration_min,
    })
  );

  // Constant options
  const TREATMENT_TYPES = [
    { value: "TLDS", label: "Trị liệu dưỡng sinh" },
    { value: "TLCB", label: "Trị liệu chữa bệnh" },
  ];
  const serviceOptions = React.useMemo(
    () => services.map((s) => ({ value: s.id, label: s.name })),
    [services]
  );

  return (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <TreatmentInfoForm
          form={form}
          technicianOptions={empOptions}
          treatmentTypeOptions={TREATMENT_TYPES}
          serviceOptions={serviceOptions}
          packageOptions={packageOptions}
          selectedType={tr?.service?.type}
          selectedServiceId={tr?.service?.id}
          empLoading={empLoading}
          serviceLoading={serviceLoading}
          // Read-only: khoá thay đổi trên UI (tuỳ implementation của bạn có prop disabled hay không)
          // Nếu form của bạn chưa có prop disabled, có thể giữ nguyên – vì đây là màn xem.
          onChangeType={() => {}}
          onChangeService={() => {}}
        />
      </Col>
      <Col xs={24} md={12}>
        <Table
          bordered
          size="middle"
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 10 }}
        />
      </Col>
    </Row>
  );
}

/* ---------- Trang lễ tân: danh sách phác đồ dạng panel ---------- */
export default function TreatmentPlanReceptionSmart({
  customerId,
  treatmentRequestId,
}: Props) {
  /* Employees */
  const { data: empData, isLoading: empLoading } = useGetEmployeeListQuery({
    page: 1,
    pageSize: 200,
    searchTerm: "",
    startDate: "",
    endDate: "",
    format: "",
    department: "",
  });
  const technicianOptions = useMemo(
    () =>
      (empData?.results ?? []).map((e: any) => ({
        value: e?.user,
        label: `${e?.employee_code ?? e?.user ?? ""} - ${
          e?.full_name?.full_name ?? "Không rõ tên"
        }`,
      })),
    [empData]
  );

  /* Services (packages/techniques) */
  const { data: serviceResp, isLoading: serviceLoading } =
    useGetServiceListQuery({
      page: 1,
      pageSize: 1000,
      searchTerm: "",
    });
  const allServices = useMemo(
    () =>
      (serviceResp?.results ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
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
          duration_min: t.duration_minutes ?? t.duration_min,
        })) as TechniqueLite[],
      })),
    [serviceResp]
  );

  /* Treatment Requests */
  const cid = customerId ? Number(customerId) : undefined;
  const { data: trData, isFetching: trFetching } = useGetTreatmentRequestsQuery(
    { customer_id: cid, page: 1, pageSize: 50 },
    { skip: !cid }
  );

  if (!cid) return <Empty description="Thiếu customerId để tải phác đồ" />;
  if (trFetching) return <Spin />;

  const list = trData?.results ?? [];
  if (!list.length)
    return <Empty description="Chưa có phác đồ nào cho khách hàng này" />;

  // Sắp xếp mới nhất lên trước (nếu backend chưa sắp)
  const sorted = [...list].sort(
    (a: any, b: any) =>
      new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf()
  );

  const items = sorted.map((tr: any, idx: number) => {
    const createdStr = tr.created_at
      ? dayjs(tr.created_at).format("DD/MM/YYYY - HH:mm")
      : "";
    const ordinal = idx + 1;
    return {
      key: String(tr.id),
      label: (
        <span className="font-semibold">
          {`Phác đồ đã lưu #${ordinal}`}
          {createdStr ? (
            <span className="text-gray-500 ml-2">· {createdStr}</span>
          ) : null}
        </span>
      ),
      children: (
        <div className="mt-2">
          <ReceptionPlanPanel
            tr={tr}
            empOptions={technicianOptions}
            services={allServices}
            empLoading={empLoading}
            serviceLoading={serviceLoading}
          />
        </div>
      ),
    };
  });

  // Panel mặc định: ưu tiên treatmentRequestId, nếu không mở panel đầu
  const defaultActiveKey =
    (treatmentRequestId && String(treatmentRequestId)) ||
    (items.length ? items[0].key : undefined);

  return (
    <section className="relative rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="absolute inset-x-0 top-0 h-14 rounded-t-2xl bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />
      <div className="relative p-4 md:p-6">
        <Collapse
          bordered={false}
          items={items}
          defaultActiveKey={defaultActiveKey}
        />
      </div>
    </section>
  );
}
