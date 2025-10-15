"use client";

import { setIsAuth } from "@/lib/features/authSlice";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import LoginForm from "./LoginForm";
import { useUserLoginMutation } from "@/api/app_home/apiAccount";

function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [userLogin, { isLoading }] = useUserLoginMutation();
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const onChangeInput = () => {
    setErrorLogin(null);
  };
  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const result = await userLogin({
        username: values.username,
        password: values.password,
      });

      if ("data" in result && result.data) {
        // Lưu token vào cookie, bỏ ko dùng local storage nữa
        setCookie("access_token", result.data.access_token, {
          maxAge: 3 * 60 * 60, // 3 tiếng
          path: "/",
        });

        setCookie("refresh_token", result.data.refresh_token, {
          maxAge: 7 * 24 * 60 * 60, // 7 ngày
          path: "/",
        });
        localStorage.setItem("user", JSON.stringify(result.data.user));

        dispatch(setIsAuth(true));
        router.push(`/app`);
      } else if ("error" in result) {
        const errorDetail = result as unknown as {
          error: { data: { detail: string } };
        };
        setErrorLogin(errorDetail.error.data?.detail || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error("Failed to login", err);
    }
  };
  return (
    <LoginForm
      onFinish={onFinish}
      error={errorLogin}
      onChangeInput={onChangeInput}
      loading={isLoading}
    />
  );
}

export default Login;
