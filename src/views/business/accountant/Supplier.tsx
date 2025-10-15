"use client";
import React, { useMemo, useState } from "react";
import { Button, Table, Form, Input, DatePicker, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FilterOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import {
  useGetUnrealizedRevenueQuery,
  type UnrealizedRevenueRow,
} from "@/api/app_treatment/apiPayment";

const { RangePicker } = DatePicker;

// helper format
const toNumber = (v: number | string | null | undefined) =>
  v != null ? Number(v) : 0;
const fmtVND = (v: number | string | null | undefined) =>
  toNumber(v).toLocaleString("vi-VN");

export default function SurplusCustomerStatistics() {
  const [form] = Form.useForm();

  // local filters
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("day"),
    dayjs().startOf("day"),
  ]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // call API mới
  const { data, isFetching, refetch } = useGetUnrealizedRevenueQuery({
    startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
    endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
    searchTerm: searchTerm || undefined,
  });

  const rows: UnrealizedRevenueRow[] = Array.isArray(data?.results)
    ? (data!.results as UnrealizedRevenueRow[])
    : [];

  // summary từ BE (fallback tự tính)
  const sum = data?.summary;
  const totalPackagePrice =
    toNumber(sum?.total_package_price) ||
    rows.reduce((s, r) => s + toNumber(r.total_package_price), 0);
  const totalPaid =
    toNumber(sum?.total_paid) ||
    rows.reduce((s, r) => s + toNumber(r.total_paid), 0);
  const totalUsedAmt =
    toNumber(sum?.used_amount) ||
    rows.reduce((s, r) => s + toNumber(r.used_amount), 0);
  const totalUnusedAmt =
    toNumber(sum?.unused_amount) ||
    rows.reduce((s, r) => s + toNumber(r.unused_amount), 0);

  // columns
  const columns: ColumnsType<UnrealizedRevenueRow> = useMemo(
    () => [
      {
        title: "STT",
        width: 60,
        align: "center",
        render: (_t, _r, i) => i + 1,
      },
      { title: "Mã KH", dataIndex: "customer_code", align: "center" },
      { title: "Họ và tên", dataIndex: "customer_name", align: "center" },
      { title: "SĐT", dataIndex: "mobile", align: "center" },
      {
        title: "Trạng thái sử dụng",
        dataIndex: "usage_status",
        align: "center", // ví dụ: "3/10"
      },
      {
        title: "Tổng thu (giá trị gói)",
        dataIndex: "total_package_price",
        align: "right",
        render: (v) => fmtVND(v),
        sorter: (a, b) =>
          toNumber(a.total_package_price) - toNumber(b.total_package_price),
      },
      {
        title: "Tổng đã thanh toán",
        dataIndex: "total_paid",
        align: "right",
        render: (v) => fmtVND(v),
        sorter: (a, b) => toNumber(a.total_paid) - toNumber(b.total_paid),
      },
      {
        title: "Tổng tiền đã sử dụng",
        dataIndex: "used_amount",
        align: "right",
        render: (v) => fmtVND(v),
        sorter: (a, b) => toNumber(a.used_amount) - toNumber(b.used_amount),
      },
      {
        title: "Tổng tiền chưa sử dụng",
        dataIndex: "unused_amount",
        align: "right",
        render: (v) => fmtVND(v),
        sorter: (a, b) => toNumber(a.unused_amount) - toNumber(b.unused_amount),
      },
    ],
    []
  );

  const onFilter = (vals: any) => {
    const dr = vals?.dateRange as [Dayjs | null, Dayjs | null];
    setDateRange([dr?.[0] ?? null, dr?.[1] ?? null]);
    setSearchTerm(vals?.searchTerm ?? "");
    // refetch sẽ tự chạy vì args hook thay đổi
  };

  return (
    <div className="px-6">
      {/* Bộ lọc */}
      <div className="mb-4">
        <Form
          form={form}
          onFinish={onFilter}
          initialValues={{
            dateRange,
            searchTerm,
          }}
          className="flex flex-wrap gap-2"
        >
          <Form.Item
            name="searchTerm"
            className="!mb-0 w-full sm:w-[280px] shrink-0"
          >
            <Input placeholder="Tên hoặc mã khách hàng" allowClear />
          </Form.Item>

          <Form.Item name="dateRange" className="!mb-0">
            <RangePicker
              className="!w-full"
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<FilterOutlined />}
            loading={isFetching}
          >
            Lọc
          </Button>
        </Form>
      </div>

      {/* Bảng */}
      <div className="overflow-x-auto">
        <Table<UnrealizedRevenueRow>
          rowKey={(r) => String(r.customer_id)}
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          bordered
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
          scroll={{ x: 1100 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <strong>Tổng cộng</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <strong>{fmtVND(totalPackagePrice)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <strong>{fmtVND(totalPaid)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <strong>{fmtVND(totalUsedAmt)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">
                <strong>{fmtVND(totalUnusedAmt)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </div>
    </div>
  );
}
