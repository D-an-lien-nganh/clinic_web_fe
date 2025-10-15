// app/(...)/CollaboratorReferralDetail.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Table, Pagination } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useGetCollaboratorCustomersQuery } from "@/api/app_hr/apiHR";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const fmtMoney = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString("vi-VN");

type Invoice = { created: string; invoice_type: string; revenue: number };

type CustomerRow = {
  id: number;
  name: string;
  phone: string;
  service?: string; // chưa có từ BE, để dự phòng UI
  totalRevenue: number;
  invoices: Invoice[];
};

export default function CollaboratorReferralDetail({
  collaboratorId,
  startDate,
  endDate,
  searchTerm,
}: {
  collaboratorId: number;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}) {
  const { data, isLoading, isError } = useGetCollaboratorCustomersQuery({
    userId: collaboratorId,
    startDate,
    endDate,
    searchTerm,
  });

  // map dữ liệu BE -> UI
  const rows: CustomerRow[] = useMemo(() => {
    const list = data ?? [];
    return list.map((c) => ({
      id: c.customer_id,
      name: c.name,
      phone: c.mobile,
      totalRevenue: c.total_revenue ?? 0,
      invoices: c.details?.map((d) => ({
        created: d.created,
        invoice_type: d.invoice_type,
        revenue: d.revenue ?? 0,
      })) ?? [],
    }));
  }, [data]);

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState<{ [key: number]: number }>({});

  const handleExpand = (expanded: boolean, record: CustomerRow) => {
    setExpandedRowKeys(expanded ? [record.id] : []);
    if (expanded && !invoicePage[record.id]) {
      setInvoicePage((prev) => ({ ...prev, [record.id]: 1 }));
    }
  };
  const handleInvoicePageChange = (customerId: number, page: number) => {
    setInvoicePage((prev) => ({ ...prev, [customerId]: page }));
  };

  const pageSize = 10;
  const invoicePageSize = 4;

  const paginatedData = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage]
  );

  const columns: ColumnsType<CustomerRow> = [
    {
      title: "Khách hàng",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
      align: "center",
    },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone", align: "center" },
    { title: "Số hóa đơn", key: "invoiceCount", align: "center", render: (_, r) => r.invoices.length },
    { title: "Tổng doanh thu", key: "totalRevenue", align: "center", render: (_, r) => fmtMoney(r.totalRevenue) },
  ];

  const totalRevenueAll = rows.reduce((sum, r) => sum + (r.totalRevenue ?? 0), 0);

  return (
    <div className="bg-white p-4 rounded-md">
      <Table
        bordered
        columns={columns}
        dataSource={paginatedData}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: isError ? "Lỗi tải dữ liệu" : "Không có dữ liệu" }}
        expandable={{
          expandedRowRender: (record) => {
            const currentInvoicePage = invoicePage[record.id] || 1;
            const paginatedInvoices = record.invoices.slice(
              (currentInvoicePage - 1) * invoicePageSize,
              currentInvoicePage * invoicePageSize
            );

            return (
              <div className="border rounded-md p-2">
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(_, index) => `${record.id}-${index}`}
                  columns={[
                    { title: "STT", align: "center", render: (_, __, index) => (currentInvoicePage - 1) * invoicePageSize + index + 1 },
                    { title: "Ngày", dataIndex: "created", key: "created", align: "center" },
                    { title: "Loại hóa đơn", dataIndex: "invoice_type", key: "invoice_type", align: "center" },
                    { title: "Doanh thu", key: "revenue", align: "center", render: (_, r: Invoice) => fmtMoney(r.revenue) },
                  ]}
                  dataSource={paginatedInvoices}
                  bordered
                />
                <div className="flex justify-end mt-2">
                  <Pagination
                    size="small"
                    current={currentInvoicePage}
                    pageSize={invoicePageSize}
                    total={record.invoices.length}
                    onChange={(page) => handleInvoicePageChange(record.id, page)}
                  />
                </div>
              </div>
            );
          },
          expandedRowKeys,
          onExpand: handleExpand,
        }}
        pagination={false}
      />

      {/* Footer phân trang */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Hiển thị {rows.length === 0 ? 0 : (pageSize * (currentPage - 1) + 1)}–
          {Math.min(pageSize * currentPage, rows.length)} trong tổng {rows.length} khách hàng
        </div>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={rows.length}
          onChange={(page) => {
            setCurrentPage(page);
            setExpandedRowKeys([]); // đóng lại bảng con
          }}
        />
      </div>

      {/* Tổng doanh thu */}
      <div className="text-right font-semibold mt-4">
        Tổng doanh thu: {fmtMoney(totalRevenueAll)}
      </div>
    </div>
  );
}
