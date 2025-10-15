"use client";
import { Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useGetCustomerBillsDetailQuery } from "@/api/app_treatment/apiTreatment";

type Props = {
  open: boolean;
  onClose: () => void;
  customerCode?: string;              // ma_kh
  customerId?: number | string;       // optional nếu bạn có
  startDate?: string;
  endDate?: string;
  customerName?: string;
};

type Row = {
  type: string;
  method: string;
  amount: string;
  created: string;
};

const fmtVND = (n: string | number) =>
  Number(typeof n === "string" ? parseFloat(n) : n || 0).toLocaleString("vi-VN");

export default function CustomerBillsModal({
  open,
  onClose,
  customerCode,
  customerId,
  startDate,
  endDate,
  customerName,
}: Props) {
  const { data, isLoading } = useGetCustomerBillsDetailQuery(
    {
      customer_code: customerCode,
      customer_id: customerId,
      startDate,
      endDate,
    },
    { skip: !open || (!customerCode && !customerId) }
  );

  const columns: ColumnsType<Row> = [
    { title: "Loại hóa đơn", dataIndex: "type", align: "center" },
    { title: "Phương thức thanh toán", dataIndex: "method", align: "center" },
    {
      title: "Số tiền thanh toán",
      dataIndex: "amount",
      align: "center",
      render: (v: string) => fmtVND(v),
      sorter: (a, b) => (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0),
    },
    {
      title: "Thời gian thanh toán",
      dataIndex: "created",
      align: "center",
      render: (iso: string) => (iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : "—"),
      sorter: (a, b) => dayjs(a.created).valueOf() - dayjs(b.created).valueOf(),
    },
  ];

  return (
    <Modal
      title={`Chi tiết hoá đơn - ${customerName ?? customerCode ?? ""}`}
      open={open}
      onCancel={onClose}
      onOk={onClose}
      width={800}
    >
      <Table<Row>
        rowKey={(_, idx) => String(idx)}
        columns={columns}
        dataSource={(data as any) || []}
        loading={isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
      />
    </Modal>
  );
}
