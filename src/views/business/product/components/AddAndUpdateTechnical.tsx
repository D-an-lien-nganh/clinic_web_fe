import React, { useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Select,
  TimePicker,
} from "antd";
import {
  useCreateTechnicalSettingMutation,
  useEditTechnicalSettingMutation,
  useGetTechnicalSettingByIdQuery,
} from "@/api/app_product/apiService";
// import {
//   useCreateTechnicalMutation,
//   useEditTechnicalMutation,
// } from "@/api/app_product/apiService";

interface Technical {
  key: React.Key;
  id: number;
  name: string;
  duration: number;
  price: string;
  is_active: string;
}

interface Props {
  edit?: boolean;
  data?: Technical;
}

export default function AddAndUpdateTechnical({ edit, data }: Props) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [createTechnical, { isLoading: isCreating }] =
    useCreateTechnicalSettingMutation();
  const { data: technicalId } = useGetTechnicalSettingByIdQuery(data, {
    skip: !data || !isModalOpen,
  });
  const [updateTechnical, { isLoading: isLoadingUpdate }] =
    useEditTechnicalSettingMutation();

  const showModal = () => {
    setIsModalOpen(true);
    if (edit && technicalId) {
      form.setFieldsValue({
        name: technicalId.name,
        duration: technicalId.duration,
        price: technicalId.price,
        is_active: technicalId.is_active,
      });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const onFinish = async (values: any) => {
    try {
      if (edit) {
        values.id = data;
        await updateTechnical(values);
        notification.success({
          message: "Sửa kỹ thuật thành công",
          placement: "bottomRight",
        });
      } else {
        await createTechnical(values).unwrap();
        notification.success({
          message: "Thêm kỹ thuật thành công",
          placement: "bottomRight",
        });
      }
      form.resetFields();
      handleCancel();
    } catch (error) {
      notification.error({
        message: `${edit ? "Sửa" : "Thêm"} kỹ thuật thất bại`,
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
          Thêm kỹ thuật
        </Button>
      )}

      <Modal
        title={`${edit ? "Sửa" : "Thêm"} kỹ thuật`}
        open={isModalOpen}
        footer={null}
        onCancel={handleCancel}
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item
            name="name"
            label="Tên kỹ thuật"
            rules={[{ required: true, message: "Vui lòng nhập tên kỹ thuật" }]}
          >
            <Input placeholder="Nhập tên kỹ thuật" />
          </Form.Item>

          <Form.Item name="duration" label="Thời gian">
            <Input placeholder="Nhập thời gian" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Số tiền"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber
              style={{ width: "100%" }} // Full width
              min={0}
              step={1000} // Increase/decrease by 1000
              placeholder="0 VND"
              formatter={(value: any) =>
                value
                  ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND"
                  : "0 VND"
              }
              parser={(value: any) => value.replace(/ VND|,/g, "")} // Remove commas & "VND"
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value={true}>Hoạt động</Select.Option>
              <Select.Option value={false}>Không hoạt động</Select.Option>
            </Select>
          </Form.Item>
          {/* Nút hành động */}
          <Form.Item className="col-span-3">
            <div className="flex justify-end">
              <Button onClick={handleCancel} className="mr-2">
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Lưu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
