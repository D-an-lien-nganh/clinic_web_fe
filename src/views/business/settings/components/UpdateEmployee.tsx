"use client";

import React, { useEffect, useState } from "react";
import {
  useEditAccountMutation,
  useGetAccountQuery,
} from "@/api/app_home/apiAccount";
import { useWindowSize } from "@/utils/responsiveSm";
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

const UpdateEmployee = ({
  userId,
  detailFunctionData,
  refetchSetupList,
}: {
  userId?: any;
  detailFunctionData?: any[];
  refetchSetupList: () => void;
}) => {
  const [width] = useWindowSize();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editAccount, { isLoading: isLoadingEdit }] = useEditAccountMutation();

  const showModal = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const response = useGetAccountQuery(userId || undefined, {
    skip: !userId ? true : false,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (open && response) {
        // Await the data if necessary
        const data = await response.data;
        const fullName = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(" ");
        const userDetailFunctionIds = data.user_profile.detail_function.map(
          (func: { id: any }) => func.id
        );
        if (data) {
          form.setFieldsValue({
            username: data?.username,
            fullName,
            type: data?.user_profile?.type,
            numberphone: data?.user_profile?.user_mobile_number,
            email: data?.email,
            position: data?.user_profile?.position?.id,
            detailFunction: userDetailFunctionIds,
          });
        }
      }
    };

    fetchData();
  }, [open, response, form]);

  const onFinish = async (values: any) => {
    // 1. Lấy fullName và tách
    const parts = values.fullName.trim().split(/\s+/);
    const first_name = parts.shift()!;
    const last_name = parts.length ? parts.join(" ") : "";

    // 2. Build payload gửi lên backend
    const payload = {
      user_id: userId,
      ...values,
      first_name,
      last_name,
    };
    delete (payload as any).fullName;

    try {
      await editAccount(payload).unwrap();
      notification.success({
        message: "Cập nhật thông tin",
        description: "Cập nhật tài khoản thành công!",
        placement: "bottomRight",
      });
      form.resetFields();
      refetchSetupList();
      onClose();
    } catch {
      notification.error({
        message: "Cập nhật thông tin",
        description: "Có lỗi xảy ra khi cập nhật!",
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      <Button
        type={width < 640 ? "text" : "primary"}
        className={`${width < 640 ? "" : "bg-teal-600 hover:!bg-teal-500"}`}
        onClick={showModal}
        size="small"
      >
        Sửa
      </Button>
      <Modal
        title="Cập nhật thông tin tài khoản"
        width={1000}
        onCancel={onClose}
        open={open}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Tài khoản"
                name="username"
                rules={[
                  { required: true, message: "Tên tài khoản không hợp lệ" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[
                  { required: true, message: "Vui lòng nhập đủ họ và tên!" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Số điện thoại" name="numberphone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Email" name="email">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Chức vụ"
            name="type"
            rules={[{ required: true, message: "Vui lòng " }]}
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
            <Button type="primary" htmlType="submit" loading={isLoadingEdit}>
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UpdateEmployee;
