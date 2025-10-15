import React, { useState } from "react";
import { Button, Form, Input, Modal, notification } from "antd";
import {
  useCreateSupplierMutation,
  useEditSupplierMutation,
} from "@/api/app_product/apiService";

interface Supplier {
  id: number;
  user: number;
  code: string;
  name: string;
  MST: string;
  contact_person: string;
  mobile: string;
  email: string;
  address: string;
}

interface Props {
  edit?: boolean;
  data?: Supplier;
}

export default function AddAndUpdateSupplier({ edit, data }: Props) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [createSupplier, { isLoading: isCreating }] =
    useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isLoadingUpdate }] =
    useEditSupplierMutation();

  const showModal = () => {
    setIsModalOpen(true);
    if (edit && data) {
      form.setFieldsValue({
        name: data.name,
        code: data.code,
        email: data.email,
        MST: data.MST,
        contact_person: data.contact_person,
        mobile: data.mobile,
        address: data.address,
      });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const onFinish = async (values: any) => {
    try {
      if (edit && data) {
        values.id = data.id;
        const result = await updateSupplier(values);
        if ("error" in result) {
          throw result.error;
        }
        notification.success({
          message: "Sửa nhà cung cấp thành công",
          placement: "bottomRight",
        });
      } else {
        await createSupplier(values).unwrap();
        notification.success({
          message: "Thêm nhà cung cấp thành công",
          placement: "bottomRight",
        });
      }
      form.resetFields();
      handleCancel();
    } catch (error: any) {
      console.log("Error details:", error); // Debug lỗi
      const errorMessage =
        error?.data?.message || "Có lỗi xảy ra khi cập nhật nhà cung cấp";
      notification.error({
        message: errorMessage,
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      {edit ? (
        <Button type="primary" onClick={showModal} size="small">
          Sửa
        </Button>
      ) : (
        <Button type="primary" onClick={showModal}>
          Tạo mới
        </Button>
      )}

      <Modal
        title={`${edit ? "Sửa" : "Thêm"} nhà cung cấp`}
        open={isModalOpen}
        footer={null}
        onCancel={handleCancel}
        width={1000}
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          className="grid grid-cols-3 gap-3"
        >
          <Form.Item
            name="name"
            label="Tên nhà cung cấp"
            rules={[
              { required: true, message: "Vui lòng nhập tên nhà cung cấp" },
            ]}
          >
            <Input placeholder="Nhập tên nhà cung cấp" />
          </Form.Item>

          <Form.Item
            name="MST"
            label="Mã số thuế"
            rules={[
              { required: true, message: "Vui lòng nhập mã số thuế" },
              { pattern: /^\d+$/, message: "Chỉ được nhập chữ số 0–9" },
            ]}
            // Trước khi lưu vào form, loại bỏ mọi ký tự không phải số
            getValueFromEvent={(e) => e.target.value.replace(/\D/g, "")}
          >
            <Input
              placeholder="Nhập mã số thuế"
              maxLength={14} // (tùy chọn) giới hạn độ dài
            />
          </Form.Item>

          <Form.Item name="contact_person" label="Người liên hệ">
            <Input placeholder="Nhập người liên hệ" />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="Số điện thoại"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item className="col-span-3">
            <div className="flex justify-end">
              <Button onClick={handleCancel} className="mr-2">
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isLoadingUpdate}
              >
                Lưu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
