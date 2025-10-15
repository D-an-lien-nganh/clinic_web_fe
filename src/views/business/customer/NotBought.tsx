"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Badge, Row, Col, Table, Popconfirm, message } from "antd";
import * as XLSX from "xlsx";
import type { ColumnsType } from "antd/es/table";
import { BsFiletypeXls } from "react-icons/bs";
import { useRouter } from "next/navigation";

import {
  useDeleteMarketingMutation,
  useGetCustomerListByStatusQuery,
  useGetLeadStatusListQuery,
  useLazyGetCustomerListByStatusQuery,
} from "@/api/app_customer/apiMarketing";
import UpdateUnpurchasedCustomer from "./components/UpdateNotBought";
import CustomerFilter, {
  CustomerFilterValues,
} from "./custom_component/CustomerFilter";
import dayjs from "dayjs";

interface DataType {
  key: React.Key;
  id: number;
  code: string;
  name: string;
  gender: string;
  source_name?: string;
  source: { title: string } | null;
  mobile: string;
  email: string;
  marketer_detail: { first_name: string; last_name: string } | null;
  introducers: { introducer_name: string }[];
  current_referrer_customer_name?: string | null;
  lead_source_name?: string | null;
  note: string;
  created_at: Date;
  lead_status_name: string;
  customer_care_list?: Array<{
    id: number;
    note?: string;
    date?: string;
    type?: string;
    solidarity?: string;
  }>;
}

// Lấy CSKH có id lớn nhất (mặc định coi id tăng dần theo thời gian)
export const getLatestCare = (list: any[] = []) =>
  list.reduce(
    (acc: any, cur: any) => (acc == null || cur.id > acc.id ? cur : acc),
    null
  );

// ✅ Mapping đúng theo backend CUSTOMER_SOLIDARIETY
const SOLIDARITY_LABELS: Record<string, string> = {
  glls: "Gọi lại lần sau",
  tb: "Thuê bao",
  knm: "Không nghe máy",
  cn: "Cân nhắc",
  dc: "Đã chốt",
  tc: "Từ chối",
};

const FILTER_OPTIONS = Object.entries(SOLIDARITY_LABELS).map(
  ([code, label]) => ({ code, label })
);

