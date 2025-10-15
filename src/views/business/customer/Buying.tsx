"use client";
import { useRouter } from "next/navigation";
import {
  useDeleteMarketingMutation,
  useGetCustomerListByStatusQuery,
  useLazyGetCustomerListByStatusQuery,
} from "@/api/app_customer/apiMarketing";
import { ColumnsType, TableProps } from "antd/es/table";
import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  Form,
  Table,
  Button,
  Dropdown,
  Menu,
  Row,
  Col,
  Badge,
  Popconfirm,
  message,
} from "antd";
import { BsFiletypePdf, BsFiletypeXls } from "react-icons/bs";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import ExamInvoiceModal from "./modal/ExamInvoiceModal";
import PrescriptionInvoiceModal from "./modal/PrescriptionInvoiceModal";
import TreatmentInvoiceModal from "./modal/TreatmentInvoiceModal";
import CustomerPaymentModal from "./modal/CustomerPaymentModal";
import { getLatestCare } from "./NotBought";
import CustomerFilter, {
  CustomerFilterValues,
} from "./custom_component/CustomerFilter";
import type { MenuProps } from "antd";

export interface TreatmentProgress {
  total_items: number;
  done_items: number;
  percent: number;
  status_code: string;
  status_label: string;
}
export interface PaymentStatus {
  amount_paid: string;
  amount_original: string;
  percent: number;
  status: "no_plan" | "no_debt" | "unpaid" | "partial" | "paid" | string;
}
export interface DataType {
  key: React.Key;
  id: number;
  code: string;
  name: string;
  gender: string;
  source_name: string;
  mobile: string;
  email: string;
  lead_source_name?: string | null;
  
  marketer_detail: { first_name: string; last_name: string } | null;
  note: string;
  created_at: Date;
  service_names: string[];
  latest_service_type?: "TLCB" | "TLDS" | string | null;
  treatment_progress?: TreatmentProgress | null;
  payment_status?: PaymentStatus | null;
  next_visit_date?: string | null;
}

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

