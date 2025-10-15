"use client";

import React, { useMemo, useState } from "react";
import {
  Modal,
  Tabs,
  Table,
  Space,
  Typography,
  Tag,
  Button,
  InputNumber,
  Select,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

// --- APIs thanh toán ---
import {
  useGetARItemsQuery,
  useCreatePaymentHistoryMutation,
  ARItemDto,
} from "@/api/app_treatment/apiPayment";

// --- APIs chi tiết ---
import { useGetTreatmentRequestDetailQuery } from "@/api/app_treatment/apiTreatment";

// Modal đơn thuốc
import PrescriptionInvoiceModal from "./PrescriptionInvoiceModal";
// Modal phác đồ
import TreatmentInvoiceModal, { ServerTR } from "./TreatmentInvoiceModal";

const { Text } = Typography;

/** utils nhỏ */
const fmt = (n?: string | number) => Number(n || 0).toLocaleString("vi-VN");

const StatusBadge = ({ status }: { status: "open" | "partial" | "closed" }) => {
  const map: Record<
    "open" | "partial" | "closed",
    { color: string; text: string }
  > = {
    open: { color: "red", text: "Chưa thanh toán" },
    partial: { color: "gold", text: "Thanh toán một phần" },
    closed: { color: "green", text: "Đã thanh toán" },
  };

  const s = map[status];
  return <Tag color={s.color}>{s.text}</Tag>;
};

type Method = "cash" | "transfer";

/** Modal thu tiền nhanh */
function QuickPayModal({
  open,
  onClose,
  arItem,
}: {
  open: boolean;
  onClose: (reloaded?: boolean) => void;
  arItem: ARItemDto | null;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<Method>("cash");
  const [loading, setLoading] = useState(false);

  const [createPayment] = useCreatePaymentHistoryMutation();

  const remaining = useMemo(() => {
    const r =
      Number(arItem?.amount_original || 0) - Number(arItem?.amount_paid || 0);
    return Math.max(0, r);
  }, [arItem]);

  const submit = async () => {
    if (!arItem) return;
    if (!amount || amount <= 0) {
      message.warning("Nhập số tiền hợp lệ");
      return;
    }
    if (amount > remaining) {
      message.warning("Số tiền thu vượt số còn lại");
      return;
    }
    setLoading(true);
    try {
      await createPayment({
        ar_item: arItem.id, // ⬅️ quan trọng: gắn đúng ARItem
        paid_amount: amount,
        paid_method: method, // 'cash' | 'transfer'
      }).unwrap();

      message.success("Thu tiền thành công");
      onClose(true);
    } catch (e: any) {
      message.error(e?.data?.detail || "Thu tiền thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Thu tiền - ${
        arItem
          ? `${arItem.description || arItem.source_type.toUpperCase()} #${
              arItem.source_id
            }`
          : ""
      }`}
      open={open}
      onCancel={() => onClose(false)}
      onOk={submit}
      okText="Xác nhận thu"
      confirmLoading={loading}
      okButtonProps={{ disabled: !arItem || remaining <= 0 || amount <= 0 }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text>Còn phải thu</Text>
          <Text strong>{fmt(remaining)} đ</Text>
        </Space>

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text>Số tiền thu</Text>
          <InputNumber
            min={0}
            value={amount}
            onChange={(v) => setAmount(v ?? 0)}
            style={{ width: 200 }}
            controls={false}
            placeholder="Nhập số tiền"
            formatter={(value) =>
              `${value ?? 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => Number((value ?? "0").replace(/,/g, ""))}
          />
        </Space>

        <Space>
          <Text>Phương thức</Text>
          <Select<Method>
            style={{ width: 200 }}
            value={method}
            onChange={setMethod}
            options={[
              { label: "Tiền mặt", value: "cash" },
              { label: "Chuyển khoản", value: "transfer" },
            ]}
          />
        </Space>
      </Space>
    </Modal>
  );
}

/** Bảng công nợ theo từng loại đơn */
function ARTable({
  customerId,
  sourceType,
  title,
}: {
  customerId: number;
  sourceType: "doctorprocess" | "treatmentrequest" | "stockout";
  title: string;
}) {
  const { data, refetch, isFetching } = useGetARItemsQuery({
    customer_id: customerId,
    status: "open,partial,closed",
    source_type: sourceType,
    // page_size: 8, // nếu BE bật phân trang
  });

  const rows: ARItemDto[] = Array.isArray(data) ? data : data?.results || [];
  const [paying, setPaying] = useState<ARItemDto | null>(null);

  // Modal chi tiết
  const [dpModalId, setDpModalId] = useState<number | null>(null);
  const [trModalId, setTrModalId] = useState<number | null>(null);

  // Detail phác đồ
  const {
    data: trDetail,
    isFetching: trLoading,
    refetch: refetchTR,
  } = useGetTreatmentRequestDetailQuery(Number(trModalId), {
    skip: !trModalId,
    refetchOnMountOrArgChange: true, // 👈 mount lại/đổi id sẽ refetch
  });

  React.useEffect(() => {
    if (trModalId) refetchTR();
  }, [trModalId, refetchTR]);

  const columns: ColumnsType<ARItemDto> = [
    {
      title: "Mã nguồn",
      dataIndex: "source_id",
      align: "center",
      width: 120,
      render: (v) => <Text strong>#{v}</Text>,
    },
    {
      title: "Ngày",
      align: "center",
      dataIndex: "created",
      width: 160,
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "amount_original",
      align: "center",
      width: 140,
      render: (v) => fmt(v),
    },
    {
      title: "Đã thu",
      dataIndex: "amount_paid",
      align: "center",
      width: 120,
      render: (v) => fmt(v),
    },
    {
      title: "Còn lại",
      key: "remaining",
      align: "center",
      width: 120,
      render: (_, r) => fmt(Number(r.amount_original) - Number(r.amount_paid)),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 110,
      render: (s: any) => <StatusBadge status={s} />,
    },
    {
      title: "Hành động",
      key: "act",
      align: "center",
      width: 210,
      render: (_, r) => {
        const remaining = Number(r.amount_original) - Number(r.amount_paid);
        const canCollect = r.status !== "closed" && remaining > 0;

        return (
          <Space>
            <Button
              onClick={() => {
                if (r.source_type === "doctorprocess") {
                  setDpModalId(Number(r.source_id));
                } else if (r.source_type === "treatmentrequest") {
                  setTrModalId(Number(r.source_id));
                }
              }}
            >
              Chi tiết
            </Button>

            {canCollect && (
              <Button type="primary" onClick={() => setPaying(r)}>
                Thu tiền
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Table
        bordered
        size="middle"
        rowKey={(r) => r.id}
        dataSource={rows}
        columns={columns}
        loading={isFetching}
        scroll={{ x: 980 }}
        pagination={{ pageSize: 8 }}
        title={() => <Text strong>{title}</Text>}
      />

      {/* Thu tiền */}
      <QuickPayModal
        open={!!paying}
        onClose={(reload) => {
          setPaying(null);
          if (reload) refetch();
        }}
        arItem={paying}
      />

      {/* Modal đơn thuốc */}
      <PrescriptionInvoiceModal
        open={!!dpModalId}
        doctorProcessId={dpModalId ?? undefined}
        role="receptionist"
        onCancel={() => {
          setDpModalId(null);
          refetch();
        }}
      />

      {/* Modal phác đồ */}
      <TreatmentInvoiceModal
        open={!!trModalId}
        data={trDetail as ServerTR | undefined}
        patientName={
          (trDetail as any)?.customer_name ||
          (trDetail as any)?.customer?.name ||
          "—"
        }
        doctorName={
          (trDetail as any)?.doctor_name ||
          (trDetail as any)?.doctor?.full_name ||
          "—"
        }
        onCancel={() => setTrModalId(null)}
      />
    </>
  );
}

/** ============ Modal chính gộp 2 loại hóa đơn ============ */
export default function CustomerPaymentModal({
  open,
  customerId,
  onCancel,
}: {
  open: boolean;
  customerId: number;
  onCancel: () => void;
}) {
  const items = [
    {
      key: "rx",
      label: "Đơn thuốc",
      children: (
        <ARTable
          title="Danh sách đơn thuốc"
          customerId={customerId}
          sourceType="doctorprocess"
        />
      ),
    },
    {
      key: "tr",
      label: "Phác đồ/ Liệu trình",
      children: (
        <ARTable
          title="Danh sách phác đồ"
          customerId={customerId}
          sourceType="treatmentrequest"
        />
      ),
    },
    {
      key: "xo",
      label: "Xuất vật tư",
      children: (
        <ARTable
          title="Danh sách xuất vật tư"
          customerId={customerId}
          sourceType="stockout"
        />
      ),
    },
  ];

  return (
    <Modal
      title="Hóa đơn & Công nợ theo từng đơn"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
      destroyOnClose
    >
      <Tabs items={items} />
    </Modal>
  );
}
