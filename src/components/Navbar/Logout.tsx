"use client";

import { setIsAuth } from "@/lib/features/authSlice";
import { Button, Modal } from "antd";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";

import React from "react";
import { useDispatch } from "react-redux";

interface LogoutProps {
  isLogout: boolean;
  setIsLogout: React.Dispatch<React.SetStateAction<boolean>>;
}

const Logout: React.FC<LogoutProps> = ({ isLogout, setIsLogout }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const handleOk = () => {
    deleteCookie("access_token");
    deleteCookie("refresh_token");
    localStorage.clear();
    setIsLogout(false);
    router.push("/login");
    dispatch(setIsAuth(false));
  };
  const handleCancel = () => {
    setIsLogout(false);
  };

  return (
    <Modal title="Đăng xuất" open={isLogout} footer={null} onCancel={() => setIsLogout(false)}>
      <p className="text-red-500 italic font-medium">Bạn muốn đăng xuất tài khoản?</p>
      <div className="flex justify-end mt-2 gap-2">
        <Button type="primary" danger onClick={handleOk}>
          Xác nhận
        </Button>{" "}
        <Button onClick={handleCancel}>Hủy</Button>
      </div>
    </Modal>
  );
};

export default Logout;
