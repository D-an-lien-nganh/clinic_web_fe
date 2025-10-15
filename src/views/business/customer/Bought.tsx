"use client";
import { useRouter } from "next/navigation";
import {
  useGetCustomerListByStatusQuery,
  useLazyGetCustomerListByStatusQuery, // 👈 thêm
} from "@/api/app_customer/apiMarketing";
import { useGetSetupQuery } from "@/api/app_home/apiSetup";
import { ColumnsType } from "antd/es/table";
import React, { useState, useEffect, useMemo } from "react";
import { Badge, Button, Col, Row, Table, message } from "antd"; // 👈 thêm message
import UpdateBuying from "./components/UpdateBuying";
import { BsFiletypeXls } from "react-icons/bs";
import { getLatestCare } from "./NotBought";
import CustomerFilter, {
  CustomerFilterValues,
} from "./custom_component/CustomerFilter";
import * as XLSX from "xlsx"; // 👈 thêm
import dayjs from "dayjs"; // 👈 thêm
import { Dropdown } from "antd";
import type { MenuProps } from "antd";

interface DataType {
  key: React.Key;
  id: number;
  code: string;
  name: string;
  gender: string;
  source_name: string;
  mobile: string;
  email: string;
  marketer_detail: { first_name: string; last_name: string } | null;
  note: string;
  created_at: Date;
  contact_date: string;
  time_frame_detail_created?: string;
  time_frame_detail_note?: string;
  service_names: string[];
  treatment_status_name?: string;
  lead_source_name?: string | null;
  // có thể tồn tại thêm trong payload:
  introducer_label?: string;
  form_referral_type?: "hr" | "customer" | string;
  customer_care_list?: Array<{
    id: number;
    note?: string;
    date?: string;
    type?: string;
    solidarity?: string;
  }>;
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

export default function Bought() {
  const router = useRouter();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Bộ lọc trạng thái cuộc gọi
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [apiFilters, setApiFilters] = useState<CustomerFilterValues>({});
  const handleApplyFilter = (filters: CustomerFilterValues) => {
    setApiFilters(filters);
    // Reset về trang 1 khi đổi filter server-side
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const {
    data: bought,
    refetch,
    isLoading,
  } = useGetCustomerListByStatusQuery(
    {
      main_status: 3,
      // mapping tên params theo backend của bạn
      searchTerm: apiFilters.searchTerm,
      source: apiFilters.sourceId,
      startDate: apiFilters.createdFrom,
      endDate: apiFilters.createdTo,
    },
    { refetchOnMountOrArgChange: true }
  );

  const [triggerGetAll] = useLazyGetCustomerListByStatusQuery(); // 👈 để load tất cả trang khi export

  const { data: setUpList } = useGetSetupQuery();
  const employeeMap = React.useMemo(() => {
    if (!setUpList?.employee_list) return {};
    return setUpList.employee_list.reduce((acc: any, employee: any) => {
      acc[employee.id] = employee.username;
      return acc;
    }, {});
  }, [setUpList]);

  // 1) Enrich customers: tính latestSolidarity, latestCareId, latestCareDate
  const enrichedCustomers = useMemo(() => {
    const list = bought?.results ?? [];
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
  }, [bought?.results]);

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const role = "receptionist" as "receptionist" | "doctor";

  const goToCustomerCare = (id: number, tab = "1") => {
    router.push(
      `/app/customer/customer-info?tab=${tab}&customerId=${id}&role=${role}`
    );
  };

  const goToEditCustomer = (id: number) => {
    router.push(`/app/customer/create?actionType=update&customerId=${id}`);
  };

  const handleRowClick = (record: DataType) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleModalFinish = (values: any) => {
    console.log(
      "Submitted values:",
      values,
      "Customer ID:",
      selectedRecord?.id
    );
    setIsModalOpen(false);
  };

  // 🚀 Export Excel (tương tự NotBought, có thêm cột riêng của Bought)
  const handleExportExcel = async () => {
    message.loading({ content: "Đang xuất dữ liệu...", key: "export" });

    try {
      // args giống màn hình hiện tại
      const baseArgs = {
        main_status: 3,
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

      // build Excel dữ liệu
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
        "Dịch vụ": Array.isArray(customer.service_names)
          ? customer.service_names.join(", ")
          : "",
        "Loại trị liệu": customer.time_frame_detail_note || "",
        "Trạng thái thanh toán": customer.treatment_status_name || "",
        "Ngày khám gần nhất": customer.time_frame_detail_created
          ? dayjs(customer.time_frame_detail_created).format("DD/MM/YYYY")
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
        { wch: 5 }, // STT
        { wch: 15 }, // Mã KH
        { wch: 25 }, // Họ và tên
        { wch: 15 }, // SĐT
        { wch: 25 }, // Email
        { wch: 25 }, // Người giới thiệu
        { wch: 15 }, // Nguồn
        { wch: 30 }, // Ghi chú
        { wch: 30 }, // Dịch vụ
        { wch: 22 }, // Loại trị liệu
        { wch: 22 }, // Trạng thái thanh toán
        { wch: 18 }, // Ngày khám gần nhất
        { wch: 20 }, // Cuộc gọi gần nhất
        { wch: 18 }, // Ngày CSKH gần nhất
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Khách hàng đã mua");
      XLSX.writeFile(
        wb,
        `Danh_sach_khach_hang_da_mua_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`
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

  const mapReferral = (type?: string | null) => {
    if (type === "hr") return "CTV";
    if (type === "customer") return "Khách hàng";
    return null; // để còn fallback sang lead_source_name
  };

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (text, record, index) =>
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
    {
      key: "mobile",
      title: "Số điện thoại",
      dataIndex: "mobile",
      align: "center",
    },
    {
      key: "service_names",
      title: "Dịch vụ",
      align: "center",
      render: (text: any, record: DataType) => {
        return record.service_names?.join(", ") || "Không có dịch vụ";
      },
    },
    {
      key: "note",
      title: "Loại trị liệu",
      dataIndex: "time_frame_detail_note",
      align: "center",
      render: (text: string) => text || "Không có ghi chú",
    },
    {
      key: "treatment_status_name",
      title: "Trạng thái thanh toán",
      dataIndex: "treatment_status_name",
      align: "center",
    },
    {
      title: "Ngày khám gần nhất",
      align: "center",
      render: (text: any, record: DataType) => {
        const date = record.time_frame_detail_created
          ? new Date(record.time_frame_detail_created)
          : new Date();
        return date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
  ];

  useEffect(() => {
    if (selectedRecord) {
      setIsModalOpen(true);
    }
  }, [selectedRecord]);

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
              onClick={handleExportExcel} // 👈 gắn export
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
      <UpdateBuying
        open={isModalOpen}
        onCancel={handleModalCancel}
        onFinish={handleModalFinish}
        selectedRecord={selectedRecord}
      />
    </div>
  );
}
