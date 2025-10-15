import React, { useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  notification,
  Select,
} from "antd";
import { useCreateSupplierDebtPaymentMutation } from "@/api/app_accounting/apiAccounting";

interface Props {
  data?: any;
  refresh?: () => void;
}

export default function AddPayment({ data, refresh }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [createPayment, { isLoading: isCreating }] =
    useCreateSupplierDebtPaymentMutation();

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    refresh?.();
  };

  const onFinish = async (values: any) => {
    try {
      await createPayment(values).unwrap();
      notification.success({
        message: "Thêm thanh toán thành công",
        placement: "bottomRight",
      });
      form.resetFields();
      handleCancel();
    } catch (error) {
      notification.error({
        message: `Thêm thanh toán thất bại`,
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      <Button
        type="primary"
        style={{ color: "white", backgroundColor: "#BD8306" }}
        onClick={showModal}
      >
        Thêm thanh toán
      </Button>

      <Modal
        title="Thêm thanh toán"
        open={isModalOpen}
        footer={null}
        onCancel={handleCancel}
        className="!w-[500px]"
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Lô thanh toán" name="stock_in">
            <Select placeholder="Chọn lô thanh toán" allowClear>
              {data?.stock_ins.map((i: { id: number; code: string }) => (
                <Select.Option key={i.id} value={i.id}>
                  {i.code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Hình thức" name="method">
            <Select placeholder="Chọn hình thức" allowClear>
              <Select.Option value="cash">Tiền mặt</Select.Option>
              <Select.Option value="transfer">Chuyển khoản</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Khoản tiền" name="paid_amount">
            <Input placeholder="Nhập khoản tiền" allowClear />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea placeholder="Nhập ghi chú" allowClear />
          </Form.Item>
          <div className="col-span-3 flex justify-end gap-5 items-center ">
            <Button
              style={{ color: "white", backgroundColor: "#BD8306" }}
              htmlType="submit"
            >
              Lưu
            </Button>
            <Button onClick={handleCancel}>Hủy</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
