"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  Table, Input, Button, DatePicker, Typography, Space, Tag, Select,
} from "antd";
import { AiOutlineFileExcel, AiOutlineFilePdf } from "react-icons/ai";
import { FiSearch, FiFilter, FiFileText } from "react-icons/fi";
import dayjs, { Dayjs } from "dayjs";
import type { ColumnType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useGetTreatmentReportQuery } from "@/api/app_treatment/treatmentReportApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const { Title } = Typography;
const { RangePicker } = DatePicker;

// ------- Types -------
type TreatmentReportRow = {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  mobile: string;
  treatment_type?: string | null;
  total_sessions: number;
  done_sessions: number;
  remaining_sessions: number;
  status: string; // "Đã hoàn thành" | "Chưa hoàn thành"
};

// debounce nhỏ để tránh call API liên tục khi gõ
function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const Report: React.FC = () => {
  const router = useRouter();

  // ===== Bộ lọc =====
  const [searchText, setSearchText] = useState<string>("");
  const debouncedSearch = useDebounce(searchText);

  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("day"),
    dayjs().startOf("day"),
  ]);

  const [serviceType, setServiceType] = useState<"TLCB" | "TLDS" | undefined>(
    undefined
  );

  // Map filter -> params API
  const startDate = range?.[0]?.format("YYYY-MM-DD");
  const endDate = range?.[1]?.format("YYYY-MM-DD");

  const { data, error, isLoading } = useGetTreatmentReportQuery(
    {
      search: debouncedSearch || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      serviceType,
    },
    { refetchOnMountOrArgChange: true }
  );

  const role = "receptionist" as const;

  const goToCustomerCare = (id: number, tab = "1") => {
    router.push(
      `/app/customer/customer-info?tab=${tab}&customerId=${id}&role=${role}`
    );
  };

  // Chuẩn hóa dataSource (thêm key)
  const rows: TreatmentReportRow[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  // ===== Cột table =====
  const columns: ColumnType<TreatmentReportRow>[] = [
    {
      title: "STT",
      key: "index",
      align: "center",
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      key: "customer_code",
      title: "Mã KH",
      dataIndex: "customer_code",
      align: "center",
      width: 140,
    },
    {
      key: "customer_name",
      title: "Họ và tên",
      dataIndex: "customer_name",
      align: "center",
      render: (text: string, record) => (
        <span
          onClick={() => goToCustomerCare(record.customer_id, "1")}
          className="cursor-pointer hover:text-blue-600 hover:underline"
        >
          {text}
        </span>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "mobile",
      key: "mobile",
      align: "center",
      width: 160,
      render: (mobile: string) => mobile || "—",
    },
    {
      title: "Loại trị liệu",
      key: "treatment_type",
      dataIndex: "treatment_type",
      align: "center",
      width: 160,
      render: (v: string | null) => v || "—",
    },
    {
      title: "Tổng buổi điều trị",
      key: "total_sessions",
      dataIndex: "total_sessions",
      align: "center",
      width: 160,
    },
    {
      title: "Số buổi đã điều trị",
      key: "done_sessions",
      dataIndex: "done_sessions",
      align: "center",
      width: 160,
    },
    {
      title: "Số buổi còn lại",
      key: "remaining_sessions",
      dataIndex: "remaining_sessions",
      align: "center",
      width: 160,
    },
    {
      title: "Trạng thái",
      key: "status",
      dataIndex: "status",
      align: "center",
      width: 180,
      render: (status: string) => {
        const isDone = status?.toLowerCase().includes("hoàn thành");
        return <Tag color={isDone ? "blue" : "gold"}>{status}</Tag>;
      },
    },
  ];

  const handleExportExcel = () => {
    if (!rows || rows.length === 0) {
      alert("Không có dữ liệu để export Excel");
      return;
    }

    // 1. Chuẩn bị dữ liệu Excel
    const exportData = rows.map((r, idx) => ({
      STT: idx + 1,
      "Mã KH": r.customer_code,
      "Họ và tên": r.customer_name,
      "Số điện thoại": r.mobile || "",
      "Loại trị liệu": r.treatment_type || "",
      "Tổng buổi điều trị": r.total_sessions,
      "Số buổi đã điều trị": r.done_sessions,
      "Số buổi còn lại": r.remaining_sessions,
      "Trạng thái": r.status,
    }));

    // 2. Tạo worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");

    // 3. Xuất file Excel
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `BaoCaoChiTiet-${dayjs().format("YYYYMMDD-HHmm")}.xlsx`);
  };



  return (
    <div className="min-h-[calc(100vh-70px)] p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="m-0 flex items-center gap-2">
          <span className="inline-flex w-8 h-8 items-center justify-center rounded-md bg-gray-100">
            <FiFileText className="text-gray-400" size={18} />
          </span>
          Báo cáo chi tiết
        </Title>

        <Space size="middle" align="center" wrap>
          {/* Search => search param */}
          <Input
            placeholder="Nhập tên khách hàng"
            className="rounded-lg w-[260px]"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<FiSearch className="text-gray-400" size={18} />}
            allowClear
          />

          {/* Range date => startDate, endDate */}
          <RangePicker
            className="rounded-lg"
            value={range}
            onChange={(val) => setRange([val?.[0] ?? null, val?.[1] ?? null])}
            format="DD/MM/YYYY"
            allowClear
          />

          {/* Service type => serviceType */}
          <Select
            placeholder="Loại trị liệu"
            className="w-[160px]"
            value={serviceType}
            allowClear
            onChange={(v) => setServiceType(v as any)}
            options={[
              { label: "Tất cả", value: undefined },
              { label: "TLCB", value: "TLCB" },
              { label: "TLDS", value: "TLDS" },
            ]}
          />

          <Button
            type="primary"
            icon={<AiOutlineFileExcel size={20} />}
            className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
            onClick={handleExportExcel}
          >
            Xuất Excel
          </Button>
          {/* <Button
            type="primary"
            danger
            icon={<AiOutlineFilePdf size={20} />}
            onClick={handleExportPDF}
          >
            Xuất PDF
          </Button> */}
        </Space>
      </div>

      {error && <p className="text-red-500">Lỗi khi tải dữ liệu.</p>}

      <Table<TreatmentReportRow>
        className="report-table"
        loading={isLoading}
        columns={columns}
        dataSource={rows}
        rowKey={(r) => `${r.customer_id}-${r.customer_code}`}
        pagination={{ pageSize: 10 }}
        size="middle"
        bordered={false}
      />

      {/* style giống hình minh hoạ */}
      <style jsx global>{`
        .report-table .ant-table-container {
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          overflow: hidden;
        }
        .report-table .ant-table-thead > tr > th {
          background: #eef6ff !important; /* xanh nhạt */
          color: #111827;
          font-weight: 600;
        }
        .report-table .ant-table-tbody > tr > td {
          background: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default Report;