export default function Buying() {
  const router = useRouter();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null);
  const [selectionType, setSelectionType] = useState<"checkbox" | "radio">(
    "checkbox"
  );
  const [modalType, setModalType] = useState<
    "xetnghiem" | "thuoc" | "lieutrinh" | null
  >(null);

  // ★ State cho modal thanh toán
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCustomerId, setPaymentCustomerId] = useState<number | null>(
    null
  );

  const [apiFilters, setApiFilters] = useState<CustomerFilterValues>({});
  const handleApplyFilter = (filters: CustomerFilterValues) => {
    setApiFilters(filters);
    // Reset về trang 1 khi đổi filter server-side
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const {
    data: buying,
    refetch,
    isLoading,
  } = useGetCustomerListByStatusQuery(
    {
      main_status: 2,
      // mapping tên params theo backend của bạn
      searchTerm: apiFilters.searchTerm,
      source: apiFilters.sourceId,
      startDate: apiFilters.createdFrom,
      endDate: apiFilters.createdTo,
    },
    { refetchOnMountOrArgChange: true }
  );
  const role = "receptionist" as const;

  const [searchTerm, setSearchTerm] = useState("");

  // Bộ lọc trạng thái cuộc gọi
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [deleteMarketing, { isLoading: isDeleting }] =
    useDeleteMarketingMutation();

  const [triggerGetAll] = useLazyGetCustomerListByStatusQuery();

  const goToEditCustomer = (id: number) => {
    router.push(`/app/customer/create?actionType=update&customerId=${id}`);
  };

  const handleExportExcel = async () => {
    message.loading({ content: "Đang xuất dữ liệu...", key: "export" });

    try {
      // args đang xài ở màn hình
      const baseArgs = {
        main_status: 2,
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
        "Dịch vụ": customer.latest_service_type || "Không có",
        "Trạng thái chữa bệnh": customer.treatment_progress
          ? `${customer.treatment_progress.done_items ?? 0}/${
              customer.treatment_progress.total_items ?? 0
            }`
          : "Chưa có",
        "Trạng thái thanh toán": customer.payment_status
          ? (customer.payment_status.percent ?? 0) === 0
            ? "Chưa thanh toán"
            : `${customer.payment_status.percent}%`
          : "Chưa có",
        "Ngày tới khám": customer.next_visit_date
          ? dayjs(customer.next_visit_date).format("DD/MM/YYYY")
          : "",
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
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 18 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách khách hàng");
      XLSX.writeFile(
        wb,
        `Danh_sach_khach_hang_dang_mua_${dayjs().format(
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

  const goToCustomerCare = (id: number, tab = "1") => {
    router.push(
      `/app/customer/customer-info?tab=${tab}&customerId=${id}&role=${role}`
    );
  };

  // 1) Enrich customers: tính latestSolidarity, latestCareId, latestCareDate
  const enrichedCustomers = useMemo(() => {
    const list = buying?.results ?? [];
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
  }, [buying?.results]);

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

  const onActionSelect = (type: "xetnghiem" | "thuoc" | "lieutrinh") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const rowSelection: TableProps<DataType>["rowSelection"] = {
    onChange: (selectedRowKeys, selectedRows) => {
      // ...
    },
    getCheckboxProps: (record) => ({
      disabled: record.name === "Disabled User",
      name: record.name,
    }),
  };

  const mapReferral = (type?: string | null) => {
    if (type === "hr") return "CTV";
    if (type === "customer") return "Khách hàng";
    return null; // để còn fallback sang lead_source_name
  };

  const handleModalCancel = () => setIsModalOpen(false);

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (_text, _record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      key: "name",
      title: "Họ và tên",
      dataIndex: "name",
      align: "center",
      render: (text, record) => {
        const items: MenuProps["items"] = [
          {
            key: "view-treatment",
            label: "Xem thông tin trị liệu",
          },
          {
            key: "edit",
            label: "Sửa thông tin",
          },
        ];

        const onMenuClick: MenuProps["onClick"] = ({ key }) => {
          if (key === "view-treatment") {
            goToCustomerCare(record.id, "1");
          } else if (key === "edit") {
            goToEditCustomer(record.id);
          }
        };

        return (
          <Dropdown trigger={["click"]} menu={{ items, onClick: onMenuClick }}>
            <span
              onClick={(e) => e.preventDefault()}
              className="cursor-pointer hover:text-blue-600 hover:underline"
            >
              {text}
            </span>
          </Dropdown>
        );
      },
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
    { key: "mobile", title: "SĐT", dataIndex: "mobile", align: "center" },
    {
      key: "latest_service_type",
      title: "Dịch vụ",
      dataIndex: "latest_service_type",
      align: "center",
      render: (val) => val || "Không có",
    },
    {
      key: "treatment_progress",
      title: "Trạng thái chữa bệnh",
      dataIndex: "treatment_progress",
      align: "center",
      render: (tp) =>
        tp ? `${tp.done_items ?? 0}/${tp.total_items ?? 0}` : "Chưa có",
    },
    {
      key: "payment_status",
      title: "Trạng thái thanh toán",
      dataIndex: "payment_status",
      align: "center",
      render: (ps) =>
        ps
          ? (ps.percent ?? 0) === 0
            ? "Chưa thanh toán"
            : `${ps.percent}%`
          : "Chưa có",
    },
    {
      key: "next_visit_date",
      title: "Ngày tới khám",
      dataIndex: "next_visit_date",
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: 160,
      render: (_: any, record: DataType) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="primary"
            onClick={() => {
              setPaymentCustomerId(record.id); // set id khách
              setPaymentModalOpen(true); // mở modal
            }}
          >
            Thanh toán
          </Button>
          {/* ★ Button Xóa với Popconfirm */}
          {/* <Popconfirm
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
          </Popconfirm> */}
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (selectedRecord) setIsModalOpen(true);
  }, [selectedRecord]);

  return (
    <div className="min-h-[calc(100vh-70px)] p-6">
      {/* thanh tìm kiếm / export */}
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
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          rowSelection={{ type: selectionType, ...rowSelection }}
          dataSource={filteredCustomers}
          onChange={handleTableChange}
          loading={isLoading}
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

      {/* các modal đơn lẻ */}
      <ExamInvoiceModal
        open={isModalOpen && modalType === "xetnghiem"}
        customerId={selectedRecord?.id ?? null}
        onCancel={handleModalCancel}
      />
      <PrescriptionInvoiceModal
        open={isModalOpen && modalType === "thuoc"}
        customerId={selectedRecord?.id ?? null}
        onCancel={handleModalCancel}
      />
      <TreatmentInvoiceModal
        open={isModalOpen && modalType === "lieutrinh"}
        onCancel={handleModalCancel}
      />

      {/* ★ Modal thanh toán theo từng khách */}
      <CustomerPaymentModal
        open={paymentModalOpen}
        customerId={paymentCustomerId ?? 0} // đảm bảo truyền số
        onCancel={() => setPaymentModalOpen(false)}
      />
    </div>
  );
}
