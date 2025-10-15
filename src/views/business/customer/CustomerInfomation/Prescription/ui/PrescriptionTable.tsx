"use client";

import React from "react";
import { Table, Button, Input, Typography, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined } from "@ant-design/icons";
import { RowItem, ProductOption, DiscountOption } from "../types";

const { Text } = Typography;

type Props = {
  isDoctor: boolean;
  rows: RowItem[];
  productOptions: ProductOption[];
  productLoading?: boolean;
  discLoading?: boolean;
  discountOptions: DiscountOption[];
  discountId?: number;
  setDiscountId: (id?: number) => void;
  subtotal: number;
  lineAmount: (r: RowItem) => number;
  onProductChange: (rowId: number, productId: number) => void;
  setRow: (rowId: number, patch: Partial<RowItem>) => void;
  addRow: () => void;
  removeRow: (rowId: number) => void;
  finalAmount?: number;
};

export default function PrescriptionTable({
  isDoctor,
  rows,
  productOptions,
  productLoading,
  discLoading,
  discountOptions,
  discountId,
  setDiscountId,
  subtotal,
  lineAmount,
  onProductChange,
  setRow,
  addRow,
  removeRow,
  finalAmount,
}: Props) {
  const baseColumns: ColumnsType<RowItem & { index: number }> = [
    {
      title: "STT",
      dataIndex: "index",
      width: 60,
      align: "center",
      render: (_t, _r, idx) => idx + 1,
    },
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      align: "center",
      render: (_t, rec) => (
        <Select
          placeholder="Chọn sản phẩm"
          loading={productLoading}
          options={productOptions}
          value={rec.productId}
          onChange={(val) => onProductChange(rec.id!, val)}
          style={{ width: "100%" }}
          showSearch
          optionFilterProp="label"
        />
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 140,
      align: "center",
      render: (_t, rec) => (
        <div className="flex items-center justify-center gap-2">
          <button
            className="w-7 h-7 border rounded hover:bg-gray-50"
            onClick={() =>
              setRow(rec.id!, { quantity: Math.max(0, rec.quantity - 1) })
            }
          >
            –
          </button>
          <span className="min-w-[24px] text-center">{rec.quantity}</span>
          <button
            className="w-7 h-7 border rounded hover:bg-gray-50"
            onClick={() => setRow(rec.id!, { quantity: rec.quantity + 1 })}
          >
            +
          </button>
        </div>
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      align: "center",
      render: (t) => <Text strong>{t || "-"}</Text>,
    },
    {
      title: "Liều lượng",
      dataIndex: "dosage",
      align: "center",
      render: (_t, rec) => (
        <Input
          placeholder="VD: 2 viên/lần/ngày"
          value={rec.dosage}
          onChange={(e) => setRow(rec.id!, { dosage: e.target.value })}
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
          onChange={(e) => setRow(rec.id!, { note: e.target.value })}
        />
      ),
    },
    {
      title: "Thao tác",
      dataIndex: "actions",
      width: 80,
      align: "center",
      render: (_t, rec) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeRow(rec.id!)}
          disabled={rows.length <= 1}
        />
      ),
    },
  ];

  const columns: ColumnsType<RowItem & { index: number }> = isDoctor
    ? baseColumns
    : [
        ...baseColumns.slice(0, -1),
        {
          title: "Thành tiền",
          dataIndex: "amount",
          width: 140,
          align: "right",
          render: (_t, rec) => lineAmount(rec).toLocaleString(),
        },
        baseColumns[baseColumns.length - 1],
      ];

  return (
    <Table
      bordered
      columns={columns}
      dataSource={rows.map((r, i) => ({ ...r, index: i + 1, key: String(r.id) }))}
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

          {!isDoctor && (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6}>
                  Tổng tiền
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {subtotal.toLocaleString()}
                </Table.Summary.Cell>
              </Table.Summary.Row>

              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7}>
                  <div className="flex items-center justify-between w-full">
                    <span>Chọn khuyến mãi</span>
                    <Select
                      placeholder="Chọn khuyến mãi"
                      style={{ minWidth: 240 }}
                      value={discountId}
                      onChange={setDiscountId}
                      options={discountOptions}
                      loading={discLoading}
                    />
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>

              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6}>
                  Thành tiền
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {(finalAmount ?? 0).toLocaleString()}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          )}
        </>
      )}
    />
  );
}
