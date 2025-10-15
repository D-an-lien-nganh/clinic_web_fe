"use client";
import React, { useMemo, useState } from "react";
import { Table, Button, Form, Input, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd/lib";
import { useRouter } from "next/navigation";
import { useWindowSize } from "@/utils/responsiveSm";
import { FaFileExport } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";
import { BsFiletypePdf, BsFiletypeXls } from "react-icons/bs";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import ReferredCustomersModal from "./ReferredCustomersModal";
import { useGetReferralLeadersQuery } from "@/api/app_customer/apiMarketing";

type DataType = {
  id: number;
  name: string;
  mobile: string | null;
  email: string | null;
  referral_count: number;
  gender: string | null;
  address: string | null;
  code: string;
};

function PotentialCustomersView() {
  const [width] = useWindowSize();
  const isCollapse = useSelector(
    (state: RootState) => state.collapse.isCollapse
  );
  const router = useRouter();

  // --- STATE ---
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [menuName, setMenuName] = useState<string>("Hành động");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Modal (xem chi tiết các khách được 1 KH giới thiệu)
  const [openRefModal, setOpenRefModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    number | undefined
  >(undefined);
  const [selectedCustomerName, setSelectedCustomerName] = useState<
    string | undefined
  >(undefined);

  const openDetail = (id: number, name: string) => {
    setSelectedCustomerId(id);
    setSelectedCustomerName(name);
    setOpenRefModal(true);
  };

  const role = "receptionist" as "receptionist" | "doctor";
  const goToCustomerCare = (id: number, tab = "1") => {
    router.push(
      `/app/customer/customer-info?tab=${tab}&customerId=${id}&role=${role}`
    );
  };

  // --- CALL API: danh sách khách hàng có số lượt giới thiệu >= 2 ---
  const { data: leadersRaw = [], isLoading } = useGetReferralLeadersQuery({
    min: 2,
  });

  // Chuẩn hoá data: chấp nhận dạng mảng hoặc có .results
  const data: DataType[] = useMemo(() => {
    const arr = (leadersRaw as any)?.results ?? leadersRaw ?? [];
    return Array.isArray(arr) ? (arr as DataType[]) : [];
  }, [leadersRaw]);

  // --- SEARCH (client) ---
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempSearchTerm(e.target.value.toLowerCase());
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const filtered = useMemo(() => {
    if (!tempSearchTerm) return data;
    const q = tempSearchTerm;
    return (data as DataType[]).filter((r) =>
      `${r.code} ${r.name} ${r.mobile ?? ""} ${r.email ?? ""} ${
        r.referral_count
      }`
        .toLowerCase()
        .includes(q)
    );
  }, [data, tempSearchTerm]);

  // --- CỘT BẢNG ---
  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, idx) =>
        (pagination.current - 1) * pagination.pageSize + idx + 1,
    },
    { align: "center", title: "Mã khách hàng", key: "code", dataIndex: "code" },
    {
      align: "center",
      title: "Họ và tên",
      key: "name",
      dataIndex: "name",
      render: (text, record) => (
        <span
          onClick={() => goToCustomerCare(record.id, "1")}
          className="cursor-pointer hover:text-blue-600 hover:underline"
        >
          {text}
        </span>
      ),
    },
    {
      align: "center",
      title: "Giới tính",
      key: "gender",
      dataIndex: "gender",
      render: (gender: string) =>
        gender === "MA"
          ? "Nam"
          : gender === "FE"
          ? "Nữ"
          : gender === "OT"
          ? "Khác"
          : "Không rõ",
    },
    { align: "center", title: "SĐT", key: "mobile", dataIndex: "mobile" },
    { align: "center", title: "Địa chỉ", key: "address", dataIndex: "address" },
    {
      align: "center",
      title: "Số lượt giới thiệu",
      key: "referral_count",
      dataIndex: "referral_count",
    },
    {
      title: "",
      width: width > 640 ? 180 : 30,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size="middle" direction="vertical" className="text-center">
          <div className="flex gap-2">
            <Button
              size="small"
              type="primary"
              className="bg-blue-600"
              onClick={() => openDetail(record.id, record.name)}
            >
              Xem chi tiết
            </Button>
          </div>
        </Space>
      ),
    },
  ];

  // --- Dropdown (để nguyên như bạn có; không render ở đây) ---
  const items: MenuProps["items"] = [
    { label: "Chọn nhiều", key: "1", icon: <FaFileExport /> },
    {
      label: "Xuất tất cả",
      key: "2",
      children: [
        { label: "Xuất Excel", key: "3" },
        { label: "Xuất PDF", key: "5" },
      ],
    },
    { label: "Huỷ", key: "6", icon: <FcCancel /> },
  ];
  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "1") setMenuName("Chọn nhiều");
    else if (e.key === "2") setMenuName("Xuất tất cả");
    else if (e.key === "6") {
      setMenuName("Hành động");
      setSelectedRowKeys([]);
    }
  };
  const menuProps = {
    items: ["Chọn nhiều", "Xuất tất cả"].includes(menuName)
      ? items
      : items.slice(0, 2),
    onClick: handleMenuClick,
  };

  return (
    <div
      className={`w-screen ${
        isCollapse ? "md:w-[calc(100vw-160px)]" : "md:w-[calc(100vw-300px)]"
      } px-6`}
    >
      {/* Header */}
      <div className="flex justify-between items-center pt-2 max-md:flex-col max-md:gap-3 mb-2">
        <Form layout="inline" className="max-md:gap-2 w-full">
          <Form.Item className="max-md:w-full mb-3">
            <Input
              placeholder="Nhập tên khách hàng"
              value={tempSearchTerm}
              onChange={onSearchChange}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  current: 1, // reset về trang 1
                  searchTerm: tempSearchTerm,
                }))
              }
            >
              Lọc
            </Button>
          </Form.Item>
        </Form>
        <div className="flex justify-end text-right w-full gap-2">
          <Button
            type="dashed"
            className="flex items-center justify-center border-blue-500 text-blue-500"
            icon={<BsFiletypePdf className="text-blue-500" />}
          >
            Xuất PDF
          </Button>
          <Button
            type="dashed"
            className="flex items-center justify-center border-blue-500 text-blue-500"
            icon={<BsFiletypeXls className="text-blue-500" />}
          >
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-3">
        <Table<DataType>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          bordered
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filtered.length,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (current, pageSize) =>
              setPagination({ current, pageSize }),
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </div>

      {/* Modal: danh sách KH được khách X giới thiệu */}
      <ReferredCustomersModal
        open={openRefModal}
        onClose={() => setOpenRefModal(false)}
        customerId={selectedCustomerId}
        customerName={selectedCustomerName}
      />
    </div>
  );
}

export default PotentialCustomersView;
