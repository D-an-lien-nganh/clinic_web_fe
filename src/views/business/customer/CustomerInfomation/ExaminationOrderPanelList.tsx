"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Collapse, message, Spin } from "antd";
import type { CollapseProps } from "antd";
import MedicalOrderForm, { ExaminationOrderDTO } from "./MedicalOrderForm";

import {
  useGetExaminationOrderListQuery,
  useCreateExaminationOrderMutation,
  useUpdateExaminationOrderMutation,
} from "@/api/app_treatment/apiTreatment";

type Props = {
  customerId: string;
  role: "receptionist" | "doctor";
  defaultBookingId?: number;
  registerAddHandler?: (fn: (() => void) | undefined) => void;
  onRequestPrint?: (data: any) => void;
};

export default function ExaminationOrderPanelList({
  customerId,
  role,
  registerAddHandler,
  onRequestPrint,
}: Props) {
  const { data, isLoading, refetch } = useGetExaminationOrderListQuery(
    { customer_id: Number(customerId), page: 1, pageSize: 50 },
    { skip: !customerId }
  );

  const [activeInnerKeys, setActiveInnerKeys] = useState<string[] | string>([]);

  const onInnerChange = (keys: string[] | string) => setActiveInnerKeys(keys);

  const ensureKeyActive = (key: string) => {
    setActiveInnerKeys((prev: any) => {
      const arr = Array.isArray(prev) ? prev : [prev].filter(Boolean);
      return arr.includes(key) ? arr : [...arr, key];
    });
  };

  const gettersRef = React.useRef<Record<string, () => any>>({});

  const setGetter = (key: string) => (getter: () => any) => {
    gettersRef.current[key] = getter;
    return () => {
      delete gettersRef.current[key];
    };
  };

  const handleClickPrint = (key: string) => async (e: React.MouseEvent) => {
    e.stopPropagation();
    let getter = gettersRef.current[key];
    if (!getter) {
      // mở panel để mount form
      ensureKeyActive(key);
      await new Promise(r => setTimeout(r, 120)); // chờ child mount
      getter = gettersRef.current[key];
    }
    if (!getter) {
      message.warning("Không tìm thấy dữ liệu đơn khám để in");
      return;
    }
    const payload = getter();
    onRequestPrint?.(payload);
  };

  const orders: ExaminationOrderDTO[] = useMemo(
    () => (data?.results ?? data ?? []),
    [data]
  );

  const [createOrder, { isLoading: creating }] = useCreateExaminationOrderMutation();
  const [updateOrder, { isLoading: updating }] = useUpdateExaminationOrderMutation();

  // các panel "đơn mới" cục bộ (chưa save)
  const [newKeys, setNewKeys] = useState<string[]>([]);

  const addNewPanel = () => {
    const key = `new-${Date.now()}`;
    setNewKeys((prev) => [...prev, key]);
  };

  // Tự tạo 1 panel mới cho khách chưa có đơn
  useEffect(() => {
    if (!isLoading && orders.length === 0 && newKeys.length === 0) {
      addNewPanel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, orders.length]);

  // Đăng ký handler cho nút ngoài tab
  useEffect(() => {
    registerAddHandler?.(addNewPanel);
    return () => registerAddHandler?.(undefined);
  }, [registerAddHandler]);

  const handleCreate = async (payload: any, key: string) => {
    try {
      const body = { ...payload, customer: customerId };
      await createOrder(body).unwrap();
      message.success("Tạo đơn khám thành công");
      setNewKeys((prev) => prev.filter((k) => k !== key));
      refetch();
    } catch (err: any) {
      message.error(err?.data?.detail ?? "Tạo đơn khám thất bại");
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await updateOrder({ id, data }).unwrap();
      message.success("Cập nhật đơn khám thành công");
    } catch (err: any) {
      message.error(err?.data?.detail ?? "Cập nhật đơn khám thất bại");
    } finally {
      refetch();
    }
  };

  // Các panel con (đơn cũ + đơn mới nháp)
  const orderPanels: CollapseProps["items"] = [
    ...orders.map((o) => {
      const key = `ex-${o.id}`;
      return {
        key,
        label: `Đơn khám #${o.id} • ${o.created ? new Date(o.created).toLocaleString() : ""}`,
        extra: (
          <button
            onClick={handleClickPrint(key)}
            className="text-blue-600 hover:underline"
          >
            In đơn khám
          </button>
        ),
        children: (
          <MedicalOrderForm
            role={role}
            customerId={customerId}
            initial={o}
            onSubmit={(payload) => handleUpdate(o.id!, payload)}
            submitting={updating}
            submitText="Cập nhật đơn"
            registerDataGetter={setGetter(key)} // 👈 NEW
          />
        ),
      };
    }),
    ...newKeys.map((key) => ({
      key,
      label: "Đơn khám mới",
      extra: (
        <button
          onClick={handleClickPrint(key)}
          className="text-blue-600 hover:underline"
        >
          In đơn khám
        </button>
      ),
      children: (
        <MedicalOrderForm
          role={role}
          customerId={customerId}
          initial={null}
          onSubmit={(payload) => handleCreate(payload, key)}
          submitting={creating}
          submitText="Lưu tạo mới"
          registerDataGetter={setGetter(key)} // 👈 NEW
        />
      ),
    })),
  ];

  // Panel TỔNG: Danh sách đơn khám
  const wrapperItems: CollapseProps["items"] = [
    {
      key: "all",
      label: `Danh sách đơn khám (${orders.length} đã lưu${newKeys.length ? `, ${newKeys.length} nháp` : ""})`,
      children: <Collapse items={orderPanels} accordion={false} activeKey={activeInnerKeys} onChange={onInnerChange} />,
    },
  ];

  return isLoading ? (
    <div className="flex justify-center py-12"><Spin /></div>
  ) : (
    <Collapse items={wrapperItems} defaultActiveKey={["all"]} />
  );
}
