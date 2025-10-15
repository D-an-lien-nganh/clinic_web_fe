"use client";

import React from "react";
import { Table, Input, DatePicker, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { useGetPayrollQuery } from "@/api/app_treatment/apiTreatment";
import TechnicianDetailModal from "./TechnicianDetailModal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface TechnicianPerformance {
  hr_id: number | null; // expert user_id
  index: number;
  name: string;
  position: string | null;
  contract: string;
  treatment: number; // count_tlcb
  care: number; // count_tlds
  salary: string;
}

export default function PerformanceTechnicianView() {
  const [from, setFrom] = React.useState<Dayjs>(dayjs().startOf("month"));
  const [to, setTo] = React.useState<Dayjs>(dayjs());
  const [search, setSearch] = React.useState<string>("");

  const [openDetail, setOpenDetail] = React.useState(false);
  const [expertId, setExpertId] = React.useState<number | null>(null);
  const [expertName, setExpertName] = React.useState<string>("");

  const { data, isFetching } = useGetPayrollQuery({
    startDate: from.format("YYYY-MM-DD"),
    endDate: to.format("YYYY-MM-DD"),
    search,
  });

  // 🔑 Chuẩn hoá ID từ payload payroll
  const getExpertId = (r: any) => r.hr_id;
  const columns: ColumnsType<TechnicianPerformance> = [
    {
      title: "STT",
      width: 60,
      dataIndex: "index",
      key: "index",
      align: "center",
    },
    { title: "Họ và tên", dataIndex: "name", key: "name", align: "center" },
    {
      title: "Chức vụ",
      dataIndex: "position",
      key: "position",
      align: "center",
    },
    {
      title: "Hợp đồng",
      dataIndex: "contract",
      key: "contract",
      align: "center",
    },
    {
      title: "Trị liệu chữa bệnh",
      dataIndex: "treatment",
      key: "treatment",
      align: "center",
    },
    {
      title: "Trị liệu dưỡng sinh",
      dataIndex: "care",
      key: "care",
      align: "center",
    },
    {
      title: "Lương hiệu suất",
      dataIndex: "salary",
      key: "salary",
      align: "center",
    },
    {
      title: "",
      key: "action",
      align: "center",
      render: (_v, record) => (
        <Button
          type="link"
          onClick={() => {
            if (record.hr_id == null) {
              message.warning(
                "Không tìm được ID nhân sự (user_id) để xem chi tiết."
              );
              return;
            }
            setExpertId(record.hr_id);
            setExpertName(record.name);
            setOpenDetail(true);
          }}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const tableData: TechnicianPerformance[] = React.useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    return rows.map((r: any, idx: number) => ({
      hr_id: getExpertId(r),
      index: idx + 1,
      name: r.full_name ?? r.username ?? "",
      position: r.position ?? null,
      contract: r.contract ?? "Chính thức",
      treatment: r.count_tlcb ?? 0,
      care: r.count_tlds ?? 0,
      salary: Number(r.salary ?? 0).toLocaleString("vi-VN"),
    }));
  }, [data]);

  // ✅ Xuất Excel đúng dữ liệu hiển thị
  const handleExportExcel = () => {
    if (!tableData.length) {
      message.warning("Không có dữ liệu để xuất Excel.");
      return;
    }

    const exportData = tableData.map((row) => ({
      "STT": row.index,
      "Họ và tên": row.name,
      "Chức vụ": row.position ?? "",
      "Hợp đồng": row.contract,
      "Trị liệu chữa bệnh": row.treatment,
      "Trị liệu dưỡng sinh": row.care,
      "Lương hiệu suất": row.salary,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hiệu suất kỹ thuật viên");

    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "LuongHieuSuat-BaoCaoKTV.xlsx");
  };

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          placeholder="Nhập mã nhân viên, tên, SDT, email"
          className="max-w-[240px] w-full"
          allowClear
          onPressEnter={(e) => setSearch((e.target as HTMLInputElement).value)}
          onBlur={(e) => setSearch((e.target as HTMLInputElement).value)}
        />
        <div className="flex gap-2 items-center">
          <span>Từ ngày*:</span>
          <DatePicker value={from} onChange={(d) => d && setFrom(d)} />
          <span>Đến ngày*:</span>
          <DatePicker value={to} onChange={(d) => d && setTo(d)} />
          <Button type="primary" loading={isFetching}>
            Lọc
          </Button>
          <Button type="default"
            onClick={() => { handleExportExcel(); }}
          >Xuất Excel</Button>
        </div>
      </div>

      <Table
        rowKey={(r, i) =>
          r.hr_id != null ? `emp-${r.hr_id}` : `row-${i}-${r.name}`
        }
        dataSource={tableData}
        columns={columns}
        bordered
        loading={isFetching}
        locale={{ emptyText: "Không có dữ liệu" }}
      />

      <TechnicianDetailModal
        key={expertId ?? "none"} // reset state modal khi đổi nhân sự
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        expertId={expertId}
        expertName={expertName}
      />
    </div>
  );
}
