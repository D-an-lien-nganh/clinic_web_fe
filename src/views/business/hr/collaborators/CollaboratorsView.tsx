"use client";
import React, { useState } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Popconfirm,
  Space,
  Spin,
  notification,
} from "antd";
import { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useWindowSize } from "@/utils/responsiveSm";
import { IoMdSettings } from "react-icons/io";
import { FaFileExport } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";
import { BsFiletypePdf, BsFiletypeXls } from "react-icons/bs";
import { MenuProps } from "antd/lib";
import AddAndUpdateCollaborator from "@/views/business/hr/collaborators/components/AddAndUpdateCollaborator";
import {
  useDeleteEmployeeMutation,
  useGetEmployeeListQuery,
} from "@/api/app_hr/apiHR";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import ActionTable from "@/components/DropDown/ActionTable";
import { PaginationState } from "../employees/EmployeesList";
import { convertYMDToDMY } from "@/utils/convert";
import * as XLSX from "xlsx";

type DataType = {
  id: number;
  full_name: string;
  email: string;
  address: string;
  user_profile?: {
    user_mobile_number: string;
    gender: string;
  };
};

function CollaboratorsView() {
  const [width] = useWindowSize();
  const isCollapse = useSelector(
    (state: RootState) => state.collapse.isCollapse
  );
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    searchTerm: "",
    startDate: "",
    endDate: "",
    format: "",
    department: "",
  });

  const { data, refetch, error, isLoading } = useGetEmployeeListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    searchTerm: pagination.searchTerm,
    startDate: pagination.startDate,
    endDate: pagination.endDate,
    format: pagination.format,
    department: pagination.department,
    type: "collaborator",
  });

  const [deleteCollaborator, { isLoading: isLoadingDelete }] =
    useDeleteEmployeeMutation();

  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [menuName, setMenuName] = useState<string>("Hành động");

  const exportToExcel = () => {
    // Map dữ liệu từ API (data?.results) thành mảng JSON chuẩn
    const exportData = (data?.results || []).map((c: any, idx: number) => ({
      STT: idx + 1,
      "Mã CTV": c.code || "",
      "Họ và tên": c.full_name || "",
      SĐT: c.mobile || c.user_profile?.user_mobile_number || "",
      Email: c.email || "",
      "Ngày bắt đầu làm": c.start_date ? convertYMDToDMY(c.start_date) : "",
      "Ngày kết thúc HĐ": c.contract_end ? convertYMDToDMY(c.contract_end) : "",
      "Trạng thái HĐ":
        c.contract_end && new Date(c.contract_end) < new Date()
          ? "Đã kết thúc"
          : "Còn hiệu lực",
    }));

    // Tạo sheet và workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    // Auto width theo nội dung
    const cols = Object.keys(exportData[0] || {}).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...exportData.map((row: any) => String(row[key] || "").length)
        ) + 2,
    }));
    worksheet["!cols"] = cols;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Collaborators");
    XLSX.writeFile(workbook, "Danh_sach_Cong_tac_vien.xlsx");
  };

  const onDelete = async (id: number) => {
    try {
      const result = await deleteCollaborator(id);
      if (result && "error" in result) {
        notification.error({
          message: `Xóa cộng tác viên thất bại`,
          placement: "bottomRight",
          className: "h-16",
        });
      } else {
        notification.success({
          message: `Xóa cộng tác viên thành công`,
          placement: "bottomRight",
          className: "h-16",
        });
        refetch();
      }
    } catch (error) {
      console.error("Xóa thất bại" + error);
    }
  };

  // Định nghĩa các cột cho bảng
  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (_, __, idx) =>
        (pagination.current - 1) * pagination.pageSize + idx + 1,
    },
    {
      align: "center",
      title: `Mã CTV`,
      key: "code",
      render: (_: any, record: any) => `${record?.code} `,
    },
    {
      align: "center",
      title: `Họ và tên`,
      key: "full_name",
      render: (_: any, record: any) => `${record?.full_name} `,
    },
    {
      align: "center",
      title: `SĐT`,
      key: "mobile",
      render: (_: any, record: any) => `${record?.mobile} `,
    },
    {
      align: "center",
      title: `Email`,
      key: "email",
      dataIndex: "email",
    },
    {
      align: "center",
      title: `Ngày bắt đầu làm`,
      render: (_: any, record: any) => convertYMDToDMY(record?.start_date),
    },
    {
      align: "center",
      title: "Thời gian hợp đồng",
      render: (_: any, record: any) => {
        // Lấy ngày kết thúc hợp đồng
        const contractEnd = record?.contract_end;

        if (contractEnd) {
          // Chuyển đổi các đối tượng Date thành timestamp (mili giây)
          const endDate = new Date(contractEnd).getTime();
          const currentDate = new Date().getTime();

          // Tính toán số ngày còn lại
          const timeDifference = endDate - currentDate;
          const daysRemaining = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Chuyển milliseconds thành ngày

          if (daysRemaining > 0) {
            return `${daysRemaining} ngày còn lại`;
          } else if (daysRemaining === 0) {
            return `Hôm nay là ngày kết thúc`;
          } else {
            return `Hợp đồng đã kết thúc`;
          }
        }

        return "Không có dữ liệu";
      },
    },
    {
      title: "",
      width: width > 640 ? 180 : 30,
      fixed: "right",
      render: (_, record) => (
        <Space size="middle" direction="vertical" className="text-center">
          <div className="flex gap-2">
            <ActionTable
              items={[
                {
                  key: "1",
                  label: (
                    <AddAndUpdateCollaborator
                      edit={true}
                      collaboratorData={record}
                    />
                  ),
                },
                {
                  key: "2",
                  label: (
                    <Popconfirm
                      title="Xóa cộng tác viên?"
                      description="Bạn có chắc chắn muốn xóa cộng tác viên này?"
                      onConfirm={() => onDelete(record?.id)}
                      onCancel={cancel}
                      okText="Xác nhận"
                      cancelText="Hủy"
                      placement="left"
                      okButtonProps={{ loading: isLoadingDelete }}
                    >
                      <Button danger size="small" className="max-sm:hidden">
                        Xóa
                      </Button>
                      <div className="sm:hidden text-center">Xóa</div>
                    </Popconfirm>
                  ),
                },
              ]}
            />
          </div>
        </Space>
      ),
      align: "center",
    },
  ];

  const cancel = () => {};

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setTempSearchTerm(value);
  };

  return (
    <div
      className={`w-screen ${
        isCollapse ? "md:w-[calc(100vw-160px)]" : "md:w-[calc(100vw-300px)]"
      } px-6`}
    >
      <div className="flex justify-between items-center pt-2 max-md:flex-col max-md:gap-3 mb-2">
        <Form layout="inline" className="max-md:gap-2 w-full">
          <Form.Item className="max-md:w-full mb-3">
            <Input
              placeholder="Nhập tên cộng tác viên"
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
            icon={<BsFiletypeXls className="text-blue-500" />}
            onClick={exportToExcel}
          >
            Xuất Excel
          </Button>
          <AddAndUpdateCollaborator />
        </div>
      </div>

      <div className="overflow-x-auto mt-3">
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={data?.results || []}
            rowKey="collaboratorCode"
            bordered
          />
        </Spin>
      </div>
    </div>
  );
}

export default CollaboratorsView;
