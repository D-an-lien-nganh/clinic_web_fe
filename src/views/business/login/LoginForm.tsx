import Image from "next/image";
import { Button, Form, Input } from "antd";
import React from "react";
import { AiOutlineUser } from "react-icons/ai";
import { CiLock } from "react-icons/ci";

function LoginForm({
  onFinish,
  error,
  onChangeInput,
  loading,
}: {
  onFinish: (values: any) => void;
  error: string | null;
  onChangeInput: () => void;
  loading: boolean;
}) {
  return (
    <div className="screen-1 flex flex-col items-center justify-center min-h-screen bg-yellow-100">
      <div className="bg-gray-100 p-10 rounded-2xl shadow-lg border-orange-300 border-2">
        <div className="flex justify-center px-6 pb-9">
          <Image src="/logo.png" width={200} className="rounded-md" height={150} alt="" />
        </div>
        <Form className="flex-1" onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Vui lòng điền tên đăng nhập!" }]}
            className="mb-3"
          >
            <Input
              prefix={<AiOutlineUser className="site-form-item-icon " />}
              className="bg-input bg-inherit"
              placeholder="Username"
              onChange={onChangeInput}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "Vui lòng điền mật khẩu" }]} className="mb-1">
            <Input.Password
              prefix={<CiLock className="site-form-item-icon" />}
              type="password"
              placeholder="Password"
              className="bg-input bg-inherit"
              onChange={onChangeInput}
            />
          </Form.Item>
          {error && <div className="text-red-500">{error}</div>}

          <Form.Item>
            <Button htmlType="submit" className="login__submit mt-2" block loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default LoginForm;
