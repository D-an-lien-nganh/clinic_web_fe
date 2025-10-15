"use client";
import React, { useMemo } from "react";
import { Form, Select, DatePicker, TimePicker, Row, Col } from "antd";
import type { FormInstance } from "antd";
import dayjs from "dayjs";
import { useGetEmployeeListQuery } from "@/api/app_hr/apiHR";
const { Option } = Select;

type Props = { form: FormInstance };

export default function OtherInfoForm({ form }: Props) {
  const { data, isLoading } = useGetEmployeeListQuery({
    page: 1, pageSize: 200, searchTerm: "", startDate: "", endDate: "", format: "", department: "",
  });

  const employeeOptions = useMemo(() => {
    const results = data?.results ?? [];
    return results.map((e: any) => ({
      label: `${e?.full_name?.full_name ?? "Không rõ tên"} (${e?.id})`,
      value: e?.id,
    }));
  }, [data]);

  // style thống nhất khoảng cách giữa các Form.Item
  const itemMb = { marginBottom: 16 };

  return (
    <Row gutter={24}>
      {/* Cột trái */}
      <Col xs={24} md={12}>
        <Form.Item
          label="Trạng thái khách hàng"
          name="customer_status"
          rules={[{ required: true, message: "Chọn trạng thái" }]}
          style={itemMb}
        >
          <Select placeholder="Chọn trạng thái" style={{ width: "100%" }}>
            <Option value="new">Khách chưa sử dụng dịch vụ</Option>
            <Option value="using">Khách đang sử dụng dịch vụ</Option>
            <Option value="used">Khách đã sử dụng dịch vụ</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Loại trị liệu"
          name="treatment_type"
          rules={[{ required: true, message: "Chọn loại trị liệu" }]}
          style={{ marginBottom: 0 }}
        >
          <Select placeholder="Chọn loại trị liệu" style={{ width: "100%" }}>
            <Option value="duong_sinh">Trị liệu dưỡng sinh</Option>
            <Option value="chua_benh">Trị liệu chữa bệnh</Option>
          </Select>
        </Form.Item>
      </Col>

      {/* Cột phải */}
      <Col xs={24} md={12}>

        <Form.Item
          label="Bác sĩ khám"
          name="doctor_exam_id"
          rules={[{ required: true, message: "Chọn bác sĩ khám" }]}
          style={itemMb}
        >
          <Select
            placeholder="Chọn bác sĩ khám"
            loading={isLoading}
            options={employeeOptions}
            showSearch
            optionFilterProp="label"
            allowClear
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Bác sĩ điều trị"
          name="doctor_treat_id"
          rules={[{ required: true, message: "Chọn bác sĩ điều trị" }]}
          style={{ marginBottom: 0 }}
        >
          <Select
            placeholder="Chọn bác sĩ điều trị"
            loading={isLoading}
            options={employeeOptions}
            showSearch
            optionFilterProp="label"
            allowClear
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
