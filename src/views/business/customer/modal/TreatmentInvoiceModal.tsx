"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  Table,
  Input,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  Button,
  Tag,
  Select,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { useGetEmployeeListQuery } from "@/api/app_hr/apiHR";
import { useGetServiceListQuery } from "@/api/app_product/apiService";
import { useGetDiscountListQuery } from "@/api/app_home/apiConfiguration"; // ✅ NEW: import API khuyến mãi
import { ServiceLite } from "../CustomerInfomation/Treatment/TreatmentSessions";
import { useTreatmentPrint } from "../CustomerInfomation/Treatment/useTreatmentPrint";
import TreatmentPrintPreview from "../CustomerInfomation/Treatment/TreatmentPrintPreview";
import { useUpdateTreatmentRequestMutation } from "@/api/app_treatment/apiTreatment";

const { Text } = Typography;

/** ====== Types phù hợp JSON backend ====== */
type Expert = { id: number; full_name: string };
type Technique = {
  id: number;
  techical_setting_id: number;
  duration_minutes?: number;
  room?: string | null;
  has_come?: boolean;
  experts?: Expert[];
};
type TreatmentSession = {
  id: number;
  index_no: number;
  note?: string;
  receiving_day?: string; // "YYYY-MM-DD"
  set_date?: string; // "HH:mm:ss"
  techniques: Technique[];
};

// Giữ type DiscountOption theo chuẩn bạn dùng
type DiscountOption = {
  value: number;
  label: string;
  rate?: number;
  type?: "percentage" | "fixed";
};

export type CustomerDetails = {
  id: number;
  name: string;
  code: string;
};

export type ServerTR = {
  id: number;
  code?: string;
  service?: { id: number; name: string; type?: string };
  service_name?: string;
  customer_details?: CustomerDetails;
  treatment_sessions?: TreatmentSession[];
  spent_amount?: number;
  created_at?: string;
  user?: number;
  is_done?: boolean;
  note?: string;
  discount_id?: number | null;
  doctor_name?: string;
  selected_package_id?: number | null;
  doctor_id?: number;
  diagnosis?: string;
  package_price_original?: number;
  package_price_final?: number;
};

interface TreatmentInvoiceModalProps {
  open: boolean;
  patientName?: string;
  doctorName?: string; // sẽ bị override nếu tìm được từ doctor_id
  data?: ServerTR;
  onCancel: () => void;
  /** props optional — nếu không truyền, component sẽ tự call API */
  discountOptions?: DiscountOption[];
  discLoading?: boolean;
}

/** Map code loại dịch vụ → nhãn hiển thị */
const TYPE_LABEL: Record<string, string> = {
  TLDS: "Trị liệu dưỡng sinh",
  TLCB: "Trị liệu chữa bệnh",
};

