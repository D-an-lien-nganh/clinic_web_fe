"use client";
import React from "react";
import { Table } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { convertYMDToDMY } from "@/utils/convert";

type PropsType = {
  activeTab: "KVTV" | "TLCB" | "TLDS" | "TK";
  data?: any;
  loadingInitial?: boolean;
  loadingRefetch?: boolean;
  refetch?: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  TLDS: "Trị liệu dưỡng sinh",
  TLCB: "Trị liệu chữa bệnh",
};

const treatingDoctor = (r: any) =>
  r?.treating_doctor?.full_name ||
  r?.treating_doctor?.username ||
  r?.treating_doctor?.email ||
  "";

const planType = (r: any) =>
  TYPE_LABELS[r?.latest_plan_type as string] ?? r?.latest_plan_type ?? "";

const planStatus = (r: any) =>
  r?.latest_plan_status?.label ??
  r?.latest_plan_status?.code ??
  r?.status_display ??
  r?.status ??
  "";

const TreatmentTabs = ({
  activeTab,
  data,
  loadingInitial,
  loadingRefetch,
}: PropsType) => {
  const router = useRouter();
  const isCollapse = useSelector(
    (state: RootState) => state.collapse.isCollapse
  );
  const rows = data?.results ?? [];

  // ===== Helpers =====
  const code = (r: any) => r?.customer_info?.code ?? r?.customer_code ?? "";
  const name = (r: any) => r?.customer_info?.name ?? r?.full_name ?? "";
  const mobile = (r: any) => r?.customer_info?.mobile ?? r?.phone_number ?? "";
  const email = (r: any) => r?.customer_info?.email ?? r?.email ?? "";
  const doctor = (r: any) =>
    r?.doctor_details?.doctor_fullname ?? r?.doctor_fullname ?? "";
  const note = (r: any) => r?.note ?? "";

  const rawDateLike = (r: any) =>
    r?.time_frame_str ??
    r?.scheduled_at_str ??
    r?.reexamination_date_str ??
    r?.receiving_day ??
    r?.reexamination_date ??
    "";

  const pickISODate = (v?: string) => {
    if (!v) return "";
    if (v.includes("T")) return v.split("T")[0];
    const m = v.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : v;
  };

  const toHHmm = (t?: string) => {
    if (!t) return "";
    const parts = t.split(":");
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
  };

  // 🔹 Build sortable Date from record (ưu tiên scheduled_at nếu có)
  const getSortableDate = (r: any): Date | null => {
    // Nếu có ISO datetime sẵn
    const scheduledAt =
      r?.scheduled_at ??
      (typeof r?.scheduled_at_str === "string" &&
      r.scheduled_at_str.match(/^\d{4}-\d{2}-\d{2}T/)
        ? r.scheduled_at_str
        : null);

    if (scheduledAt) {
      const d = new Date(scheduledAt);
      return isNaN(d.getTime()) ? null : d;
    }

    // Ghép date + time
    const dateStr =
      pickISODate(r?.receiving_day) || pickISODate(r?.reexamination_date);
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

    const timeStr = r?.set_date
      ? (() => {
          // Chuẩn hoá thành HH:mm:ss
          const hhmm = toHHmm(r.set_date); // HH:mm
          return hhmm && /^\d{2}:\d{2}$/.test(hhmm) ? `${hhmm}:00` : r.set_date;
        })()
      : "00:00:00";

    const dtStr = `${dateStr}T${timeStr}`;
    const d = new Date(dtStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const isToday = (d: Date | null) => {
    if (!d) return false;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    return (
      d.getFullYear() === yyyy && d.getMonth() === mm && d.getDate() === dd
    );
  };

  const renderNgayHen = (r: any) => {
    if (r?.time_frame_str || r?.scheduled_at_str || r?.reexamination_date_str) {
      return rawDateLike(r);
    }
    const isoDay = pickISODate(r?.receiving_day ?? r?.reexamination_date ?? "");
    if (isoDay && /^\d{4}-\d{2}-\d{2}$/.test(isoDay)) {
      const dmy = convertYMDToDMY(isoDay);
      const hhmm = toHHmm(r?.set_date);
      return hhmm ? `${hhmm} - ${dmy}` : dmy;
    }
    return rawDateLike(r);
  };

  const customerId = (r: any) =>
    r?.customer ?? r?.customer_info?.id ?? r?.customer_id ?? null;

  const goToCustomer = (r: any, tab = "1") => {
    const id = customerId(r);
    const role = "doctor" as "doctor" | "receptionist";
    if (id)
      router.push(
        `/app/customer/customer-info?tab=${tab}&customerId=${id}&role=${role}`
      );
  };

  // 🔥 Sort: hôm nay lên trước, rồi theo datetime desc
  const sortedRows = React.useMemo(() => {
    const cloned = [...rows];
    return cloned
      .map((r) => {
        const dt = getSortableDate(r);
        return { r, dt, todayWeight: isToday(dt) ? 0 : 1 };
      })
      .sort((a, b) => {
        // Ưu tiên hôm nay
        if (a.todayWeight !== b.todayWeight) {
          return a.todayWeight - b.todayWeight; // 0 (today) trước 1 (khác hôm nay)
        }
        // Sau đó sort theo datetime desc (lớn -> nhỏ)
        const ta = a.dt ? a.dt.getTime() : -Infinity;
        const tb = b.dt ? b.dt.getTime() : -Infinity;
        return tb - ta;
      })
      .map((x) => x.r);
  }, [rows]);

  // ===== Columns =====
  const columnsKVTV = [
    { title: "#", align: "center" as const, render: (_: any, __: any, i: number) => i + 1, width: 60 },
    { title: "Mã KH", align: "center" as const, render: (_: any, r: any) => code(r) },
    {
      title: "Họ và tên",
      align: "center" as const,
      render: (_: any, r: any) => (
        <span
          className="cursor-pointer hover:text-blue-600 hover:underline"
          onClick={() => goToCustomer(r, "1")}
        >
          {name(r)}
        </span>
      ),
    },
    { title: "SĐT", align: "center" as const, render: (_: any, r: any) => mobile(r) },
    { title: "Email", align: "center" as const, render: (_: any, r: any) => email(r) },
    { title: "Ngày hẹn", align: "center" as const, render: (_: any, r: any) => renderNgayHen(r) },
    { title: "Ghi chú", align: "center" as const, render: (_: any, r: any) => note(r) },
  ];

  const columnsTL = [
    { title: "#", align: "center" as const, render: (_: any, __: any, i: number) => i + 1, width: 60 },
    { title: "Mã KH", align: "center" as const, render: (_: any, r: any) => code(r) },
    {
      title: "Họ và tên",
      align: "center" as const,
      render: (_: any, r: any) => (
        <span
          className="cursor-pointer hover:text-blue-600 hover:underline"
          onClick={() => goToCustomer(r, "1")}
        >
          {name(r)}
        </span>
      ),
    },
    { title: "SĐT", align: "center" as const, render: (_: any, r: any) => mobile(r) },
    { title: "Email", align: "center" as const, render: (_: any, r: any) => email(r) },
    { title: "Bác sĩ điều trị", align: "center" as const, render: (_: any, r: any) => treatingDoctor(r) },
    { title: "Loại đơn", align: "center" as const, render: (_: any, r: any) => planType(r) },
    { title: "Trạng thái", align: "center" as const, render: (_: any, r: any) => planStatus(r) },
    { title: "Ngày hẹn", align: "center" as const, render: (_: any, r: any) => renderNgayHen(r) },
  ];

  const columnsTK = [
    { title: "#", align: "center" as const, render: (_: any, __: any, i: number) => i + 1, width: 60 },
    { title: "Mã KH", align: "center" as const, render: (_: any, r: any) => code(r) },
    {
      title: "Họ và tên",
      align: "center" as const,
      render: (_: any, r: any) => (
        <span
          className="cursor-pointer hover:text-blue-600 hover:underline"
          onClick={() => goToCustomer(r, "1")}
        >
          {name(r)}
        </span>
      ),
    },
    { title: "SĐT", align: "center" as const, render: (_: any, r: any) => mobile(r) },
    { title: "Email", align: "center" as const, render: (_: any, r: any) => email(r) },
    { title: "Bác sĩ khám", align: "center" as const, render: (_: any, r: any) => doctor(r) },
    { title: "Ngày hẹn", align: "center" as const, render: (_: any, r: any) => renderNgayHen(r) },
    { title: "Ghi chú", align: "center" as const, render: (_: any, r: any) => note(r) },
  ];

  const columns =
    activeTab === "KVTV"
      ? columnsKVTV
      : activeTab === "TLCB"
      ? columnsKVTV
      : activeTab === "TLDS"
      ? columnsTL
      : columnsTK;

  const spinning = Boolean(loadingInitial || loadingRefetch);
  const tip = loadingInitial
    ? "Đang tải dữ liệu…"
    : loadingRefetch
    ? "Đang cập nhật danh sách…"
    : undefined;

  return (
    <div
      className={`overflow-x-auto w-screen ${
        isCollapse ? "md:w-[calc(100vw-200px)]" : "md:w-[calc(100vw-350px)]"
      }`}
    >
      <Table
        loading={{ spinning, tip }}
        columns={columns}
        dataSource={sortedRows} 
        rowKey={(r) => r?.id ?? `${code(r)}-${rawDateLike(r)}`}
        bordered
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default TreatmentTabs;
