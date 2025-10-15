"use client";
import React, { useMemo, useState } from "react";
import { Button, Form, Input, Select, DatePicker, Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useGetSourceListQuery } from "@/api/app_home/apiConfiguration";

const { RangePicker } = DatePicker;

export interface CustomerFilterValues {
  searchTerm?: string;
  sourceId?: number;
  createdFrom?: string;
  createdTo?: string;
}

interface CustomFilterProps {
  onApply: (filters: CustomerFilterValues) => void;
  loading?: boolean; // để disable nút áp dụng nếu đang loading
}

export default function CustomerFilter({ onApply, loading }: CustomFilterProps) {
  const [form] = Form.useForm();

  // State cho khoảng ngày
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  // Call API lấy danh sách nguồn khách hàng
  const { data: sourceData, isLoading: loadingSource } =
    useGetSourceListQuery(undefined);

  const sourceOptions = useMemo(
    () =>
      sourceData?.results?.map((s: any) => ({
        label: s.name,
        value: s.id,
      })) || [],
    [sourceData]
  );

  const handleApply = () => {
    const values = form.getFieldsValue();
    const payload: CustomerFilterValues = {
      searchTerm: values.searchTerm?.trim() || undefined,
      sourceId: values.sourceId || undefined,
      createdFrom: dateRange[0]
        ? dateRange[0].startOf("day").toISOString()
        : undefined,
      createdTo: dateRange[1]
        ? dateRange[1].endOf("day").toISOString()
        : undefined,
    };
    onApply(payload);
  };

  return (
    <Form form={form} layout="inline" className="gap-2 flex-wrap">
      <Form.Item name="searchTerm">
        <Input placeholder="Tên khách hoặc nghề nghiệp" allowClear />
      </Form.Item>

      {/* <Form.Item name="sourceId">
        <Select
          showSearch
          placeholder="Nguồn khách hàng"
          loading={loadingSource}
          options={sourceOptions}
          allowClear
          style={{ minWidth: 200 }}
          filterOption={(input, option) =>
            (option?.label as string)
              ?.toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </Form.Item> */}

      <RangePicker
        value={dateRange}
        onChange={(vals) => setDateRange(vals as [Dayjs | null, Dayjs | null])}
        allowClear
        format="DD/MM/YYYY"
        placeholder={["Ngày tạo từ", "Ngày tạo đến"]}
      />

      <Button
        type="primary"
        onClick={handleApply}
        disabled={loading || loadingSource}
        className="bg-[#BD8306] text-white"
      >
        Áp dụng
      </Button>
    </Form>
  );
}