export default function TreatmentInvoiceModal({
  open,
  patientName = "Nguyễn Văn A",
  doctorName,
  data,
  onCancel,
  discountOptions: discountOptionsProp,
  discLoading: discLoadingProp,
}: TreatmentInvoiceModalProps) {
  // ===== Gọi API: Nhân viên (map doctor_id -> tên) =====
  const { data: empData } = useGetEmployeeListQuery({
    page: 1,
    pageSize: 200,
    searchTerm: "",
    startDate: "",
    endDate: "",
    format: "",
    department: "",
  });

  const {
    printing: printingTR,
    printRef: printRefTR,
    handlePrintTreatment,
    printData: printDataTR,
  } = useTreatmentPrint();

  const [updateTR, { isLoading: applying }] =
    useUpdateTreatmentRequestMutation();

  const finalPrice = data?.package_price_final ?? 0;
  const priceOriginal = data?.package_price_original ?? 0;

  /** Map user id -> tên hiển thị */
  const employeeNameByUserId = useMemo(() => {
    const list = (empData?.results ?? []) as any[];
    const map = new Map<number, string>();
    list.forEach((e: any) => {
      const id = Number(e?.user);
      const name =
        e?.full_name?.full_name ?? e?.employee_name ?? e?.email ?? `User ${id}`;
      if (Number.isFinite(id)) map.set(id, String(name));
    });
    return map;
  }, [empData]);

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

  // ===== Gọi API: Dịch vụ =====
  const { data: serviceResp } = useGetServiceListQuery({
    page: 1,
    pageSize: 1000,
    searchTerm: "",
  });

  /** Chuẩn hoá DS dịch vụ */
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

  /** Service đang được map từ data.service.id */
  const selectedService = useMemo(() => {
    if (!data?.service?.id) return undefined;
    return allServices.find((s) => Number(s.id) === Number(data.service!.id));
  }, [allServices, data?.service?.id]);

  /** Gói liệu trình từ selected_package_id thuộc service đang chọn */
  const selectedPackage = useMemo(() => {
    if (!selectedService || data?.selected_package_id == null) return undefined;
    return selectedService.packages.find(
      (p) => Number(p.id) === Number(data.selected_package_id)
    );
  }, [selectedService, data?.selected_package_id]);

  const onApplyDiscount = async () => {
    if (!data?.id) {
      message.error("Thiếu ID phác đồ để cập nhật.");
      return;
    }
    try {
      await updateTR({
        id: data.id,
        discount_id: discountId ?? null, // ✅ số dương = apply, null = bỏ KM
        // sessions: ... // nếu modal này cũng chỉnh buổi/kỹ thuật thì append
      }).unwrap();

      message.success("Đã áp dụng khuyến mãi cho phác đồ.");
    } catch (e: any) {
      const detail = e?.data?.detail || e?.data?.error;
      message.error(detail || "Áp dụng khuyến mãi thất bại.");
    }
  };

  /** Map kỹ thuật id -> tên (ưu tiên theo service hiện tại) */
  const techniqueNameById = useMemo(() => {
    const map = new Map<number, string>();
    if (selectedService) {
      selectedService.techniques.forEach((t) =>
        map.set(Number(t.id), String(t.name))
      );
    } else {
      allServices.forEach((svc) =>
        (svc.techniques ?? []).forEach((t) =>
          map.set(Number(t.id), String(t.name))
        )
      );
    }
    return map;
  }, [selectedService, allServices]);

  // ===== Header info =====
  const trCode = data?.code ? `#${data.code}` : undefined;
  const serviceTypeLabel = selectedService?.type
    ? TYPE_LABEL[selectedService.type] || selectedService.type
    : "—";
  const serviceName =
    selectedService?.name || data?.service?.name || data?.service_name || "—";

  const packageName = selectedPackage?.name || "—";
  const packagePrice = selectedPackage?.price ?? 0;

  // Tên bác sĩ
  const doctorNameResolved =
    (data?.doctor_id && employeeNameByUserId.get(Number(data.doctor_id))) ||
    doctorName ||
    "—";

  // ====== 🧾 KHUYẾN MÃI: gọi API hoặc dùng props ======
  const { data: discResp, isLoading: discLoadingApi } = useGetDiscountListQuery(
    undefined,
    {
      skip: !!discountOptionsProp, // nếu props đã truyền, bỏ qua API
    }
  );

  // Chuẩn hóa options
  const discountOptions: DiscountOption[] = useMemo(() => {
    // ưu tiên props, fallback API
    const raw = discountOptionsProp ?? discResp?.results ?? [];
    return (raw as any[]).map((d: any) => ({
      value: Number(d.id),
      label:
        d.type === "percentage"
          ? `${d.name} (${Number(d.rate ?? 0)}%)`
          : `${d.name} (${Number(d.rate ?? 0).toLocaleString()}đ)`,
      type: (d.type as "percentage" | "fixed") ?? "percentage",
      rate: Number(d.rate ?? 0),
    }));
  }, [discountOptionsProp, discResp]);

  const discLoading = discLoadingProp ?? discLoadingApi;

  // ===== Logic giá và khuyến mãi =====
  const initialPrice = useMemo(
    () => Number(data?.package_price_original ?? selectedPackage?.price ?? 0),
    [data?.package_price_original, selectedPackage?.price]
  );

  const [subtotal, setSubtotal] = useState<number>(initialPrice);
  const [discountId, setDiscountId] = useState<number | undefined>();

  // Đồng bộ khi mở modal hoặc khi dữ liệu/gói đổi
  useEffect(() => {
    setSubtotal(initialPrice);
    if (!open) setDiscountId(undefined);
  }, [initialPrice, open]);

  useEffect(() => {
    if (open) {
      // BE có thể trả null → ta clear Select (undefined)
      setDiscountId(
        data?.discount_id != null ? Number(data.discount_id) : undefined
      );
    } else {
      // đóng modal thì clear
      setDiscountId(undefined);
    }
  }, [open, data?.discount_id]);

  useEffect(() => {
    setSubtotal(packagePrice);
  }, [packagePrice]);

  // Tính discountAmount + finalAmount
  const { discountAmount, finalAmount } = useMemo(() => {
    const disc = discountOptions.find((d) => d.value === discountId);
    if (!disc) return { discountAmount: 0, finalAmount: Math.max(subtotal, 0) };

    const rate = Number(disc.rate ?? 0);
    const amount =
      disc.type === "fixed" ? rate : Math.round((subtotal * rate) / 100); // làm tròn cho đẹp UI/print

    return {
      discountAmount: Math.min(amount, subtotal),
      finalAmount: Math.max(subtotal - amount, 0),
    };
  }, [subtotal, discountId, discountOptions]);

  // ===== Map sessions + techniques => rows Table =====
  type RowT = {
    key: string;
    stt: number;
    sessionIndex: number;
    sessionTime?: string;
    sessionNote?: string;
    techniqueName: string;
    duration: string;
    experts: string;
    hasCome: boolean;
  };

  const rows: RowT[] = useMemo(() => {
    const list = data?.treatment_sessions ?? [];
    const flattened: RowT[] = [];
    list.forEach((s) => {
      const timeStr =
        s.receiving_day || s.set_date
          ? dayjs(
              `${s.receiving_day ?? dayjs().format("YYYY-MM-DD")} ${
                s.set_date ?? "00:00:00"
              }`,
              "YYYY-MM-DD HH:mm:ss"
            ).format("DD/MM/YYYY HH:mm")
          : undefined;

      (s.techniques ?? []).forEach((t) => {
        const techName =
          techniqueNameById.get(Number(t.techical_setting_id)) ||
          `Thiết lập #${t.techical_setting_id}`;
        const expertNames =
          (t.experts ?? []).map((e) => e.full_name).join(", ") || "—";

        flattened.push({
          key: `${s.id}-${t.id}`,
          stt: flattened.length + 1,
          sessionIndex: s.index_no,
          sessionTime: timeStr,
          sessionNote: s.note,
          techniqueName: techName,
          duration: `${Number(t.duration_minutes ?? 0)} phút`,
          experts: expertNames,
          hasCome: !!t.has_come,
        });
      });
    });
    return flattened;
  }, [data, techniqueNameById]);

  // ===== In hoá đơn (đã áp dụng KM) =====
  const onPrint = React.useCallback(() => {
    handlePrintTreatment({
      clinicLogoUrl: "/THABI_LOGO-01.jpg",
      clinicName: "PHÒNG KHÁM CHUYÊN KHOA YHCT THANH BÌNH",
      clinicAddress: "Số 36 ngõ 133 Thái Hà, Phường Đống Đa, TP Hà Nội",
      clinicPhone: "0986.244.314",

      code: data?.code ? `#${data.code}` : undefined,
      issueDate: new Date().toISOString(),

      doctorName: data?.doctor_name || doctorNameResolved,
      customerName: data?.customer_details?.name || "",
      employeeName: employeeName || "",

      subtotal: priceOriginal,
      finalAmount: finalPrice,
      isDoctor: false,

      serviceTypeLabel,
      serviceName,
      packageName,

      price: finalAmount, // ✅ giá sau khuyến mãi
      paid: 0,
      debt: finalAmount,

      rows: rows.map((r) => ({
        stt: r.stt,
        sessionTime: r.sessionTime,
        sessionNote: r.sessionNote,
        techniqueName: r.techniqueName,
        duration: r.duration,
        experts: r.experts,
        statusText: r.hasCome ? "Đã đến" : "Chưa đến",
      })),
    });
  }, [
    handlePrintTreatment,
    patientName,
    doctorNameResolved,
    serviceTypeLabel,
    serviceName,
    packageName,
    finalAmount,
    rows,
    data?.code,
  ]);

  // ===== Columns =====
  const columns: ColumnsType<RowT> = [
    { title: "STT", dataIndex: "stt", width: 64, align: "center" },
    {
      title: "Thời gian",
      dataIndex: "sessionIndex",
      width: 120,
      align: "center",
      render: (_val, rec) => (
        <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
          {rec.sessionTime && <Text type="secondary">{rec.sessionTime}</Text>}
          {rec.sessionNote && <Text type="secondary">{rec.sessionNote}</Text>}
        </Space>
      ),
    },
    { title: "Kỹ thuật", dataIndex: "techniqueName", align: "center" },
    { title: "Thời lượng", dataIndex: "duration", width: 140, align: "center" },
    { title: "Kỹ thuật viên", dataIndex: "experts", align: "center" },
    {
      title: "Trạng thái",
      dataIndex: "hasCome",
      width: 110,
      align: "center",
      render: (val: boolean) =>
        val ? <Tag color="green">Đã đến</Tag> : <Tag>Chưa đến</Tag>,
    },
  ];

  return (
    <Modal
      title="Hóa đơn liệu trình trị liệu"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnClose
    >
      {/* Header */}
      <Space direction="vertical" size={2} style={{ marginBottom: 16 }}>
        <Text>
          <b>Bác sĩ kê liệu trình:</b> {doctorNameResolved}
        </Text>
        <Text>
          <b>Dịch vụ:</b> {serviceName} {trCode ? `(${trCode})` : ""}
        </Text>
      </Space>

      {/* Form trên cùng */}
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col span={8}>
          <Text>Loại dịch vụ</Text>
          <Input value={serviceTypeLabel} readOnly />
        </Col>
        <Col span={8}>
          <Text>Gói liệu trình</Text>
          <Input value={packageName} readOnly />
        </Col>
        <Col span={8}>
          <Text>Đơn giá</Text>
          <InputNumber
            style={{ width: "100%" }}
            value={subtotal}
            formatter={(val) => (val ? Number(val).toLocaleString() : "")}
            parser={(val) => Number((val ?? "").toString().replace(/\D/g, ""))}
            onChange={(val) => setSubtotal(val || 0)}
          />
        </Col>
      </Row>

      {/* bảng kỹ thuật */}
      <Table<RowT>
        bordered
        dataSource={rows}
        columns={columns}
        pagination={false}
        rowKey="key"
        style={{ marginBottom: 24 }}
        locale={{ emptyText: "Không có kỹ thuật nào trong các buổi trị liệu" }}
        summary={() => (
          <>
            {/* Tổng tiền */}
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <div style={{ textAlign: "right", fontWeight: 500 }}>
                  Tổng tiền
                </div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Text strong>{subtotal.toLocaleString()}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>

            {/* Chọn khuyến mãi */}
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6}>
                <div className="flex items-center justify-between w-full">
                  <span>Chọn khuyến mãi</span>
                  <Select
                    placeholder="Chọn khuyến mãi"
                    style={{ minWidth: 260 }}
                    value={discountId}
                    onChange={setDiscountId}
                    options={discountOptions}
                    loading={discLoading}
                    allowClear
                  />
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>

            {/* Giảm giá */}
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <div style={{ textAlign: "right" }}>Giảm giá</div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Text type="danger">-{discountAmount.toLocaleString()}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>

            {/* Thành tiền */}
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <div style={{ textAlign: "right", fontWeight: 600 }}>
                  Thành tiền
                </div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Text strong style={{ fontSize: 16 }}>
                  {finalAmount.toLocaleString()}
                </Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </>
        )}
      />

      {/* Nút in */}
      <div style={{ textAlign: "right" }}>
        <Space>
          <Button
            onClick={onApplyDiscount}
            loading={applying}
            disabled={!data?.id}
          >
            Áp dụng khuyến mãi
          </Button>
          <Button type="primary" onClick={onPrint} loading={printingTR}>
            In hóa đơn
          </Button>
        </Space>
      </div>

      {printDataTR && (
        <TreatmentPrintPreview refEl={printRefTR} {...printDataTR} />
      )}
    </Modal>
  );
}
