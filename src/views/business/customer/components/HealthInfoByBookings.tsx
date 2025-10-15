"use client";
import React, { useMemo, useEffect } from "react";
import { Collapse, Skeleton, Empty } from "antd";
import {
  useGetBookingListQuery,
  useGetDoctorHealthCheckListQuery,
} from "@/api/app_treatment/apiTreatment";
import { convertYMDToDMY } from "@/utils/convert";
import HealthPanel from "./HealthPanel";

const { Panel } = Collapse;

function hhmm(setTime?: string) {
  if (!setTime) return "";
  const [h = "", m = ""] = setTime.split(":");
  return h && m ? `${h}:${m}` : setTime;
}

type Props = { 
  customerId: number;
  onHealthDataChange?: (latestHealth: any) => void; // 🔥 Callback để truyền data lên cha
};

export default function HealthInfoByBookings({ customerId, onHealthDataChange }: Props) {
  const {
    data: healthRes,
    isFetching: loadingHealth,
    refetch: refetchHealth,
  } = useGetDoctorHealthCheckListQuery({ customer_id: customerId });

  const {
    data: bookingRes,
    isFetching: loadingBooking,
    refetch: refetchBooking,
  } = useGetBookingListQuery({
    page: 1,
    pageSize: 999,
    customer: customerId,
  } as any);

  const bookings = useMemo(() => bookingRes?.results ?? [], [bookingRes]);

  // 🔥 Lấy health record mới nhất của customer
  const latestHealthRecord = useMemo(() => {
    const list = (healthRes as any)?.results ?? healthRes ?? [];
    // Có thể có nhiều records, lấy cái có id lớn nhất (mới nhất)
    if (!list.length) return null;
    
    return list.reduce((latest: any, current: any) => {
      if (!latest) return current;
      return current.id > latest.id ? current : latest;
    }, null);
  }, [healthRes]);

  // 🔥 Truyền data lên component cha mỗi khi có thay đổi
  useEffect(() => {
    if (latestHealthRecord && onHealthDataChange) {
      onHealthDataChange(latestHealthRecord);
    }
  }, [latestHealthRecord, onHealthDataChange]);

  // Lọc và sắp xếp bookings
  const sortedFilteredBookings = useMemo(() => {
    return [...bookings]
      .filter((bk: any) => 
        bk.type === "examination" || bk.type === "re_examination"
      )
      .sort((a: any, b: any) => {
        const ad = new Date(
          `${a?.receiving_day ?? "1970-01-01"}T${a?.set_date ?? "00:00:00"}`
        );
        const bd = new Date(
          `${b?.receiving_day ?? "1970-01-01"}T${b?.set_date ?? "00:00:00"}`
        );
        return bd.getTime() - ad.getTime(); // Mới nhất lên đầu
      });
  }, [bookings]);

  if (loadingBooking || loadingHealth) return <Skeleton active />;
  
  if (!sortedFilteredBookings.length) {
    return <Empty description="Khách hàng chưa có lịch khám/tái khám" />;
  }

  const handleReload = async () => {
    await Promise.all([refetchHealth(), refetchBooking()]);
  };

  return (
    <Collapse
      bordered={false}
      defaultActiveKey={[]}
      accordion={false}
    >
      {sortedFilteredBookings.map((bk: any, idx: number) => {
        const header = `Lần ${sortedFilteredBookings.length - idx}: ${hhmm(bk?.set_date)}${
          bk?.set_date ? ", " : ""
        }${convertYMDToDMY(bk?.receiving_day || "")}`;

        return (
          <Panel 
            key={bk.id}
            header={header}
          >
            <HealthPanel
              booking={bk}
              health={latestHealthRecord}
              customerId={customerId}
              onReload={handleReload}
            />
          </Panel>
        );
      })}
    </Collapse>
  );
}