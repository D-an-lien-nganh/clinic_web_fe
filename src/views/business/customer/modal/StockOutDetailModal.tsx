"use client";

import React, { useMemo, useState } from "react";
import {
  Modal,
  Table,
  Typography,
  Space,
  Row,
  Col,
  Radio,
  Card,
  InputNumber,
  Button,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useGetStockOutDetailQuery } from "@/api/app_product/apiService";

const { Text } = Typography;

type Props = {
  open: boolean;
  stockOutId?: number | null;
  onCancel: () => void;
};

type ItemRow = {
  key: string;
  productId: number | string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export default function StockOutDetailModal({
  open,
  stockOutId,
  onCancel,
}: Props) {
  const { data, isFetching, error } = useGetStockOutDetailQuery(
    Number(stockOutId),
    { skip: !open || !stockOutId }
  );

  // ----- Header: chỉ hiển thị tên người tạo -----
  const creatorName =
    data?.creator_name ?? data?.created_by_name ?? data?.created_by ?? "—";

  // ----- Map dữ liệu đơn giản: 1 phiếu = 1 dòng -----
  const quantity = Number(
    data?.actual_quantity ?? data?.quantity ?? data?.qty ?? 0
  );
  const unitPrice = Number(
    // ưu tiên giá xuất thực tế nếu có
    data?.actual_stockout_price ?? data?.unit_price ?? 0
  );
  const fallbackAmount = quantity * unitPrice;
  const total = Number(
    data?.base_total_price ?? data?.original_stockout_price ?? fallbackAmount
  );

  const rows: ItemRow[] = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: String(data.id ?? "row-0"),
        productId: data.product ?? "-", // Mã SP (id)
        productName:
          data.product_name ??
          data.product?.name ??
          data.product_code ??
          "-",
        quantity,
        unitPrice,
        amount: total,
      },
    ];
  }, [data, quantity, unitPrice, total]);

  // ----- Bảng -----
  const columns: ColumnsType<ItemRow> = [
    {
      title: "Mã SP (ID)",
      dataIndex: "productId",
      width: 120,
      align: "center",
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "productName",
      align: "center",
    },
    {
      title: "Số lượng xuất",
      dataIndex: "quantity",
      width: 140,
      align: "center",
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      width: 140,
      align: "center",
      render: (v: number) => v.toLocaleString("vi-VN"),
    },
    {
      title: "Thành tiền",
      dataIndex: "amount",
      width: 160,
      align: "center",
      render: (v: number) => v.toLocaleString("vi-VN"),
    },
  ];

  // ----- Thanh toán ở cuối -----
  const [paid, setPaid] = useState<number>(0);
  const debt = Math.max(total - paid, 0);

  return (
    <Modal
      title="Phiếu xuất vật tư"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnClose
      confirmLoading={isFetching}
    >
      {error && (
        <Alert
          type="error"
          message="Không tải được dữ liệu phiếu xuất"
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Thông tin người tạo */}
      <Space direction="vertical" size={2} style={{ marginBottom: 12 }}>
        <Text>
          <b>Người tạo phiếu:</b> {creatorName}
        </Text>
      </Space>

      {/* Bảng dữ liệu */}
      <Table<ItemRow>
        bordered
        dataSource={rows}
        columns={columns}
        pagination={false}
        rowKey="key"
        style={{ marginBottom: 24 }}
        locale={{ emptyText: "Không có dữ liệu sản phẩm" }}
      />

      {/* Giao diện thanh toán ở cuối */}
      <Row gutter={16}>
        <Col flex="1">
          <Space direction="vertical">
            <Text strong>Phương thức thanh toán</Text>
            <Radio.Group defaultValue="cash">
              <Radio value="cash">Tiền mặt</Radio>
              <Radio value="transfer">Chuyển khoản</Radio>
            </Radio.Group>
          </Space>
        </Col>
        <Col flex="300px">
          <Card size="small" bordered style={{ marginBottom: 16 }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Text>Số tiền cần thanh toán:</Text>
              <Text strong>{total.toLocaleString("vi-VN")}</Text>
            </Space>
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <Text>Đã thu:</Text>
              <InputNumber
                min={0}
                value={paid}
                onChange={(val) => setPaid(Number(val) || 0)}
                controls={false}
                style={{ width: 120 }}
              />
            </Space>
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <Text>Còn nợ:</Text>
              <Text strong>{debt.toLocaleString("vi-VN")}</Text>
            </Space>
          </Card>
          <div style={{ textAlign: "right" }}>
            <Button type="primary">In hóa đơn</Button>
          </div>
        </Col>
      </Row>
    </Modal>
  );
}
