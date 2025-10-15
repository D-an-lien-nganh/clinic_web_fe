'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Table,
  Radio,
  Select,
  InputNumber,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Button,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useGetDiscountListQuery } from '@/api/app_home/apiConfiguration';

const { Text } = Typography;

interface ExamItem {
  id: number;
  name: string;
  quantity: number;
  result: string;
  note: string;
  price: number;
}

interface Discount {
  id: number;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  rate: number; // if percentage: e.g. 10; if fixed: e.g. 100000
}

interface ExamInvoiceModalProps {
  open: boolean;
  customerId?: number | null;
  onCancel: () => void;
}

export default function ExamInvoiceModal({
  open,
  customerId,
  onCancel,
}: ExamInvoiceModalProps) {
  // === MOCK EXAM ITEMS (sẽ replace bằng API) ===
  const invoice = useMemo(
    () => ({
      patientName: 'Nguyễn Văn A',
      doctorName: 'Nguyễn Văn A',
      items: [
        { id: 1, name: 'Xét nghiệm máu', quantity: 1, result: 'Âm tính', note: '1', price: 400000 },
        { id: 2, name: 'Chụp X-quang', quantity: 1, result: 'Bình thường', note: '2', price: 400000 },
        { id: 3, name: 'Siêu âm', quantity: 1, result: 'Không phát hiện', note: '2', price: 400000 },
      ] as ExamItem[],
    }),
    []
  );
  // ============================================

  // Fetch discounts từ backend khi modal mở
  const { data: discountResp, isLoading: loadingDiscounts } =
    useGetDiscountListQuery(undefined, { skip: !open });
  const discounts: Discount[] = discountResp?.results || [];

  // Chuyển thành options cho Select, hiển thị rõ type+rate
  const discountOptions = discounts.map(d => ({
    label:
      d.type === 'percentage'
        ? `${d.name} (${d.rate}%)`
        : `${d.name} (${d.rate.toLocaleString()}đ)`,
    value: d.code,
  }));

  // DataSource cho Table
  const dataSource = invoice.items.map((it, idx) => ({
    key: it.id,
    index: idx + 1,
    ...it,
  }));

  // Tính tổng tiền gốc
  const total = useMemo(
    () => invoice.items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [invoice]
  );

  // State xử lý dropdown và số đã thu
  const [discountCode, setDiscountCode] = useState<string>();
  const [paid, setPaid] = useState<number>(0);

  // Tính tiền giảm dựa vào type và rate
  const discountAmount = useMemo(() => {
    const sel = discounts.find(d => d.code === discountCode);
    if (!sel) return 0;
    return sel.type === 'percentage'
      ? Math.round((total * sel.rate) / 100)
      : sel.rate;
  }, [discountCode, discounts, total]);

  const finalAmount = total - discountAmount;
  const debt = finalAmount - paid;

  // Reset khi đóng modal
  useEffect(() => {
    if (!open) {
      setDiscountCode(undefined);
      setPaid(0);
    }
  }, [open]);

  // Cột Table, all align center, với border
  const columns: ColumnsType<typeof dataSource[0]> = [
    { title: 'STT', dataIndex: 'index', width: 60, align: 'center' },
    { title: 'Tên xét nghiệm', dataIndex: 'name', align: 'center' },
    { title: 'Số lượng', dataIndex: 'quantity', align: 'center' },
    { title: 'Kết quả xét nghiệm', dataIndex: 'result', align: 'center' },
    { title: 'Ghi chú', dataIndex: 'note', align: 'center' },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      align: 'center',
      render: (v: number) => v.toLocaleString(),
    },
  ];

  return (
    <Modal
      title="Hóa đơn khám bệnh"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      {/* Header */}
      <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
        <Text><b>Họ tên bệnh nhân:</b> {invoice.patientName}</Text>
        <Text><b>Bác sĩ khám:</b> {invoice.doctorName}</Text>
      </Space>

      {/* Table */}
      <Table
        bordered
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        rowKey="key"
        summary={() => (
          <>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                Tổng tiền
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="center">
                {total.toLocaleString()}
              </Table.Summary.Cell>
            </Table.Summary.Row>

            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <span>Chọn mã giảm giá</span>
                  <Select
                    placeholder="Chọn khuyến mại"
                    style={{ minWidth: 200 }}
                    value={discountCode}
                    onChange={setDiscountCode}
                    options={discountOptions}
                    loading={loadingDiscounts}
                  />
                </Space>
              </Table.Summary.Cell>
            </Table.Summary.Row>

            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                Thành tiền
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="center">
                {finalAmount.toLocaleString()}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </>
        )}
      />

      {/* Phần dưới: phương thức thanh toán + box tiền + button */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        {/* Phương thức thanh toán */}
        <Col flex="1">
          <Space direction="vertical">
            <Text strong>Phương thức thanh toán</Text>
            <Radio.Group defaultValue="cash">
              <Radio value="cash">Tiền mặt</Radio>
              <Radio value="transfer">Chuyển khoản</Radio>
            </Radio.Group>
          </Space>
        </Col>

        {/* Box summary & In hóa đơn */}
        <Col flex="300px">
          <Card size="small" bordered style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>Số tiền cần thanh toán:</Text>
              <Text strong>{finalAmount.toLocaleString()}</Text>
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
              <Text>Đã thu:</Text>
              <InputNumber
                min={0}
                value={paid}
                onChange={val => setPaid(val || 0)}
                controls={false}
                style={{ width: 120 }}
              />
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
              <Text>Còn nợ:</Text>
              <Text strong>{debt.toLocaleString()}</Text>
            </Space>
          </Card>
          <div style={{ textAlign: 'right' }}>
            <Button type="primary">In hóa đơn</Button>
          </div>
        </Col>
      </Row>
    </Modal>
  );
}
