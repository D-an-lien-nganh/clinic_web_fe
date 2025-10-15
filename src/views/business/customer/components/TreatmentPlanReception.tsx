"use client";
import React from "react";
import { Row, Col, Form, Select, Input, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;

export type TreatmentPlanItem = {
  id: React.Key;
  technique_name: string;
  duration_min: number; // phút
};

export type TreatmentPlanReceptionProps = {
  doctorName: string;
  serviceTypeName: string;
  packageName: string;
  diagnosis?: string;
  note?: string;
  items: TreatmentPlanItem[];
};

export default function TreatmentPlanReception({
  doctorName,
  serviceTypeName,
  packageName,
  diagnosis,
  note,
  items,
}: TreatmentPlanReceptionProps) {
  // ✅ CHỈ dùng TreatmentPlanItem (không thêm index)
  const columns: ColumnsType<TreatmentPlanItem> = [
    {
      title: "STT",
      dataIndex: "id",
      align: "center",
      width: 70,
      // dùng idx từ tham số thứ 3 của render
      render: (_t, _r, idx) => idx + 1,
    },
    {
      title: "Các kỹ thuật trong gói",
      dataIndex: "technique_name",
      align: "center",
    },
    {
      title: "Thời gian thực hiện",
      dataIndex: "duration_minutes",
      align: "center",
      width: 160,
      render: (v: number) => `${v} phút`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-base font-semibold">Liệu trình điều trị</div>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form layout="vertical">
            <Form.Item label="Bác sĩ khám">
              <Select value={doctorName} disabled options={[{ label: doctorName, value: doctorName }]} />
            </Form.Item>

            <Form.Item label="Loại dịch vụ">
              <Select value={serviceTypeName} disabled options={[{ label: serviceTypeName, value: serviceTypeName }]} />
            </Form.Item>

            <Form.Item label="Liệu trình điều trị">
              <Select value={packageName} disabled options={[{ label: packageName, value: packageName }]} />
            </Form.Item>

            <Form.Item label="Chuẩn đoán">
              <TextArea value={diagnosis} readOnly placeholder="-" rows={3} />
            </Form.Item>

            <Form.Item label="Ghi chú">
              <TextArea value={note} readOnly placeholder="-" rows={3} />
            </Form.Item>
          </Form>
        </Col>

        <Col xs={24} md={12}>
          {/* ✅ Table cũng để generic là TreatmentPlanItem */}
          <Table<TreatmentPlanItem>
            bordered
            size="middle"
            columns={columns}
            // ✅ dataSource khớp type; thêm key cho React
            dataSource={items.map((it, i) => ({ ...it, key: it.id ?? i }))}
            pagination={{ pageSize: 10 }}
          />
        </Col>
      </Row>
    </div>
  );
}
