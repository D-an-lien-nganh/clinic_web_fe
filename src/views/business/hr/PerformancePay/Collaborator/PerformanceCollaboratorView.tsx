"use client";

import React, { useMemo, useState } from "react";
import { Table, Input, DatePicker, Button, Popover, InputNumber, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import CollaboratorReferralDetail from "./CollaboratorReferralDetail";
import { useGetCollaboratorRevenuesQuery } from "@/api/app_hr/apiHR";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface CollaboratorRow {
  id: number;
  index: number;
  name: string;
  referrals: number;
  invoices: number;
  revenueNum: number;   // số
  revenue: string;      // đã format hiển thị
  commissionPct: number; // %
  commissionAmt: string; // đã format
}

const fmtMoney = (n: number | undefined | null) => (n ?? 0).toLocaleString("vi-VN");

export default function PerformanceCollaboratorView() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTempPct, setEditingTempPct] = useState<number | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<number | null>(null);

  // % hoa hồng theo từng CTV — chỉ lưu ở FE
  const [commissions, setCommissions] = useState<Record<number, number>>({});

  // --- filter states ---
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [from, setFrom] = useState<Dayjs | null>(dayjs());
  const [to, setTo] = useState<Dayjs | null>(dayjs());

  const { data, isLoading, isError, refetch } = useGetCollaboratorRevenuesQuery({
    startDate: from ? from.format("YYYY-MM-DD") : undefined,
    endDate: to ? to.format("YYYY-MM-DD") : undefined,
    searchTerm: searchTerm || undefined,
  });

  // Build table rows with commission
  const tableData: CollaboratorRow[] = useMemo(() => {
    const list = data ?? [];
    return list.map((it, idx) => {
      const revenueNum = Number(it.total_revenue ?? 0);
      const pct = commissions[it.id] ?? 10; // mặc định 10%
      const commissionAmt = Math.round((revenueNum * pct) / 100);

      return {
        id: it.id,
        index: idx + 1,
        name: it.full_name || it.username || `CTV #${it.id}`,
        referrals: it.referrals ?? 0,
        invoices: it.invoices ?? 0,
        revenueNum,
        revenue: fmtMoney(revenueNum),
        commissionPct: pct,
        commissionAmt: fmtMoney(commissionAmt),
      };
    });
  }, [data, commissions]);

  const handleSave = (id: number) => {
    setCommissions(prev => ({
      ...prev,
      [id]: editingTempPct ?? (prev[id] ?? 10),
    }));
    setEditingId(null);
    setEditingTempPct(null);
  };

  const openDetailModal = (id: number) => {
    setSelectedCollaboratorId(id);
    setShowDetailModal(true);
  };

  const handleExportExcel = () => {
    if (!tableData || tableData.length === 0) {
      Modal.warning({ title: "Không có dữ liệu để export Excel" });
      return;
    }

    // chuẩn bị dữ liệu xuất
    const exportData = tableData.map((row) => ({
      "STT": row.index,
      "Họ và tên": row.name,
      "Lượt khách giới thiệu": row.referrals,
      "Số hóa đơn": row.invoices,
      "Tổng doanh thu": row.revenue,
      "% hoa hồng": row.commissionPct + "%",
      "Tổng tiền hoa hồng": row.commissionAmt,
    }));

    // tạo worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo CTV");

    // xuất file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `LuongHieuSuat-BaoCaoCTV-${dayjs().format("YYYYMMDD-HHmm")}.xlsx`);
  };


  const columns: ColumnsType<CollaboratorRow> = [
    { title: "STT", width: 60, dataIndex: "index", key: "index", align: "center" },
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
      align: "center",
      onCell: (record) => ({
        onClick: () => openDetailModal(record.id),
        style: { cursor: "pointer" },
      }),
    },
    { title: "Lượt khách giới thiệu", dataIndex: "referrals", key: "referrals", align: "center" },
    { title: "Số hóa đơn", dataIndex: "invoices", key: "invoices", align: "center" },
    { title: "Tổng doanh thu", dataIndex: "revenue", key: "revenue", align: "center" },
    {
      title: "% hoa hồng",
      dataIndex: "commissionPct",
      key: "commissionPct",
      align: "center",
      render: (val: number) => `${val}%`,
    },
    {
      title: "Tổng tiền hoa hồng",
      dataIndex: "commissionAmt",
      key: "commissionAmt",
      align: "center",
    },
    {
      title: "",
      key: "action",
      align: "center",
      render: (_: any, record) => (
        <Popover
          placement="bottomRight"
          overlayClassName="commission-popover"
          content={
            <div className="w-[260px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center text-yellow-600 font-medium gap-2">
                  <ExclamationCircleOutlined />
                  <span>Sửa % hoa hồng (FE)</span>
                </div>
                <InputNumber
                  placeholder="%"
                  className="flex-1"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={record.commissionPct}
                  onChange={(v) => setEditingTempPct(v)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="small" onClick={() => { setEditingId(null); setEditingTempPct(null); }}>
                  Đóng
                </Button>
                <Button
                  size="small"
                  type="primary"
                  style={{ backgroundColor: "#f59e0b", borderColor: "#f59e0b" }}
                  onClick={() => handleSave(record.id)}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          }
          trigger="click"
          open={editingId === record.id}
          onOpenChange={(visible) => setEditingId(visible ? record.id : null)}
        >
          <EditOutlined className="text-yellow-600 cursor-pointer" />
        </Popover>
      ),
    },
  ];

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
          <Button type="default" onClick={() => { handleExportExcel(); }}>Xuất Excel</Button>
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

      <Modal
        open={showDetailModal}
        title="Chi tiết lượt giới thiệu"
        onCancel={() => setShowDetailModal(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {selectedCollaboratorId && (
          <CollaboratorReferralDetail
            collaboratorId={selectedCollaboratorId}
            startDate={from?.format("YYYY-MM-DD")}
            endDate={to?.format("YYYY-MM-DD")}
          />
        )}
      </Modal>
    </div>
  );
}
