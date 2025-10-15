// Process.tsx
"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Tabs, Input, Button, Typography, TabsProps, Tag } from "antd";
import TreatmentTabs from "../components/TreatmentTabs";
import { AiOutlineFileExcel } from "react-icons/ai";
import { useGetBookingListQuery } from "@/api/app_treatment/apiTreatment";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { convertYMDToDMY } from "@/utils/convert"; // ✅ thêm import này

const { Title } = Typography;
const { Search } = Input;

const TAB_TYPE_MAP = {
  KVTV: "examination",
  TLCB: "treatment_cure",
  TLDS: "treatment_relax",
  TK: "re_examination",
} as const;
type TabKey = keyof typeof TAB_TYPE_MAP;

const Process = () => {
  const [activeKey, setActiveKey] = useState<TabKey>("KVTV");

  // text gõ trên input (UI state)
  const [searchText, setSearchText] = useState("");

  // state query cho BE (server state)
  const [pagination, setPagination] = useState<{
    current: number;
    pageSize: number;
    is_treatment?: boolean;
    time_frame_id?: number;
    searchTerm: string;
  }>({
    current: 1,
    pageSize: 10,
    is_treatment: undefined,
    time_frame_id: undefined,
    searchTerm: "",
  });

  const selectedType = useMemo(() => TAB_TYPE_MAP[activeKey], [activeKey]);

  // ✅ Debounce searchText -> pagination.searchTerm (400ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setPagination((p) => ({
        ...p,
        current: 1, // đổi text thì reset về trang 1
        searchTerm: searchText.trim(),
      }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchText, selectedType]); // đổi tab cũng nên sync lại

  // ✅ RTK Query tự refetch khi args đổi
  const {
    data: bookingData,
    isLoading,
    isFetching,
    refetch,
  } = useGetBookingListQuery(
    {
      page: pagination.current,
      pageSize: pagination.pageSize,
      time_frame_id: pagination.time_frame_id,
      searchTerm: pagination.searchTerm,
      types: selectedType,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Enter hoặc bấm “Tìm” -> sync ngay, không chờ debounce
  const commitSearch = useCallback(
    (value?: string) => {
      const val = (value ?? searchText).trim();
      setSearchText(val); // đảm bảo UI sync
      setPagination((p) => ({ ...p, current: 1, searchTerm: val }));
    },
    [searchText]
  );

  const clearSearch = useCallback(() => {
    setSearchText("");
    setPagination((p) => ({ ...p, current: 1, searchTerm: "" }));
  }, []);

  const items: TabsProps["items"] = [
    {
      key: "KVTV",
      label: "Khám và tư vấn",
      children: (
        <TreatmentTabs
          activeTab="KVTV"
          data={bookingData}
          refetch={refetch}
          loadingInitial={isLoading}
          loadingRefetch={isFetching}
        />
      ),
    },
    {
      key: "TLCB",
      label: "Trị liệu chữa bệnh",
      children: (
        <TreatmentTabs
          activeTab="TLCB"
          data={bookingData}
          refetch={refetch}
          loadingInitial={isLoading}
          loadingRefetch={isFetching}
        />
      ),
    },
    {
      key: "TLDS",
      label: "Trị liệu dưỡng sinh",
      children: (
        <TreatmentTabs
          activeTab="TLDS"
          data={bookingData}
          refetch={refetch}
          loadingInitial={isLoading}
          loadingRefetch={isFetching}
        />
      ),
    },
    {
      key: "TK",
      label: "Tái khám",
      children: (
        <TreatmentTabs
          activeTab="TK"
          data={bookingData}
          refetch={refetch}
          loadingInitial={isLoading}
          loadingRefetch={isFetching}
        />
      ),
    },
  ];

  // =======================
  // Helpers giống TreatmentTabs
  // =======================
  const code = (r: any) => r?.customer_info?.code ?? r?.customer_code ?? "—";
  const name = (r: any) => r?.customer_info?.name ?? r?.full_name ?? "—";
  const mobile = (r: any) => r?.customer_info?.mobile ?? r?.phone_number ?? "—";
  const email = (r: any) => r?.customer_info?.email ?? r?.email ?? "—";
  const doctor = (r: any) =>
    r?.doctor_details?.doctor_fullname ?? r?.doctor_fullname ?? "—";
  const note = (r: any) => r?.note ?? "—";

  const treatingDoctor = (r: any) =>
    r?.treating_doctor?.full_name ||
    r?.treating_doctor?.username ||
    r?.treating_doctor?.email ||
    "—";

  const TYPE_LABELS: Record<string, string> = {
    TLDS: "Trị liệu dưỡng sinh",
    TLCB: "Trị liệu chữa bệnh",
  };
  const planType = (r: any) =>
    TYPE_LABELS[r?.latest_plan_type as string] ?? r?.latest_plan_type ?? "";

  const planStatus = (r: any) =>
    r?.latest_plan_status?.label ??
    r?.latest_plan_status?.code ??
    r?.status_display ??
    r?.status ??
    "";

  // Lấy chuỗi ngày gốc nếu BE đã format sẵn
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

  const renderNgayHen = (r: any) => {
    // 1) BE đã format sẵn: trả nguyên
    if (r?.time_frame_str || r?.scheduled_at_str || r?.reexamination_date_str) {
      return rawDateLike(r) || "—";
    }
    // 2) Tự ghép receiving_day + set_date
    const isoDay = pickISODate(r?.receiving_day ?? r?.reexamination_date ?? "");
    if (isoDay && /^\d{4}-\d{2}-\d{2}$/.test(isoDay)) {
      const dmy = convertYMDToDMY(isoDay);
      const hhmm = toHHmm(r?.set_date);
      return (hhmm ? `${hhmm} - ${dmy}` : dmy) || "—";
    }
    // 3) Fallback
    return rawDateLike(r) || "—";
  };

  // =======================
  // Xuất Excel khớp UI
  // =======================
  const handleExportExcel = useCallback(() => {
    const rows = bookingData?.results ?? [];
    if (!rows.length) {
      console.warn("Không có dữ liệu để export Excel");
      return;
    }

    let headers: string[] = [];
    let buildRow: (r: any, idx: number) => any[] = () => [];

    if (activeKey === "KVTV" || activeKey === "TLCB") {
      // ĐÚNG NHƯ CỘT columnsKVTV
      headers = [
        "STT",
        "Mã KH",
        "Họ và tên",
        "SĐT",
        "Email",
        "Ngày hẹn",
        "Ghi chú",
      ];
      buildRow = (r, idx) => [
        idx + 1,
        code(r),
        name(r),
        mobile(r),
        email(r),
        renderNgayHen(r),
        note(r),
      ];
    } else if (activeKey === "TLDS") {
      // ĐÚNG NHƯ CỘT columnsTL
      headers = [
        "STT",
        "Mã KH",
        "Họ và tên",
        "SĐT",
        "Email",
        "Bác sĩ điều trị",
        "Loại đơn",
        "Trạng thái",
        "Ngày hẹn",
      ];
      buildRow = (r, idx) => [
        idx + 1,
        code(r),
        name(r),
        mobile(r),
        email(r),
        treatingDoctor(r),
        planType(r),
        planStatus(r),
        renderNgayHen(r),
      ];
    } else {
      // TK - ĐÚNG NHƯ CỘT columnsTK
      headers = [
        "STT",
        "Mã KH",
        "Họ và tên",
        "SĐT",
        "Email",
        "Bác sĩ khám",
        "Ngày hẹn",
        "Ghi chú",
      ];
      buildRow = (r, idx) => [
        idx + 1,
        code(r),
        name(r),
        mobile(r),
        email(r),
        doctor(r),
        renderNgayHen(r),
        note(r),
      ];
    }

    const data = rows.map((r: any, idx: number) => buildRow(r, idx));

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSach");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `booking-${activeKey}.xlsx`);
  }, [bookingData, activeKey]);

  return (
    <div className="min-h-[calc(100vh-70px)] p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="m-0">
          📋 Quy trình điều trị
        </Title>

        <div className="flex items-center gap-4">
          {/* Dùng Input.Search để có Enter & nút bấm */}
          <Search
            placeholder="Nhập mã hoặc tên khách"
            className="rounded-lg w-[300px]"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            onSearch={(val) => commitSearch(val)}
            enterButton="Tìm"
          />

          <Button
            type="primary"
            icon={<AiOutlineFileExcel size={20} />}
            className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
            onClick={handleExportExcel}
            loading={isFetching || isLoading}
            disabled={isFetching || isLoading}
          >
            Xuất Excel
          </Button>

          {/* <Button type="primary" danger icon={<AiOutlineFilePdf size={20} />}>
            Xuất PDF
          </Button> */}
        </div>
      </div>

      <Tabs
        className="mt-6"
        activeKey={activeKey}
        destroyInactiveTabPane
        onChange={(key) => {
          setActiveKey(key as TabKey);
          // đổi tab => reset page, giữ nguyên search hiện tại (UX hay hơn)
          setPagination((p) => ({ ...p, current: 1 }));
        }}
        items={items}
      />
    </div>
  );
};

export default Process;
