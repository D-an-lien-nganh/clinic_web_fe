"use client";

import React from "react";
import { Empty } from "antd";
import PrescriptionPanelList from "./PrescriptionPanelList";

type Props = {
  customerId?: string | null;
  role: "receptionist" | "doctor";
  /** Khi tạo mới DoctorProcess cần CE id */
  defaultClinicalExaminationId?: number;
  registerAddHandler?: (fn: (() => void) | undefined) => void;
};

export default function PrescriptionView({
  customerId,
  role,
  registerAddHandler,
  defaultClinicalExaminationId,
}: Props) {
  if (!customerId) return <Empty description="Chưa có khách hàng được chọn" />;

  return (
    <PrescriptionPanelList
      customerId={String(customerId)}
      role={role}
      defaultClinicalExaminationId={defaultClinicalExaminationId}
      registerAddHandler={registerAddHandler}
    />
  );
}