"use client";

import React, { useMemo, useState } from "react";
import { Table, Input, DatePicker, Button, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useGetActorLeadSourcePerformanceQuery } from "@/api/app_hr/apiHR";
import dayjs, { Dayjs } from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ActorRow {
  id: number;
  index: number;
  name: string;
  leadSource: string;   // Thêm cột LeadSource
  referrals: number;
  invoices: number;
  revenueNum: number;   // số
  revenue: string;      // đã format hiển thị
  commissionPct: number; // % hoa hồng
  commissionAmt: string; // đã format
}

const fmtMoney = (n: number | undefined | null) => (n ?? 0).toLocaleString("vi-VN");

export default function ActorLeadSourcePerformanceView() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [from, setFrom] = useState<Dayjs | null>(dayjs());
  const [to, setTo] = useState<Dayjs | null>(dayjs());

  const { data, isLoading, isError, refetch } = useGetActorLeadSourcePerformanceQuery({
    startDate: from ? from.format("YYYY-MM-DD") : undefined,
    endDate: to ? to.format("YYYY-MM-DD") : undefined,
    searchTerm: searchTerm || undefined,
  });

  // Build table rows
  const tableData: ActorRow[] = useMemo(() => {
    const list = data ?? [];
    return list.map((it, idx) => {
      const revenueNum = Number(it.total_revenue ?? 0);
      const commissionPct = 10; // mặc định 10%
      const commissionAmt = Math.round((revenueNum * commissionPct) / 100);

      return {
        id: it.actor_id,
        index: idx + 1,
        name: it.full_name || `Actor #${it.actor_id}`,
        leadSource: it.lead_source || "N/A",  // LeadSource
        referrals: it.total_customers ?? 0,
        invoices: it.total_customers ?? 0,
        revenueNum,
        revenue: fmtMoney(revenueNum),
        commissionPct,
        commissionAmt: fmtMoney(commissionAmt),
      };
    });
  }, [data]);

  const columns: ColumnsType<ActorRow> = [
    { title: "STT", width: 60, dataIndex: "index", key: "index", align: "center" },
    { title: "Họ và tên", dataIndex: "name", key: "name", align: "center" },
    { title: "Nguồn khách", dataIndex: "leadSource", key: "leadSource", align: "center" },
    { title: "Lượt khách giới thiệu", dataIndex: "referrals", key: "referrals", align: "center" },
    { title: "Số hóa đơn", dataIndex: "invoices", key: "invoices", align: "center" },
    { title: "Tổng doanh thu", dataIndex: "revenue", key: "revenue", align: "center" },
    { title: "% hoa hồng", dataIndex: "commissionPct", key: "commissionPct", align: "center" },
    { title: "Tổng tiền hoa hồng", dataIndex: "commissionAmt", key: "commissionAmt", align: "center" },
  ];

  const handleExportExcel = () => {
    if (!tableData || tableData.length === 0) {
      return;
    }

    // map lại dữ liệu để xuất
    const exportData = tableData.map((row) => ({
      "STT": row.index,
      "Họ và tên": row.name,
      "Nguồn khách": row.leadSource,
      "Lượt khách giới thiệu": row.referrals,
      "Số hóa đơn": row.invoices,
      "Tổng doanh thu": row.revenue,
      "% hoa hồng": row.commissionPct + "%",
      "Tổng tiền hoa hồng": row.commissionAmt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `LuongHieuSuat-BaoCaoNguonCachKhac-${dayjs().format("YYYYMMDD-HHmm")}.xlsx`);
  };

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex flex-nowrap items-center gap-4 mb-4 overflow-x-auto">
        <Input
          placeholder="Nhập mã nhân viên, tên, SDT, email"
          className="max-w-[220px] w-full flex-shrink-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onPressEnter={() => refetch()}
        />
        <div className="flex gap-2 items-center flex-shrink-0">
          <span>Từ ngày*:</span>
          <DatePicker value={from} onChange={(v) => setFrom(v)} />
          <span>Đến ngày*:</span>
          <DatePicker value={to} onChange={(v) => setTo(v)} />
          <Button type="primary" onClick={() => refetch()}>Lọc</Button>
          <Button type="default" onClick={() => { handleExportExcel() }}>Xuất Excel</Button>
        </div>
      </div>

      <Table
        rowKey="id"
        dataSource={tableData}
        columns={columns}
        bordered
        loading={isLoading}
        locale={{ emptyText: isError ? "Lỗi tải dữ liệu" : "Không có dữ liệu" }}
        pagination={false}
      />
    </div>
  );
}
