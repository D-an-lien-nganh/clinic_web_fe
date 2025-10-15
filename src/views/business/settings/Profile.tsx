"use client";

import { useChangePasswordMutation, useUpdateProfileMutation } from "@/api/app_home/apiAccount";
import { User } from "@/types/userTypes";
import { Button, Form, Input, notification, Tabs, TabsProps } from "antd";
import React, { useEffect, useState } from "react";

function Profile() {
  const [form] = Form.useForm();
  const [userData, setUserData] = useState<User | null>(null);
  const [updateProfile, { isLoading: isLoadingEdit }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isLoadingChange }] = useChangePasswordMutation();

  useEffect(() => {
    const userDataString = localStorage.getItem("user");
    const parsedUserData: User | null = userDataString ? JSON.parse(userDataString) : null;
    setUserData(parsedUserData);

    form.setFieldsValue({
      first_name: parsedUserData?.first_name || "",
      last_name: parsedUserData?.last_name || "",
      user_mobile_number: parsedUserData?.user_profile?.user_mobile_number || "",
      email: parsedUserData?.email || "",
    });
  }, [form]);
  const onChangePassword = async (values: any) => {
    try {
      const result = await changePassword(values).unwrap(); // Sử dụng .unwrap() để lấy response hoặc ném lỗi

      // Nếu thành công, hiển thị thông báo thành công
      notification.success({
        message: `Thay đổi mật khẩu thành công`,
        placement: "bottomRight",
        className: "h-16",
      });
    } catch (error: any) {
      // Nếu có lỗi, hiển thị chi tiết lỗi từ response
      const errorMessage = error?.data?.detail || `Thay đổi mật khẩu thất bại`; // Dự phòng nếu không có detail
      notification.error({
        message: errorMessage,
        placement: "bottomRight",
        className: "h-16",
      });
    }
  };

  const onChangeProfile = async (values: any) => {
    try {
      const result = await updateProfile(values);

      if (result && "error" in result) {
        notification.error({
          message: `Thay đổi hồ thông tin thất bại`,
          placement: "bottomRight",
          className: "h-16",
        });
      } else {
        localStorage.setItem("user", JSON.stringify(result?.data));
        setUserData(result?.data);
        notification.success({
          message: `Thay đổi thông tin thành công`,
          placement: "bottomRight",
          className: "h-16",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `Thay đổi thông tin`,
      children: (
        <div className="w-full max-md:px-4 md:w-[716px] mt-4">
          <Form
            form={form}
            name="dependencies"
            autoComplete="off"
            className="w-full"
            layout="vertical"
            onFinish={onChangeProfile}
          >
            <div className="grid md:grid-cols-2  md:gap-3 ">
              <Form.Item
                label="Tên của bạn"
                name="first_name"
                rules={[{ required: true, message: "Tên của bạn không được để trống" }]}
                className="!mb-3"
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Họ của bạn"
                name="last_name"
                rules={[{ required: true, message: "Họ của bạn không được để trống" }]}
                className="!mb-3"
              >
                <Input />
              </Form.Item>
            </div>

            <div className="grid md:grid-cols-2  md:gap-3">
              <Form.Item label="Số điện thoại" name="user_mobile_number" className="!mb-0">
                <Input />
              </Form.Item>
              <Form.Item label="Email" name="email" className="!mb-0">
                <Input />
              </Form.Item>
            </div>

            <div className="grid md:grid-cols-2 my-4  md:gap-3">
              <div>
                Phòng ban: <span className="font-medium">{userData?.user_profile?.position?.department_name}</span>
              </div>
              <div>
                Vị trí: <span className="font-medium">{userData?.user_profile?.position?.title}</span>{" "}
              </div>
            </div>

            <Form.Item className="flex">
              <Button type="primary" htmlType="submit" loading={isLoadingEdit}>
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: "2",
      label: `Đổi mật khẩu`,
      children: (
        <div className="w-full max-md:px-4 md:w-[716px]  mt-4">
          <Form
            form={form}
            name="dependencies"
            autoComplete="off"
            className="w-full"
            layout="vertical"
            onFinish={onChangePassword}
          >
            <Form.Item label="Mật khẩu hiện tại" name="current_password" rules={[{ required: true }]} className="!mb-3">
              <Input.Password />
            </Form.Item>
            <div className="grid md:grid-cols-2 md:gap-3 ">
              <Form.Item label="Mật khẩu mới" name="new_password" rules={[{ required: true }]} className="!mb-3">
                <Input.Password />
              </Form.Item>

              <Form.Item
                label="Xác nhận lại mật khẩu mới"
                name="new_password_2"
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("new_password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Mật khẩu mới không khớp nhau"));
                    },
                  }),
                ]}
                className="!mb-3"
              >
                <Input.Password />
              </Form.Item>
            </div>

            <Form.Item className="flex">
              <Button type="primary" htmlType="submit" loading={isLoadingChange}>
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
  ];
  return (
    <div className="px-6">
      <div className="text-xl my-4 font-semibold text-white">Cài đặt</div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
}

export default Profile;
