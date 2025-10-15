"use client";

import React from "react";
import { Row, Col, Form, Select, Input } from "antd";
import type { FormInstance } from "antd";

type Option = { value: any; label: string };

type Props = {
  form: FormInstance;
  technicianOptions: Option[];
  treatmentTypeOptions: Option[];
  serviceOptions: Option[];
  packageOptions: Option[];
  selectedType?: string;
  selectedServiceId?: number;
  empLoading?: boolean;
  serviceLoading?: boolean;
  onChangeType: () => void;
  onChangeService: () => void;
  disabled?: boolean;
};

export default function TreatmentInfoForm({
  form,
  technicianOptions,
  treatmentTypeOptions,
  serviceOptions,
  packageOptions,
  selectedType,
  selectedServiceId,
  empLoading,
  serviceLoading,
  onChangeType,
  onChangeService,
}: Props) {
  return (
    <Form form={form} layout="vertical">
      {/* Hàng 1: Bác sĩ khám – Chuẩn đoán – Ghi chú */}
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            name="doctor_id"
            label="Bác sĩ khám"
            rules={[{ required: true, message: "Chọn bác sĩ khám" }]}
          >
            <Select
              placeholder="Chọn bác sĩ"
              options={technicianOptions}
              loading={empLoading}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="diagnosis"
            label="Chuẩn đoán"
            rules={[{ required: true, message: "Nhập chuẩn đoán" }]}
          >
            <Input placeholder="Nhập chuẩn đoán..." />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="note" label="Ghi chú">
            <Input placeholder="Nhập ghi chú" />
          </Form.Item>
        </Col>
      </Row>

      {/* Hàng 2: Loại trị liệu → Dịch vụ → Liệu trình */}
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            name="treatment_type"
            label="Chọn loại trị liệu"
            rules={[{ required: true, message: "Chọn loại trị liệu" }]}
          >
            <Select
              placeholder="Chọn loại trị liệu"
              options={treatmentTypeOptions}
              onChange={onChangeType}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="service_id"
            label="Chọn loại dịch vụ"
            rules={[{ required: true, message: "Chọn loại dịch vụ" }]}
          >
            <Select
              placeholder={selectedType ? "Chọn dịch vụ" : "Chọn loại trị liệu trước"}
              options={serviceOptions}
              loading={serviceLoading}
              disabled={!selectedType}
              onChange={onChangeService}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="selected_package_id"
            label="Chọn liệu trình"
            rules={[{ required: true, message: "Chọn liệu trình" }]}
          >
            <Select
              placeholder={selectedServiceId ? "Chọn liệu trình" : "Chọn dịch vụ trước"}
              options={packageOptions}
              disabled={!selectedServiceId}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
