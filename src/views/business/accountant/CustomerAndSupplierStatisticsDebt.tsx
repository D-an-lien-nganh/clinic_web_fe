"use client";
import { useWindowSize } from "@/utils/responsiveSm";
import { Button, Col, DatePicker, Form, Input, Row, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
// ✅ dùng API AR Summary
import { useGetReceivablesSummaryQuery } from "@/api/app_treatment/apiPayment";
import ReceivableDetailModal from "./ReceivableDetailModal";

const { RangePicker } = DatePicker;

// BE có thể trả number hoặc string (Decimal)
type Num = number | string;

type ARRow = {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  customer_mobile?: string;
  opening_debit: Num; // dư đầu kỳ
  period_debit: Num; // phát sinh nợ (AR)
  period_credit: Num; // phát sinh có (Payment)
  ending_debit: Num; // dư cuối kỳ
};

type ARSummaryResp = {
  results: ARRow[];
  summary: {
    opening_debit: Num;
    period_debit: Num;
    period_credit: Num;
    ending_debit: Num;
  };
};

// helpers an toàn kiểu
const toNumber = (v: Num | null | undefined) => (v != null ? Number(v) : 0);
const fmtVND = (v: Num | null | undefined) =>
  toNumber(v).toLocaleString("vi-VN");

export default function CustomerAndSupplierStatisticsDebt() {
  const [width] = useWindowSize();
  const [form] = Form.useForm();

  // filter state
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("day"),
    dayjs().startOf("day"),
  ]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // call API
  const { data, isLoading, isFetching } = useGetReceivablesSummaryQuery({
    startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
    endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
    searchTerm: searchTerm || undefined,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenDetail = (id: number) => {
    setSelectedCustomer(id);
    setModalOpen(true);
  };

  const rows: ARRow[] = Array.isArray(data?.results) ? data!.results : [];

  // tổng từ API (fallback tự tính nếu cần)
  const apiSum = (data as ARSummaryResp | undefined)?.summary;
  const sumOpening =
    apiSum?.opening_debit != null
      ? toNumber(apiSum.opening_debit)
      : rows.reduce((s, r) => s + toNumber(r.opening_debit), 0);

  const sumPeriodDebit =
    apiSum?.period_debit != null
      ? toNumber(apiSum.period_debit)
      : rows.reduce((s, r) => s + toNumber(r.period_debit), 0);

  const sumPeriodCredit =
    apiSum?.period_credit != null
      ? toNumber(apiSum.period_credit)
      : rows.reduce((s, r) => s + toNumber(r.period_credit), 0);

  const sumEnding =
    apiSum?.ending_debit != null
      ? toNumber(apiSum.ending_debit)
      : rows.reduce((s, r) => s + toNumber(r.ending_debit), 0);

  // cột hiển thị
  const columns: ColumnsType<ARRow> = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_t, _r, idx) => idx + 1,
      fixed: width < 640 ? "left" : undefined,
    },
    { title: "Mã KH", dataIndex: "customer_code", align: "center" },
    {
      title: "Tên KH",
      dataIndex: "customer_name",
      align: "center",
      render: (text, record) => (
        <a onClick={() => handleOpenDetail(record.customer_id)}>{text}</a>
      ),
    },
    {
      title: "Dư đầu kỳ",
      dataIndex: "opening_debit",
      align: "center",
      render: (v: Num) => fmtVND(v),
      sorter: (a, b) => toNumber(a.opening_debit) - toNumber(b.opening_debit),
    },
    {
      title: "Phát sinh nợ",
      dataIndex: "period_debit",
      align: "center",
      render: (v: Num) => fmtVND(v),
      sorter: (a, b) => toNumber(a.period_debit) - toNumber(b.period_debit),
    },
    {
      title: "Phát sinh có",
      dataIndex: "period_credit",
      align: "center",
      render: (v: Num) => fmtVND(v),
      sorter: (a, b) => toNumber(a.period_credit) - toNumber(b.period_credit),
    },
    {
      title: "Dư cuối kỳ",
      dataIndex: "ending_debit",
      align: "center",
      render: (v: Num) => fmtVND(v),
      sorter: (a, b) => toNumber(a.ending_debit) - toNumber(b.ending_debit),
    },
  ];

  const onFilter = (values: any) => {
    const dr = values?.dateRange as [Dayjs, Dayjs] | undefined;
    setDateRange([
      dr?.[0] ?? dayjs().startOf("day"),
      dr?.[1] ?? dayjs().startOf("day"),
    ]);
    setSearchTerm(values?.customer ?? "");
  };

  return (
    <div className="px-6">
      {/* Bộ lọc */}
      <Form
        form={form}
        onFinish={onFilter}
        initialValues={{ dateRange, customer: searchTerm }}
        className="flex flex-wrap gap-2 mb-2"
      >
        <Form.Item
          name="customer"
          className="form-item !mb-0 w-full sm:w-[280px] shrink-0"
        >
          <Input
            placeholder="Tên hoặc mã khách hàng"
            allowClear
            className="!w-full"
          />
        </Form.Item>

        <Form.Item
          name="dateRange"
          className="form-item w-full sm:w-auto !mb-0"
        >
          <RangePicker
            className="!w-full"
            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
          />
        </Form.Item>

        <Button
          className="w-full sm:w-auto"
          type="primary"
          htmlType="submit"
          loading={isFetching}
        >
          Lọc
        </Button>
      </Form>

      {/* Tổng hợp */}
      <Row gutter={24} className="mb-4 text-lg font-semibold">
        <Col span={12}>Dư đầu kỳ: {fmtVND(sumOpening)}</Col>
        <Col span={12}>Phát sinh nợ: {fmtVND(sumPeriodDebit)}</Col>
        <Col span={12}>Phát sinh có: {fmtVND(sumPeriodCredit)}</Col>
        <Col span={12}>Dư cuối kỳ: {fmtVND(sumEnding)}</Col>
      </Row>

      {/* Bảng */}
      <div className="overflow-x-auto">
        <Table<ARRow>
          rowKey={(r) => `${r.customer_id}-${r.customer_code}`}
          columns={columns}
          dataSource={rows}
          bordered
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      <ReceivableDetailModal
        customerId={selectedCustomer}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
