"use client";

import React from "react";
import { Empty } from "antd";
import ExaminationOrderPanelList from "./ExaminationOrderPanelList";

type Props = {
  customerId?: string | null;
  role: "receptionist" | "doctor";
  /** Khi tạo mới đơn khám cần biết booking liên quan (nếu backend yêu cầu) */
  bookingId?: number;
};

export default function MedicalOrderView({ customerId, role, bookingId }: Props) {
  if (!customerId) {
    return (
      <Empty description="Chưa có khách hàng được chọn" />
    );
  }

  return (
    <ExaminationOrderPanelList
      customerId={String(customerId)}
      role={role}
      defaultBookingId={bookingId}
    />
  );
}
