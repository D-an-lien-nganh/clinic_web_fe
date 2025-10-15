"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Form,
  Select,
  TimePicker,
  Input,
  Table,
  Button,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

// hooks có sẵn
import { useGetEmployeeListQuery } from "@/api/app_hr/apiHR";
import {
  useGetTestServiceListQuery,
  useGetDiscountListQuery,
} from "@/api/app_home/apiConfiguration";

const { TextArea } = Input;
const { Text } = Typography;

export type RowItem = {
  id: number;
  serviceId?: number;
  serviceCode?: string;
  serviceName?: string;
  unitPrice?: number;
  qty: number;
  result?: string;
  note?: string;
};

type TestOption = {
  value: number;
  label: string;
  code?: string;
  price?: number;
};
type DiscountOption = {
  value: string;
  label: string;
  type: "percentage" | "amount";
  rate: number;
};

export type ExaminationOrderDTO = {
  id?: number;
  booking?: number;
  doctor_id?: number;
  diagnosis?: string;
  note?: string;
  start_time?: string;
  end_time?: string;
  created?: string;
  total_price?: string | number;
  items?: Array<{
    id: number;
    test_service: number;
    test_service_detail?: {
      id: number;
      code?: string;
      name?: string;
      price?: string | number;
    };
    quantity: number;
    price_override?: string | number | null;
    note?: string;
    test_result?: string;
  }>;
};

export type MedicalOrderFormProps = {
  role: "receptionist" | "doctor";
  customerId?: string | null;
  initial?: ExaminationOrderDTO | null; // dữ liệu đơn (nếu update)
  defaultBookingId?: number | undefined; // khi tạo mới cần booking id
  onSubmit: (payload: {
    booking?: number;
    doctor?: number;
    diagnosis?: string;
    note?: string;
    items: Array<{
      test_service: number;
      quantity: number;
      price_override?: number | string | null;
      note?: string;
      test_result?: string;
    }>;
  }) => Promise<any>;
  submitting?: boolean;
  submitText?: string;
  registerDataGetter?: (getter: () => any) => (() => void) | void;
};

