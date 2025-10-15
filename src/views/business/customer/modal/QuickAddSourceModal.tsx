"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, ColorPicker, Button, message } from "antd";
import { useCreateSourceMutation } from "@/api/app_home/apiConfiguration";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Nhận object nguồn vừa tạo từ BE (kỳ vọng có id, name, ...). */
  onCreated?: (created: any) => void;
};

const QuickAddSourceModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [createSource, { isLoading }] = useCreateSourceMutation();

  // reset form mỗi lần mở mới
  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        name: "",
        note: "",
        color: "#1890ff",
      });
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        color:
          typeof values.color === "string"
            ? values.color
            : values.color?.toHexString?.() || null,
      };

      const created = await createSource(payload).unwrap();
      message.success("Đã thêm nguồn khách hàng");
      onCreated?.(created);
      onClose();
    } catch {
      // antd sẽ hiển thị lỗi validate, hoặc BE đã được handle bằng unwrap
    }
  };

  return (
    <Modal
      open={open}
      title="Thêm nguồn khách hàng"
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={isLoading} onClick={handleSubmit}>
            Lưu
          </Button>
        </div>
      }
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên nguồn"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên nguồn" }]}
        >
          <Input placeholder="VD: Facebook Ads, Khách hàng giới thiệu..." />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea placeholder="Ghi chú (tuỳ chọn)" rows={3} />
        </Form.Item>

        <Form.Item label="Màu hiển thị" name="color" initialValue="#1890ff">
          <ColorPicker format="hex" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuickAddSourceModal;
