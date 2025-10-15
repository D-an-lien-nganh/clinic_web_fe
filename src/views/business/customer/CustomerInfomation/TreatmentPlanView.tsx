"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Collapse, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import TreatmentPlanDoctor, { type ServerTR } from "./TreatmentPlanDoctor";

import { useGetTreatmentRequestsQuery } from "@/api/app_treatment/apiTreatment";
import dayjs from "dayjs";

type Props = {
  customerId?: string | null;
  /** Bắt buộc nếu muốn tạo phác đồ mới từ màn hình này */
  role?: "receptionist" | "doctor";
  /** Cho phép màn hình cha “gắn” handler click để thêm panel phác đồ mới */
  registerAddHandler?: (fn: (() => void) | undefined) => void;
};

/* ========= Helper ========= */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ========= Stack nhiều phác đồ cho Bác sĩ ========= */
function TreatmentPlanDoctorStack({
  customerId,
  registerAddHandler,
  role
}: {
  customerId?: string | null;
  registerAddHandler?: (fn: (() => void) | undefined) => void;
  role?: "receptionist" | "doctor";
}) {
  // Fetch danh sách phác đồ đã lưu theo customer
  const cid = customerId ? Number(customerId) : undefined;
  const { data, isFetching, refetch } = useGetTreatmentRequestsQuery(
    { customer_id: cid, page: 1, pageSize: 50 },
    { skip: !cid }
  );

  const serverPlans: ServerTR[] = data?.results ?? [];

  // Quản lý các panel "nháp" để tạo phác đồ mới
  type Draft = { id: string };
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const addDraft = useCallback(() => {
    setDrafts((prev) => [...prev, { id: uid() }]);
  }, []);
  const removeDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Reset drafts khi đổi customer
  useEffect(() => {
    setDrafts([]);
  }, [cid]);

  // Tự thêm 1 panel nháp nếu fetch xong mà danh sách rỗng
  useEffect(() => {
    const emptyServer = !isFetching && !!cid && serverPlans.length === 0;
    if (emptyServer && drafts.length === 0) {
      setDrafts([{ id: uid() }]);
    }
  }, [isFetching, cid, serverPlans.length, drafts.length]);

  // Cho phép màn hình cha “gắn” một handler bấm nút để thêm panel
  useEffect(() => {
    registerAddHandler?.(() => addDraft());
    return () => registerAddHandler?.(undefined);
  }, [registerAddHandler, addDraft]);

  const items = useMemo(() => {
    const existing = (serverPlans || []).map((tr, idx) => {
      const createdStr = tr.created_at
        ? dayjs(tr.created_at).format("DD/MM/YYYY - HH:mm")
        : "";

      return {
        key: `srv-${tr.id}`,
        label: (
          <span className="font-semibold">
            {`Phác đồ đã lưu #${idx + 1}`}
            {createdStr ? (
              <span className="text-gray-500 ml-2">· {createdStr}</span>
            ) : null}
          </span>
        ),
        children: (
          <div className="mt-2">
            <TreatmentPlanDoctor
              customerId={customerId}
              initialData={tr}
              onSaved={refetch}
              role={role}
            />
          </div>
        ),
      };
    });

    const draftItems = drafts.map((d, i) => ({
      key: `draft-${d.id}`,
      label: <span className="font-semibold">{`Phác đồ mới #${i + 1}`}</span>,
      extra: (
        <div onClick={(e) => e.stopPropagation()}>
          <Popconfirm
            title="Xoá phác đồ nháp này?"
            okText="Xoá"
            cancelText="Huỷ"
            placement="left"
            okButtonProps={{ danger: true }}
            onConfirm={() => removeDraft(d.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
      children: (
        <div className="mt-2">
          {/* panel tạo phác đồ mới */}
          <TreatmentPlanDoctor
            customerId={customerId}
            onSaved={() => {
              // sau khi tạo xong -> refetch danh sách + xoá panel nháp
              refetch();
              removeDraft(d.id);
            }}
            role={role}
          />
        </div>
      ),
    }));

    return [...existing, ...draftItems];
  }, [serverPlans, drafts, customerId, refetch, removeDraft]);

  return (
    <div className="space-y-3">
      <Collapse items={items} bordered={false} />
    </div>
  );
}

export default function TreatmentPlanView({
  customerId,
  role,
  registerAddHandler,
}: Props) {
    // 👉 Giao diện cho bác sĩ: phác đồ đã lưu + auto tạo 1 panel nháp nếu rỗng
    return (
      <TreatmentPlanDoctorStack
        customerId={customerId}
        registerAddHandler={registerAddHandler}
        role={role}
      />
    );

}
