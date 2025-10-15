"use client";

import React, { useState } from "react";
import { useCreateAccountMutation } from "@/api/app_home/apiAccount";
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  notification,
} from "antd";

const AddEmployee = ({
  detailFunctionData,
  refetchSetupList,
}: {
  detailFunctionData?: any[];
  refetchSetupList: () => void;
}) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState<boolean>(false);

  const [createAccount, { isLoading: isLoadingAdd }] =
    useCreateAccountMutation();

  const handleCancel = () => {
    setOpen(false);
  };
  const showModal = () => {
    setOpen(true);
  };

  const onFinish = async (values: any) => {
    // 1. Lấy fullName và các trường còn lại
    const { fullName, ...rest } = values;
    // 2. Tách mảng từ chuỗi, bỏ khoảng trắng thừa
    const parts = fullName.trim().split(/\s+/);
    const first_name = parts.shift()!; // phần tử đầu
    const last_name = parts.length ? parts.join(" ") : "";

    try {
      // 3. Gọi API với first_name & last_name
      await createAccount({ first_name, last_name, ...rest }).unwrap();
      notification.success({
        message: "Tạo tài khoản",
        description: "Tạo tài khoản mới thành công!",
      });
      console.log("Thông tin user: ", values);
      refetchSetupList();
      setOpen(false);
    } catch (error: any) {
      notification.error({
        message: "API Call Failed",
        description: error.data?.detail || "An unexpected error occurred",
      });
    }
  };

  return (
    <>
      <Button type="primary" onClick={showModal} size="middle">
        Tạo tài khoản
      </Button>

      <Modal
        open={open}
        onCancel={handleCancel}
        title="Tạo tài khoản"
        footer={null}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            numberphone: null,
            gender: null,
            division: null,
            position: null,
          }}
        >
          <div className="text-lg font-semibold mb-4">Thông tin tài khoản</div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Tài khoản"
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Tên tài khoản không được bỏ trống",
                  },
                ]}
              >
                <Input placeholder="Nhập tên tài khoản" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: "Mật khẩu không được bỏ trống" },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Vui lòng nhập lại mật khẩu" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Mật khẩu nhập lại không khớp")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Nhập lại mật khẩu" />
              </Form.Item>
            </Col>
          </Row>
          <div className="text-lg font-semibold mb-4">Thông tin người dùng</div>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input placeholder="Nhập đầy đủ họ tên" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Số điện thoại" name="numberphone">
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Email không được bỏ trống" },
                ]}
              >
                <Input placeholder="Nhập thông tin Email" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Chức vụ"
            name="type"
            rules={[{ required: true, message: "Vui lòng " }]}
            initialValue="admin"
          >
            <Radio.Group>
              <Radio value="admin">Admin</Radio>
              <Radio value="employee">Nhân viên</Radio>
              <Radio value="collaborator">Cộng tác viên</Radio>
            </Radio.Group>
          </Form.Item>

          {form.getFieldValue("type") !== "admin" && (
            <>
              <div className="text-lg font-semibold mb-4">
                Cài đặt phân quyền
              </div>
              <Form.Item name="detailFunction">
                <Checkbox.Group style={{ width: "100%" }}>
                  <Row gutter={[16, 16]} wrap>
                    {detailFunctionData?.map(
                      (category: {
                        id: number;
                        title: string;
                        detail_function_list: any[];
                      }) => (
                        <Col key={category.id} span={8}>
                          <Row gutter={[16, 16]} wrap>
                            <Col span={24} className="font-bold mb-2">
                              {category.title}
                            </Col>
                            {category?.detail_function_list.map((item) => (
                              <Col span={24} key={item.id}>
                                <Checkbox value={item.id}>
                                  {item.title}
                                </Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </Col>
                      )
                    )}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </>
          )}

          <Form.Item className="flex justify-end">
            <Button htmlType="button" className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoadingAdd}>
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddEmployee;
