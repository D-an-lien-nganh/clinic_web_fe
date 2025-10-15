"use client";

import React, { useMemo, useState } from "react";
import { Modal, Tabs, Table, Typography, Tag, Empty, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useGetWarehouseLedgerQuery } from "@/api/app_product/apiService";

type LedgerType = "import" | "export";

interface LedgerItemBase {
  id?: number;
  code?: string | null;
  type: LedgerType;
  date: string; // ISO
  unit_name?: string | null;
  quantity: number;
  import_unit_price?: string; // string number
  amount: string; // string number
}

interface LedgerImportItem extends LedgerItemBase {
  type: "import";
  supplier_name?: string | null;
}

interface LedgerExportItem extends LedgerItemBase {
  type: "export";
  export_unit_price: string; // string number
}

interface LedgerModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId?: number | null;
  productName?: string | null;
  scope?: "product" | "supplier";
  dateFrom?: string;
  dateTo?: string;
}

const currencyVN = (val?: string | number | null) => {
  const n = Number(val || 0);
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
};

const ImportTable: React.FC<{
  warehouseId: number;
  scope?: string;
  dateFrom?: string;
  dateTo?: string;
}> = ({ warehouseId, scope, dateFrom, dateTo }) => {
  const { data, isFetching } = useGetWarehouseLedgerQuery(
    { warehouseId, type: "import", scope, dateFrom, dateTo },
    { skip: !warehouseId }
  );

  const items: LedgerImportItem[] = useMemo(
    () =>
      (data?.items || []).map((it: any, idx: number) => ({
        ...it,
        key: it.id ?? idx,
      })),
    [data]
  );

  const columns: ColumnsType<LedgerImportItem> = [
    {
      title: "STT",
      key: "idx",
      width: 64,
      align: "center",
      render: (_v, _r, i) => i + 1,
      fixed: "left",
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      align: "center",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      fixed: "left",
    },
    {
      title: "Mã chứng từ",
      dataIndex: "code",
      key: "code",
      align: "center",
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplier_name",
      key: "supplier_name",
      align: "center",
      render: (v) => v || <Tag color="default">—</Tag>,
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit_name",
      key: "unit_name",
      align: "center",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
    },
    {
      title: "Đơn giá (giá nhập)",
      dataIndex: "import_unit_price",
      key: "import_unit_price",
      align: "right",
      render: (v) => currencyVN(v),
    },
    {
      title: "Thành tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (v) => <b>{currencyVN(v)}</b>,
    },
  ];

  if (isFetching) return <div className="py-8 text-center"><Spin /></div>;
  if (!items.length) return <Empty description="Không có dữ liệu nhập" />;

  return (
    <Table
      rowKey={(r) => (r as any).key ?? `${r.date}-${r.code}`}
      bordered
      size="middle"
      dataSource={items}
      columns={columns}
      scroll={{ x: 900 }}
      pagination={{ pageSize: 10 }}
    />
  );
};

const ExportTable: React.FC<{
  warehouseId: number;
  scope?: string;
  dateFrom?: string;
  dateTo?: string;
}> = ({ warehouseId, scope, dateFrom, dateTo }) => {
  const { data, isFetching } = useGetWarehouseLedgerQuery(
    { warehouseId, type: "export", scope, dateFrom, dateTo },
    { skip: !warehouseId }
  );

  const items: LedgerExportItem[] = useMemo(
    () =>
      (data?.items || []).map((it: any, idx: number) => ({
        ...it,
        key: it.id ?? idx,
      })),
    [data]
  );

  const columns: ColumnsType<LedgerExportItem> = [
    {
      title: "STT",
      key: "idx",
      width: 64,
      align: "center",
      render: (_v, _r, i) => i + 1,
      fixed: "left",
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      align: "center",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      fixed: "left",
    },
    {
      title: "Mã chứng từ",
      dataIndex: "code",
      key: "code",
      align: "center",
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit_name",
      key: "unit_name",
      align: "center",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
    },
    {
      title: "Đơn giá (giá nhập)",
      dataIndex: "import_unit_price",
      key: "import_unit_price",
      align: "right",
      render: (v) => currencyVN(v),
    },
    {
      title: "Giá xuất",
      dataIndex: "export_unit_price",
      key: "export_unit_price",
      align: "right",
      render: (v) => currencyVN(v),
    },
    {
      title: "Thành tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (v) => <b>{currencyVN(v)}</b>,
    },
  ];

  if (isFetching) return <div className="py-8 text-center"><Spin /></div>;
  if (!items.length) return <Empty description="Không có dữ liệu xuất" />;

  return (
    <Table
      rowKey={(r) => (r as any).key ?? `${r.date}-${r.code}`}
      bordered
      size="middle"
      dataSource={items}
      columns={columns}
      scroll={{ x: 900 }}
      pagination={{ pageSize: 10 }}
    />
  );
};

const LedgerModal: React.FC<LedgerModalProps> = ({
  open,
  onClose,
  warehouseId,
  productName,
  scope = "product",
  dateFrom,
  dateTo,
}) => {
  const [activeKey, setActiveKey] = useState<LedgerType>("import");

  const title = (
    <div className="flex flex-col">
      <Typography.Text strong>Sổ chi tiết tồn kho</Typography.Text>
      {productName && (
        <Typography.Text type="secondary">
          Hàng hóa: {productName}
        </Typography.Text>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={title}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <Tabs
        activeKey={activeKey}
        onChange={(k) => setActiveKey(k as LedgerType)}
        items={[
          {
            key: "import",
            label: "Nhập",
            children:
              warehouseId ? (
                <ImportTable
                  warehouseId={warehouseId}
                  scope={scope}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                />
              ) : (
                <Empty />
              ),
          },
          {
            key: "export",
            label: "Xuất",
            children:
              warehouseId ? (
                <ExportTable
                  warehouseId={warehouseId}
                  scope={scope}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                />
              ) : (
                <Empty />
              ),
          },
        ]}
      />
    </Modal>
  );
};

export default LedgerModal;