export default function NotBought() {
  const router = useRouter();

  // Phân trang client-side
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const handleTableChange = (newPagination: any) =>
    setPagination(newPagination);

  const [searchTerm, setSearchTerm] = useState("");

  const [deleteMarketing, { isLoading: isDeleting }] =
    useDeleteMarketingMutation();

  // Bộ lọc trạng thái cuộc gọi
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [apiFilters, setApiFilters] = useState<CustomerFilterValues>({});
  const handleApplyFilter = (filters: CustomerFilterValues) => {
    setApiFilters(filters);
    // Reset về trang 1 khi đổi filter server-side
    setPagination((p) => ({ ...p, current: 1 }));
  };

  // Modal chi tiết KH
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Dữ liệu từ API
  const {
    data: notBought,
    refetch,
    isLoading,
  } = useGetCustomerListByStatusQuery(
    {
      main_status: 1,
      // mapping tên params theo backend của bạn
      searchTerm: apiFilters.searchTerm,
      source: apiFilters.sourceId,
      startDate: apiFilters.createdFrom,
      endDate: apiFilters.createdTo,
    },
    { refetchOnMountOrArgChange: true }
  );
  useGetLeadStatusListQuery();

  const [triggerGetAll] = useLazyGetCustomerListByStatusQuery();

  const handleExportExcel = async () => {
    message.loading({ content: "Đang xuất dữ liệu...", key: "export" });

    try {
      // args đang xài ở màn hình
      const baseArgs = {
        main_status: 1,
        searchTerm: apiFilters.searchTerm,
        source: apiFilters.sourceId,
        startDate: apiFilters.createdFrom,
        endDate: apiFilters.createdTo,
      };

      const pageSize = 1000; // khớp max_page_size BE để ổn định
      let page = 1;
      let all: any[] = [];

      while (true) {
        const res = await triggerGetAll({
          ...baseArgs,
          page,
          pageSize,
        }).unwrap();
        const chunk = res?.results ?? res?.items ?? [];

        all = all.concat(chunk);

        // Ưu tiên links.next; fallback theo kích thước chunk
        const hasNext =
          (res?.links?.next && typeof res.links.next === "string") ||
          (Array.isArray(chunk) && chunk.length === pageSize);

        if (!hasNext) break;
        page += 1;
      }

      // enrich + filter theo chip
      const enriched = all.map((c: any) => {
        const latest = getLatestCare(c.customer_care_list || []);
        const latestSolidarity = (latest?.solidarity || "")
          .trim()
          .toLowerCase();
        return {
          ...c,
          latestSolidarity: latestSolidarity || null,
          latestCareDate: latest?.date ?? null,
        };
      });

      const filtered =
        selectedStatus === "all"
          ? enriched
          : enriched.filter(
              (c: any) => (c.latestSolidarity ?? "") === selectedStatus
            );

      // build Excel
      const excelData = filtered.map((customer: any, index: number) => ({
        STT: index + 1,
        "Mã khách hàng": customer.code || "",
        "Họ và tên": customer.name || "",
        "Số điện thoại": customer.mobile || "",
        Email: customer.email || "",
        "Người giới thiệu": customer.introducer_label || "",
        Nguồn:
          customer.form_referral_type === "hr"
            ? "CTV"
            : customer.form_referral_type === "customer"
            ? "Khách hàng"
            : "Nguồn khác",
        "Ghi chú": customer.note || "",
        "Cuộc gọi gần nhất": customer.latestSolidarity
          ? SOLIDARITY_LABELS[customer.latestSolidarity] ||
            customer.latestSolidarity
          : "",
        "Ngày CSKH gần nhất": customer.latestCareDate
          ? dayjs(customer.latestCareDate).format("DD/MM/YYYY")
          : "",
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 30 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách khách hàng");
      XLSX.writeFile(
        wb,
        `Danh_sach_khach_hang_chua_mua_${dayjs().format(
          "YYYYMMDD_HHmmss"
        )}.xlsx`
      );

      message.success({
        content: `Đã xuất ${filtered.length} khách hàng!`,
        key: "export",
      });
    } catch (e) {
      console.error(e);
      message.error({ content: "Xuất Excel lỗi. Thử lại nhé!", key: "export" });
    }
  };

  // 1) Enrich customers: tính latestSolidarity, latestCareId, latestCareDate
  const enrichedCustomers = useMemo(() => {
    const list = notBought?.results ?? [];
    return list.map((c: any) => {
      const latest = getLatestCare(c.customer_care_list || []);
      const latestSolidarity = (latest?.solidarity || "").trim().toLowerCase();
      return {
        ...c,
        key: c.id,
        latestSolidarity: latestSolidarity || null,
        latestCareId: latest?.id ?? null,
        latestCareDate: latest?.date ?? null,
      };
    });
  }, [notBought?.results]);

  // Đếm số lượng theo từng loại để hiển thị badge
  const countsByStatus = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of enrichedCustomers) {
      const code = (c.latestSolidarity ?? "").trim();
      if (!code) continue;
      m[code] = (m[code] || 0) + 1;
    }
    return m;
  }, [enrichedCustomers]);

  // ★ Handler cho việc xóa khách hàng
  const handleDeleteCustomer = async (customer: DataType) => {
    try {
      await deleteMarketing({ id: customer.id }).unwrap();

      // Hiển thị thông báo thành công
      message.success(
        `Đã xóa khách hàng ${customer.code} - ${customer.name} thành công!`
      );

      // Refetch để cập nhật danh sách
      refetch();
    } catch (error: any) {
      console.error("Lỗi khi xóa khách hàng:", error);

      // Hiển thị thông báo lỗi
      if (error?.data?.detail) {
        message.error(`Không thể xóa: ${error.data.detail}`);
      } else if (error?.status === 403) {
        message.error("Bạn không có quyền xóa khách hàng này.");
      } else if (error?.status === 404) {
        message.error("Khách hàng không tồn tại.");
      } else {
        message.error("Có lỗi xảy ra khi xóa khách hàng. Vui lòng thử lại.");
      }
    }
  };

  // 2) Filter theo từ khoá + loại cuộc gọi
  const filteredCustomers = useMemo(() => {
    let list = enrichedCustomers;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.mobile?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    if (selectedStatus !== "all") {
      list = list.filter(
        (c: any) => (c.latestSolidarity ?? "") === selectedStatus
      );
    }

    return list;
  }, [enrichedCustomers, searchTerm, selectedStatus]);

  // Reset về trang 1 khi đổi filter/tìm kiếm
  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [selectedStatus, searchTerm]);

  const mapReferral = (type?: string | null) => {
    if (type === "hr") return "CTV";
    if (type === "customer") return "Khách hàng";
    return null; // để còn fallback sang lead_source_name
  };

  // 4) Cột bảng
  const columns: ColumnsType<
    DataType & {
      latestSolidarity?: string | null;
      latestCareDate?: string | null;
    }
  > = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      key: "name",
      title: "Họ và tên",
      dataIndex: "name",
      align: "center",
      render: (text, record) => (
        <span
          onClick={() =>
            router.push(
              `/app/customer/create?actionType=update&customerId=${record.id}`
            )
          }
          className="cursor-pointer hover:text-blue-600 hover:underline"
        >
          {text}
        </span>
      ),
    },
    { key: "mobile", title: "SĐT", dataIndex: "mobile", align: "center" },
    {
      key: "introducer_label",
      dataIndex: "introducer_label",
      title: "Người giới thiệu",
      align: "center",
    },
    {
      key: "form_referral_type",
      title: "Nguồn",
      dataIndex: "form_referral_type",
      align: "center",
      render: (text, record) => {
        const mapped = mapReferral(text);
        if (mapped) return mapped;

        // nguồn khác → ưu tiên hiển thị lead_source_name
        const label = record.lead_source_name?.trim();
        return label && label.length > 0 ? label : "Nguồn khác";
      },
    },
    { key: "note", title: "Ghi chú", dataIndex: "note", align: "center" },
    {
      key: "latest_call",
      title: "Cuộc gọi gần nhất",
      align: "center",
      render: (_, record) => {
        const code = (record as any).latestSolidarity;
        if (!code) return "—";
        return SOLIDARITY_LABELS[code] ?? code;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: 160,
      render: (_: any, record: DataType) => (
        <div className="flex items-center justify-center gap-2">
          {/* ★ Button Xóa với Popconfirm */}
          <Popconfirm
            title="Xác nhận xóa khách hàng"
            description={
              <div>
                <div>Bạn có chắc chắn muốn xóa khách hàng:</div>
                <div className="font-semibold text-red-600 mt-1">
                  {record.code} - {record.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  SĐT: {record.mobile}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <strong>Lưu ý:</strong> Hành động này sẽ xóa vĩnh viễn dữ liệu
                  khách hàng và không thể khôi phục. Các dữ liệu liên quan như
                  lịch sử chăm sóc, đơn thuốc, phác đồ điều trị cũng có thể bị
                  ảnh hưởng.
                </div>
              </div>
            }
            onConfirm={() => handleDeleteCustomer(record)}
            onCancel={() => {}}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              danger: true,
              loading: isDeleting,
            }}
            cancelButtonProps={{
              disabled: isDeleting,
            }}
            disabled={isDeleting}
          >
            <Button
              danger
              size="small"
              loading={isDeleting}
              disabled={isDeleting}
            >
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 5) Render
  return (
    <div className="min-h-[calc(100vh-70px)] p-6">
      <div className="mb-4 flex justify-between items-center">
        <CustomerFilter onApply={handleApplyFilter} loading={isLoading} />

        <div className="flex gap-7">
          <div className="flex gap-2">
            <Button
              type="dashed"
              className="flex items-center justify-center border-blue-500 text-blue-500"
              icon={<BsFiletypeXls className="text-blue-500" />}
              onClick={handleExportExcel}
              loading={isLoading}
            >
              Xuất Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-start">
        {/* Thanh chip filter — ẨN trên màn nhỏ */}
        <div className="flex-1 hidden md:block">
          <Row gutter={[8, 8]}>
            {/* Nút Tất cả */}
            <Col>
              <Button
                className="text-center px-2 py-1 cursor-pointer mb-1 mt-2"
                shape="round"
                onClick={() => setSelectedStatus("all")}
                style={{
                  backgroundColor:
                    selectedStatus === "all" ? "#BD8306" : "#ffffff",
                  border: "1px solid #d9d9d9",
                  color: selectedStatus === "all" ? "#ffffff" : "#000000",
                }}
              >
                Tất cả
                <Badge count={enrichedCustomers.length} />
              </Button>
            </Col>

            <div className="flex-1 w-[calc(100vw-750px)] overflow-x-auto whitespace-nowrap">
              <div className="flex gap-2 mb-1 mt-2 w-full">
                {FILTER_OPTIONS.map(({ code, label }) => {
                  const countForStatus = countsByStatus[code] ?? 0;
                  const active = selectedStatus === code;

                  return (
                    <Col key={code}>
                      <Button
                        shape="round"
                        onClick={() => setSelectedStatus(code)}
                        style={{
                          backgroundColor: active ? "#BD8306" : "#ffffff",
                          border: "1px solid #d9d9d9",
                          color: active ? "#ffffff" : "#000000",
                        }}
                      >
                        {label}
                        <Badge
                          count={countForStatus}
                          style={{ marginLeft: 8 }}
                        />
                      </Button>
                    </Col>
                  );
                })}
              </div>
            </div>
          </Row>
        </div>

        <Button
          type="primary"
          className="bg-[#BD8306] text-white"
          onClick={() => router.push("/app/customer/create?actionType=create")}
        >
          Thêm khách hàng
        </Button>
      </div>

      {/* Modal chi tiết */}
      {selectedRowId && (
        <UpdateUnpurchasedCustomer
          refetch={refetch}
          title="Chi tiết khách hàng"
          customerId={selectedRowId}
          readOnly={true}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedRowId(null);
          }}
        />
      )}

      {/* Bảng */}
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          onChange={handleTableChange}
          loading={isLoading}
          dataSource={filteredCustomers}
          pagination={{
            ...pagination,
            total: filteredCustomers.length,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
          bordered
          scroll={{ x: "max-content" }}
          rowClassName={() => "hover:bg-gray-100"}
        />
      </div>
    </div>
  );
}