export default function MedicalOrderForm({
  role,
  customerId,
  initial,
  defaultBookingId,
  onSubmit,
  submitting,
  submitText = "Lưu",
  registerDataGetter,
}: MedicalOrderFormProps) {
  const isDoctor = role === "doctor";
  const [form] = Form.useForm();
  const toTimeFromISO = (iso?: string) => (iso ? dayjs(iso) : undefined);

  // ===== State tên bác sĩ để in =====
  const [doctorName, setDoctorName] = useState<string>("");

  // ===== Nhân sự (bác sĩ) =====
  const { data: empData, isLoading: empLoading } = useGetEmployeeListQuery({
    page: 1,
    pageSize: 200,
    searchTerm: "",
    startDate: "",
    endDate: "",
    format: "",
    department: "",
  });

  const doctorIdToFullName = useMemo(() => {
    const list = (empData?.results ?? []) as any[];
    const m = new Map<number, string>();
    for (const e of list) {
      const id = Number(e?.id);
      const fullName = (e?.full_name ?? "").trim();
      if (id && fullName) m.set(id, fullName);
    }
    return m;
  }, [empData]);

  const doctorOptions = useMemo(() => {
    const list = (empData?.results ?? []) as any[];
    const normalized = list.map((e) => ({
      user: Number(e?.id),
      typeVal: String(
        e?.type ?? e?.employee_type ?? e?.employeeType
      ).toLowerCase(),
      // label hiển thị: có thể giữ “Full name - Phòng …”
      label:
        (e?.full_name ?? "").trim() +
        (e?.position?.department_name ?? e?.department ?? e?.position?.title
          ? ` - ${
              e?.position?.department_name ??
              e?.department ??
              e?.position?.title
            }`
          : ""),
    }));

    const filtered = normalized.filter((r) => r.typeVal === "employee");

    const currentId = Number(initial?.doctor_id);
    if (currentId && !filtered.some((r) => r.user === currentId)) {
      const curr = normalized.find((r) => r.user === currentId);
      if (curr) filtered.unshift(curr);
    }

    return filtered.map((r) => ({ value: r.user, label: r.label }));
  }, [empData, initial?.doctor_id]);

  /**
   * Đồng bộ doctorName từ initial?.doctor_id khi có empData/doctorOptions.
   * Ưu tiên lấy tên từ danh sách employee (filter theo doctor_id).
   */
  useEffect(() => {
    const currentId = Number(initial?.doctor_id);
    if (!currentId) return;
    const pureName = doctorIdToFullName.get(currentId) ?? "";
    if (pureName) setDoctorName(pureName);
  }, [initial?.doctor_id, doctorIdToFullName]);

  // ===== Dịch vụ xét nghiệm =====
  const { data: testResp, isLoading: testLoading } =
    useGetTestServiceListQuery();
  const testOptions: TestOption[] = useMemo(
    () =>
      (testResp?.results ?? []).map((s: any) => ({
        value: s.id,
        label: s.name,
        code: s.code,
        price: Number(s.price),
      })),
    [testResp]
  );

  // ===== State bảng =====
  const [rows, setRows] = useState<RowItem[]>([{ id: 1, qty: 1 }]);

  // Prefill field doctor_id từ initial
  useEffect(() => {
    if (initial?.doctor_id != null) {
      form.setFieldsValue({ doctor_id: Number(initial.doctor_id) });
    }
  }, [initial?.doctor_id, form]);

  /** Payload phục vụ nút "In": dùng state doctorName */
  const buildPrintPayload = () => {
    const values = form.getFieldsValue();
    const diagnosis = values?.diagnosis ?? initial?.diagnosis ?? "";
    const safeDoctorName = doctorName || "(chưa chọn bác sĩ)";

    // object tên xét nghiệm: { [serviceId|rowId]: serviceName }
    const tests = rows.reduce<Record<string, string>>((acc, r) => {
      if (r.serviceName) {
        const key = String(r.serviceId ?? r.id);
        acc[key] = r.serviceName!;
      }
      return acc;
    }, {});

    return { doctor_name: safeDoctorName, diagnosis, tests };
  };

  // Đăng ký getter cho print; update khi rows/doctorName/initial thay đổi
  useEffect(() => {
    if (!registerDataGetter) return;
    const disposer = registerDataGetter(buildPrintPayload);
    return () => {
      typeof disposer === "function" && disposer();
    };
  }, [registerDataGetter, rows, doctorName, initial?.id]);

  // Prefill từ initial (khi update)
  useEffect(() => {
    if (!initial) return;
    // Prefill form
    form.setFieldsValue({
      doctor_id: initial.doctor_id ?? undefined,
      diagnosis: initial.diagnosis ?? "",
      start_time: initial.start_time ? dayjs(initial.start_time) : undefined,
      end_time: initial.end_time ? dayjs(initial.end_time) : undefined,
    });

    // Prefill rows từ items
    const mapped: RowItem[] = (initial.items ?? []).map((it, idx) => ({
      id: it.id ?? idx + 1,
      serviceId: it.test_service,
      serviceCode: it.test_service_detail?.code,
      serviceName: it.test_service_detail?.name,
      unitPrice: it.test_service_detail?.price
        ? Number(it.test_service_detail.price)
        : undefined,
      qty: it.quantity ?? 1,
      note: it.note,
      result: it.test_result,
    }));
    setRows(mapped.length ? mapped : [{ id: 1, qty: 1 }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  const setRow = (rowId: number, patch: Partial<RowItem>) =>
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );

  const onServiceChange = (rowId: number, serviceId: number) => {
    const found = testOptions.find((x) => x.value === serviceId);
    setRow(rowId, {
      serviceId,
      serviceName: found?.label,
      serviceCode: found?.code,
      unitPrice: found?.price,
    });
  };

  const addRow = () => setRows((prev) => [...prev, { id: Date.now(), qty: 1 }]);

  // ===== Tính tiền (hiển thị khi KHÔNG phải bác sĩ) =====
  const lineAmount = (r: RowItem) => (r.qty || 0) * (r.unitPrice || 0);

  // ===== Columns =====
  const baseColumns: ColumnsType<RowItem & { index: number }> = [
    {
      title: "STT",
      dataIndex: "index",
      width: 60,
      align: "center",
      render: (_t, _r, idx) => idx + 1,
    },
    {
      title: "Mã DV",
      dataIndex: "serviceCode",
      width: 120,
      align: "center",
      render: (t) => <Text strong>{t || "-"}</Text>,
    },
    {
      title: "Tên xét nghiệm",
      dataIndex: "serviceName",
      align: "center",
      render: (_t, rec) => (
        <Select
          placeholder="Chọn xét nghiệm"
          loading={testLoading}
          options={testOptions}
          value={rec.serviceId}
          onChange={(val) => onServiceChange(rec.id, val)}
          style={{ width: "100%" }}
          showSearch
          optionFilterProp="label"
        />
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "qty",
      width: 140,
      align: "center",
      render: (_t, rec) => (
        <div className="flex items-center justify-center gap-2">
          <button
            className="w-7 h-7 border rounded hover:bg-gray-50"
            onClick={() => setRow(rec.id, { qty: Math.max(0, rec.qty - 1) })}
          >
            –
          </button>
          <span className="min-w-[24px] text-center">{rec.qty}</span>
          <button
            className="w-7 h-7 border rounded hover:bg-gray-50"
            onClick={() => setRow(rec.id, { qty: rec.qty + 1 })}
          >
            +
          </button>
        </div>
      ),
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      align: "center",
      render: (_t, rec) => (
        <Input
          placeholder="Nhập kết quả"
          value={rec.result}
          onChange={(e) => setRow(rec.id, { result: e.target.value })}
        />
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      align: "center",
      render: (_t, rec) => (
        <Input
          placeholder="Nhập ghi chú"
          value={rec.note}
          onChange={(e) => setRow(rec.id, { note: e.target.value })}
        />
      ),
    },
  ];

  const columns: ColumnsType<RowItem & { index: number }> = isDoctor
    ? baseColumns
    : [
        ...baseColumns,
        {
          title: "Thành tiền",
          dataIndex: "amount",
          width: 140,
          align: "right",
          render: (_t, rec) => lineAmount(rec).toLocaleString(),
        },
      ];

  // ===== Submit =====
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!rows.length || !rows.every((r) => r.serviceId)) {
        message.error("Vui lòng chọn dịch vụ xét nghiệm cho tất cả dòng.");
        return;
      }
      const startTP = values.start_time as dayjs.Dayjs | undefined;
      const endTP = values.end_time as dayjs.Dayjs | undefined;

      // Lấy ngày base: ưu tiên initial.created, fallback hôm nay
      const baseDate = initial?.created ? dayjs(initial.created) : dayjs();

      // Ghép ngày base + giờ từ TimePicker → ISO có timezone
      const buildISO = (tp?: dayjs.Dayjs) => {
        if (!tp) return undefined;
        return baseDate
          .hour(tp.hour())
          .minute(tp.minute())
          .second(tp.second() || 0)
          .millisecond(0)
          .format("YYYY-MM-DDTHH:mm:ssZ");
      };

      const startISO = buildISO(startTP);
      let endISO = buildISO(endTP);

      if (startISO && endISO && dayjs(endISO).isBefore(dayjs(startISO))) {
        endISO = dayjs(endISO).add(1, "day").format("YYYY-MM-DDTHH:mm:ssZ");
      }

      const payload = {
        booking: initial?.booking ?? defaultBookingId,
        doctor_id: values.doctor_id,
        diagnosis: values.diagnosis,
        note: initial?.note ?? undefined,
        start_time: startISO,
        end_time: endISO,
        items: rows
          .filter((r) => r.serviceId)
          .map((r) => ({
            test_service: r.serviceId as number,
            quantity: r.qty ?? 1,
            price_override: undefined,
            note: r.note,
            test_result: r.result,
          })),
      };
      await onSubmit(payload);
    } catch {
      // antd đã hiển thị lỗi validate
    }
  };

  return (
    <div className="space-y-6">
      {/* Bác sĩ phụ trách & Kết quả khám */}
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <div className="mb-2 text-lg font-semibold">Bác sĩ phụ trách</div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="doctor_id"
              label="Bác sĩ khám"
              rules={[{ required: true, message: "Chọn bác sĩ khám" }]}
              initialValue={initial?.doctor_id}
            >
              <Select
                placeholder="Chọn bác sĩ"
                options={doctorOptions}
                loading={empLoading}
                showSearch
                optionFilterProp="label"
                /** Khi đổi bác sĩ, cập nhật luôn doctorName để in */
                onChange={(val) => {
                  // val là user id
                  const pureName = doctorIdToFullName.get(Number(val)) ?? "";
                  setDoctorName(pureName); // <-- chỉ full_name, không dính phòng ban
                }}
              />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="start_time" label="Bắt đầu khám">
                  <TimePicker
                    format="HH:mm"
                    style={{ width: "100%" }}
                    defaultOpenValue={dayjs("08:00", "HH:mm")}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="end_time" label="Kết thúc khám">
                  <TimePicker
                    format="HH:mm"
                    style={{ width: "100%" }}
                    defaultOpenValue={dayjs("08:30", "HH:mm")}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Col>

        <Col xs={24} md={12}>
          <div className="mb-2 text-lg font-semibold">Kết quả khám</div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="diagnosis"
              label="Chuẩn đoán"
              rules={[{ required: true, message: "Nhập chuẩn đoán" }]}
              initialValue={initial?.diagnosis}
            >
              <TextArea rows={6} placeholder="Nhập chuẩn đoán..." />
            </Form.Item>
          </Form>
        </Col>
      </Row>

      {/* Bảng xét nghiệm */}
      <Table
        key={`medical-${isDoctor ? "doctor" : "receptionist"}-${
          initial?.id ?? "new"
        }`}
        bordered
        columns={columns}
        dataSource={rows.map((r, i) => ({ ...r, index: i + 1, key: r.id }))}
        pagination={false}
        summary={() => (
          <>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={isDoctor ? 6 : 7}>
                <div className="flex justify-center py-2">
                  <Button type="dashed" onClick={addRow}>
                    + Thêm
                  </Button>
                </div>
              </Table.Summary.Cell>
              {!isDoctor && <Table.Summary.Cell index={7} />}
            </Table.Summary.Row>
          </>
        )}
      />

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          loading={submitting}
          onClick={handleSubmit}
        >
          {submitText}
        </Button>
      </div>
    </div>
  );
}
