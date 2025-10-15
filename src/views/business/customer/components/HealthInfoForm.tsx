"use client";
import React from "react";
import { Form, Input, Row, Col, InputNumber, Button, Tooltip } from "antd";
import { SaveOutlined, EditOutlined, CloseOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";

type Props = {
  form: FormInstance;
  isEditing: boolean;
  existed: boolean;
  loading?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function HealthInfoForm({
  form,
  isEditing,
  existed,
  loading,
  onEdit,
  onSave,
  onCancel,
}: Props) {
  return (
    <Row gutter={12} align="middle" wrap={false}>
      <Col flex="auto" style={{ minWidth: 200 }}>
        <Form.Item
          label="Các xét nghiệm đã có (gần nhất)"
          name={["health", "last_exam"]}
        >
          <Input
            placeholder="VD: Không có / Chụp XQ..."
            disabled={!isEditing}
          />
        </Form.Item>
      </Col>

      <Col style={{ minWidth: 120 }}>
        <Form.Item
          label="Chiều cao"
          name={["health", "height_cm"]}
          rules={[{ required: true, message: "Nhập chiều cao" }]}
        >
          <InputNumber
            className="w-full"
            placeholder="170"
            addonAfter="cm"
            disabled={!isEditing}
          />
        </Form.Item>
      </Col>

      <Col style={{ minWidth: 120 }}>
        <Form.Item
          label="Cân nặng"
          name={["health", "weight_kg"]}
          rules={[{ required: true, message: "Nhập cân nặng" }]}
        >
          <InputNumber
            className="w-full"
            placeholder="65"
            addonAfter="kg"
            disabled={!isEditing}
          />
        </Form.Item>
      </Col>

      <Col style={{ minWidth: 130 }}>
        <Form.Item
          label="Huyết áp"
          name={["health", "blood_pressure"]}
          rules={[{ required: true, message: "Nhập huyết áp" }]}
        >
          <Input placeholder="120/80" disabled={!isEditing} />
        </Form.Item>
      </Col>

      <Col style={{ minWidth: 140 }}>
        <Form.Item
          label="Nhịp tim"
          name={["health", "heart_rate"]}
          rules={[{ required: true, message: "Nhập nhịp tim" }]}
        >
          <InputNumber
            className="w-full"
            placeholder="75"
            addonAfter="lần/phút"
            disabled={!isEditing}
          />
        </Form.Item>
      </Col>

      <Col style={{ minWidth: 140 }}>
        <Form.Item
          label="Nhịp thở"
          name={["health", "breath_rate"]}
          rules={[{ required: true, message: "Nhập nhịp thở" }]}
        >
          <InputNumber
            className="w-full"
            placeholder="18"
            addonAfter="lần/phút"
            disabled={!isEditing}
          />
        </Form.Item>
      </Col>

      {/* Nút hành động */}
      <Col flex="none" className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Tooltip title="Lưu">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={onSave}
              />
            </Tooltip>
            <Tooltip title="Hủy">
              <Button danger icon={<CloseOutlined />} onClick={onCancel} />
            </Tooltip>
          </>
        ) : (
          existed && (
            <Tooltip title="Chỉnh sửa">
              <Button type="text" icon={<EditOutlined />} onClick={onEdit} />
            </Tooltip>
          )
        )}
      </Col>
    </Row>
  );
}
