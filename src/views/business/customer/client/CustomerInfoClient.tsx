"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RiArrowLeftLine } from "react-icons/ri";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { useMemo, useRef, useState } from "react";

import PrescriptionView from "@/views/business/customer/CustomerInfomation/PrescriptionView";
import TreatmentPlanView from "@/views/business/customer/CustomerInfomation/TreatmentPlanView";
import CustomerInfoView from "../CustomerInfomation/CustomerInfoView";

type Role = "receptionist" | "doctor";

export default function CustomerInfoClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const defaultTab = sp.get("tab") ?? "1";
  const customerId = sp.get("customerId") ?? "";
  const rawRole = (sp.get("role") ?? "receptionist").trim().toLowerCase();
  const role = rawRole as Role;

  const [activeKey, setActiveKey] = useState<string>(defaultTab);

  // Chỉ bác sĩ mới được phép thêm
  const canAdd = role === "doctor";

  // Map tiêu đề nút theo tab
  const addBtnTitle: Record<string, string> = {
    "1": "Thêm mới đơn khám",
    "2": "Thêm mới đơn thuốc",
    "3": "Thêm mới phác đồ điều trị",
  };

  // Kho lưu các handler Add của từng tab
  const addHandlersRef = useRef<Record<string, (() => void) | undefined>>({});

  // Hàm cho tab con đăng ký handler
  const registerHandler =
    (tabKey: string) =>
    (fn: (() => void) | undefined) => {
      addHandlersRef.current[tabKey] = fn;
    };

  // Nút chung gọi handler theo tab đang active
  const handleAddClick = () => {
    const fn = addHandlersRef.current[activeKey];
    if (typeof fn === "function") fn();
  };

  const items: TabsProps["items"] = useMemo(
    () => [
      {
        key: "1",
        label: "Đơn khám",
        children: (
          <CustomerInfoView
            customerId={customerId}
            role={role}
            registerAddHandler={registerHandler("1")}
          />
        ),
      },
      {
        key: "2",
        label: "Đơn thuốc",
        children: (
          <PrescriptionView
            customerId={customerId}
            role={role}
            registerAddHandler={registerHandler("2")}
          />
        ),
      },
      {
        key: "3",
        label: "Phác đồ điều trị",
        children: (
          <TreatmentPlanView
            customerId={customerId}
            role={role}
            registerAddHandler={registerHandler("3")}
          />
        ),
      },
    ],
    [customerId, role]
  );

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow hover:bg-gray-50 transition"
          title="Quay lại"
        >
          <RiArrowLeftLine className="text-gray-700 text-xl" />
        </button>
        <h1 className="text-lg font-semibold text-black">Quy trình trị liệu</h1>
      </div>

      <div className="sm:px-6 flex-1 min-h-0">
        <div className="h-full overflow-y-auto pb-6 pr-2">
          <Tabs
            defaultActiveKey={defaultTab}
            onChange={(k) => setActiveKey(k)}
            items={items}
            tabBarExtraContent={
              canAdd ? (
                <button
                  onClick={handleAddClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {addBtnTitle[activeKey]}
                </button>
              ) : null
            }
          />
        </div>
      </div>
    </div>
  );
}
