"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Modal, Table, DatePicker, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { useGetReceivablesDetailByCustomerQuery } from "@/api/app_treatment/apiPayment";

const { RangePicker } = DatePicker;

type Props = {
  customerId: number | null;
  open: boolean;
  onClose: () => void;
};

const toNumber = (v: number | string | null | undefined) =>
  v != null ? Number(v) : 0;

export default function ReceivableDetailModal({
  customerId,
  open,
  onClose,
}: Props) {
  // ✅ state lọc cục bộ trong modal
  const [form] = Form.useForm();

  // default: tháng hiện tại (mượt & an toàn performance)
  const defaultRange = useMemo<[Dayjs, Dayjs]>(() => {
    const start = dayjs().startOf("month");
    const end = dayjs().endOf("day");
    return [start, end];
  }, []);

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultRange);

  // Reset range mỗi khi mở modal cho KH mới
  useEffect(() => {
    if (open) {
      setDateRange(defaultRange);
      form.setFieldsValue({ dateRange: defaultRange });
    }
  }, [open, customerId, defaultRange, form]);

  const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
  const endDate = dateRange?.[1]?.format("YYYY-MM-DD");

  const { data, isFetching } = useGetReceivablesDetailByCustomerQuery(
    {
      customer_id: customerId ?? 0,
      startDate,
      endDate,
    },
    { skip: !customerId }
  );

  const cols: ColumnsType<any> = [
    {
      title: "Ngày",
      dataIndex: "date",
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
      align: "center",
    },
    { title: "Diễn giải", dataIndex: "description", align: "left" },
    {
      title: "Phát sinh Nợ",
      dataIndex: "debit",
      align: "right",
      render: (v: number | string) => toNumber(v).toLocaleString("vi-VN"),
    },
    {
      title: "Phát sinh Có",
      dataIndex: "credit",
      align: "right",
      render: (v: number | string) => toNumber(v).toLocaleString("vi-VN"),
    },
    {
      title: "Số dư nợ",
      dataIndex: "balance_debit",
      align: "right",
      render: (v: number | string) => toNumber(v).toLocaleString("vi-VN"),
    },
  ];

  // ✅ totals từ BE (support cả total_* hoặc period_*)
  const sumDebit =
    toNumber(
      (data?.summary as any)?.total_debit ??
        (data?.summary as any)?.period_debit
    ) ||
    (data?.entries || []).reduce((s, r: any) => s + toNumber(r.debit), 0);

  const sumCredit =
    toNumber(
      (data?.summary as any)?.total_credit ??
        (data?.summary as any)?.period_credit
    ) ||
    (data?.entries || []).reduce((s, r: any) => s + toNumber(r.credit), 0);

  const endingDebit = toNumber((data as any)?.summary?.ending_debit);

  const onFilter = (values: any) => {
    const dr = values?.dateRange as [Dayjs | null, Dayjs | null] | undefined;
    setDateRange([
      dr?.[0] ?? defaultRange[0],
      dr?.[1] ?? defaultRange[1],
    ]);
    // RTK Query tự refetch vì input params (startDate/endDate) thay đổi
  };

  const onReset = () => {
    setDateRange(defaultRange);
    form.setFieldsValue({ dateRange: defaultRange });
  };

  return (
    <Modal
      title="Chi tiết công nợ"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      {/* Bộ lọc trong modal */}
      <Form
        form={form}
        onFinish={onFilter}
        initialValues={{ dateRange: defaultRange }}
        className="mb-3"
      >
        <Space wrap>
          <Form.Item name="dateRange" className="!mb-0">
            <RangePicker
              allowEmpty={[false, false]}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              // quick ranges cho tiện
              ranges={{
                "Hôm nay": [dayjs().startOf("day"), dayjs().endOf("day")],
                "7 ngày gần nhất": [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
                "Tháng này": [dayjs().startOf("month"), dayjs().endOf("day")],
                "Tháng trước": [
                  dayjs().subtract(1, "month").startOf("month"),
                  dayjs().subtract(1, "month").endOf("month"),
                ],
              }}
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={isFetching}>
            Lọc
          </Button>
          <Button onClick={onReset} disabled={isFetching}>
            Reset
          </Button>
        </Space>
      </Form>

      <Table
        columns={cols}
        dataSource={data?.entries || []}
        rowKey={(_, i) => String(i)}
        pagination={false}
        loading={isFetching}
        bordered
        size="small"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={2}>
              <strong>Tổng cộng</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right">
              <strong>{sumDebit.toLocaleString("vi-VN")}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right">
              <strong>{sumCredit.toLocaleString("vi-VN")}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <strong>{endingDebit.toLocaleString("vi-VN")}</strong>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Modal>
  );
}
