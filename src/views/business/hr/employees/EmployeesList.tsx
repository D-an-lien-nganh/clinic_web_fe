"use client";
import React, { useState, useRef, useMemo } from "react";
import {
  Table,
  Spin,
  Space,
  Menu,
  Popconfirm,
  notification,
  Button,
  Dropdown,
  Form,
  Input,
} from "antd";
import { ColumnsType } from "antd/es/table";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useRouter } from "next/navigation";
import ActionTable from "@/components/DropDown/ActionTable";
import { useWindowSize } from "@/utils/responsiveSm";
import { IoMdSettings } from "react-icons/io";
import { FaFileExport } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";
import { BsFiletypePdf, BsFiletypeXls } from "react-icons/bs";
import { MenuProps } from "antd/lib";
import AddAndUpdateEmployee from "@/views/business/hr/employees/components/AddAndUpdateEmployee";
import {
  useDeleteEmployeeMutation,
  useGetEmployeeListQuery,
} from "@/api/app_hr/apiHR";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import FileAction from "@/views/business/hr/employees/components/FileAction";
import { MdDelete } from "react-icons/md";
import { CiFilter } from "react-icons/ci";
import FilterHr from "./components/FilterHr";
import DetailHrEmployee from "@/views/business/hr/employees/components/DetailHrEmployee";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import autoTable explicitly
import * as XLSX from "xlsx";

export interface PaginationState {
  current: number;
  pageSize: number;
  searchTerm: string;
  startDate?: string;
  endDate?: string;
  format?: string;
  department?: string;
}

interface Employee {
  id: number;
  user: number | null;
  user_profile: number | null;
  code: string; 
  contract: string | null;
  contract_start: string;
  contract_end: string;
  contract_status: string; // 'AC' | 'EX'
  contract_type: string; // 'OF' | 'IN'
  type?: string;
  start_date: string;
  level: string;
  calculate_seniority: string | null;
  contract_base64?: string | null;

  full_name: string; // ⬅️ string phẳng
  mobile: string;
  email: string;

  position?: {
    id: number;
    title: string;
    department_name: string;
  };
  department?: string; // ⬅️ BE có field này, dùng fallback
}

function EmployeesList() {
  const [form] = Form.useForm();
  const [width] = useWindowSize();
  const timeoutRef = useRef<number | null>(null);
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
    type: "employee",
  });

  const [deleteEmp, { isLoading: isLoadingDelete }] =
    useDeleteEmployeeMutation();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [menuName, setMenuName] = useState<string>("Hành động");

  const handleTableChange = (newPagination: any) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const handleFilterApply = (values: any) => {
    setPagination((prev) => ({
      ...prev,
      startDate: values.startDate ? values.startDate.format("YYYY-MM-DD") : "",
      endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : "",
      department: values.department || "",
      current: 1,
    }));
  };

  const handleClearFilters = () => {
    setPagination((prev) => ({
      ...prev,
      startDate: "",
      endDate: "",
      department: "",
      current: 1,
    }));
  };

  const columns: ColumnsType<Employee> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (_, __, idx) =>
        (pagination.current - 1) * pagination.pageSize + idx + 1,
    },
    {
      width: 200,
      align: "center",
      title: "Mã NV",
      dataIndex: "code", // ⬅️ dùng trực tiếp
      key: "code",
    },
    {
      width: 200,
      align: "center",
      title: "Họ và tên",
      dataIndex: "full_name", // ⬅️ dùng trực tiếp
      key: "full_name",
    },
    {
      align: "center",
      title: "SĐT",
      dataIndex: "mobile",
      key: "mobile",
    },
    {
      align: "center",
      title: "Phòng ban",
      key: "department",
      render: (_, record) =>
        record.department || record.position?.department_name || "", // ⬅️ fallback
    },
    {
      align: "center",
      title: "Chức vụ",
      key: "title",
      render: (_, record) => record.position?.title || "",
    },
    {
      align: "center",
      title: "Hợp đồng",
      dataIndex: "contract_type",
      key: "contract_type",
      render: (type) =>
        type === "OF" ? "Chính thức" : type === "IN" ? "Thực tập" : type,
    },
    {
      align: "center",
      title: "Trạng thái",
      dataIndex: "contract_status",
      key: "contract_status",
      render: (type) =>
        type === "AC" ? "Còn hiệu lực" : type === "EX" ? "Hết hiệu lực" : type,
    },
    {
      title: "Hành động",
      width: width > 800 ? 160 : 40,
      fixed: "right",
      render: (_, record) => (
        <Space size="middle" className="flex justify-center items-center gap-2">
          <ActionTable
            items={[
              {
                key: "5",
                label: (
                  <DetailHrEmployee employeeData={record} refresh={refetch} />
                ),
              },
              {
                key: "3",
                label: (
                  <AddAndUpdateEmployee
                    edit={true}
                    employeeData={record?.id}
                    refresh={refetch}
                  />
                ),
              },
              {
                key: "4",
                label: (
                  <Popconfirm
                    title="Xóa thông tin?"
                    description="Bạn có chắc chắn muốn xóa thông tin nhân viên này?"
                    onConfirm={() => onDelete(record?.id)}
                    onCancel={cancel}
                    okText="Xác nhận"
                    cancelText="Hủy"
                    placement="left"
                    okButtonProps={{ loading: isLoadingDelete }}
                  >
                    <Button
                      type="link"
                      icon={<MdDelete style={{ color: "red" }} />}
                      className="max-sm:hidden"
                    />
                  </Popconfirm>
                ),
              },
            ]}
          />
        </Space>
      ),
      align: "center",
    },
  ];

  const cancel = () => {};
  const onDelete = async (id: number) => {
    try {
      const result = await deleteEmp(id);
      if (result && "error" in result) {
        notification.error({
          message: `Xóa nhân viên thất bại`,
          placement: "bottomRight",
          className: "h-16",
        });
      } else {
        notification.success({
          message: `Xóa nhân viên thành công`,
          placement: "bottomRight",
          className: "h-16",
        });
        refetch();
      }
    } catch (error) {
      console.error("Xóa thất bại" + error);
    }
  };

  const validData =
    data?.results && Array.isArray(data.results) ? data.results : [];

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    validData.forEach((e: Employee) => {
      const deptName = e.department || e.position?.department_name;
      if (deptName) set.add(deptName);
    });
    return Array.from(set).map((name) => ({ label: name, value: name }));
  }, [validData]);

  if (error && "status" in error) {
    const fetchError = error as FetchBaseQueryError;
    if (fetchError.status === 403) {
      router.push("/403/");
    }
  }

  const onSearchChange = (changedValues: any, allValues: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setPagination((prevState) => ({
        ...prevState,
        current: 1,
        searchTerm: allValues.searchTerm || "",
      }));
    }, 500);
  };

  const filterData = () => {
    let filteredData = validData;

    if (pagination.searchTerm) {
      const q = pagination.searchTerm.toLowerCase();
      filteredData = filteredData.filter((r: Employee) => {
        const searchString = `${r.id} ${r.code || ""} ${r.full_name || ""} ${r.mobile || ""} ${
          r.email || ""
        }`.toLowerCase(); // ⬅️ dùng string
        return searchString.includes(q);
      });
    }

    if (pagination.startDate || pagination.endDate) {
      filteredData = filteredData.filter((r: Employee) => {
        const startOk = pagination.startDate
          ? r.contract_start >= pagination.startDate
          : true;
        const endOk = pagination.endDate
          ? r.contract_end <= pagination.endDate
          : true;
        return startOk && endOk;
      });
    }

    if (pagination.department) {
      filteredData = filteredData.filter((r: Employee) => {
        const deptName = r.department || r.position?.department_name || "";
        return (
          deptName.toLowerCase() === (pagination.department ?? "").toLowerCase()
        );
      });
    }

    return filteredData;
  };

  // Export to Excel with styling and Vietnamese font support
  const exportToExcel = () => {
    const exportData = filterData().map((e: Employee) => ({
      "Mã NV": e.code,
      "Họ và tên": e.full_name, // ⬅️
      SĐT: e.mobile,
      Email: e.email,
      "Vị trí": e.position?.title || "",
      "Phòng ban": e.department || e.position?.department_name || "",
      "Thâm niên": e.calculate_seniority || "",
      "Hợp đồng": e.contract_type === "OF" ? "Chính thức" : "Thực tập",
      "Trạng thái":
        e.contract_status === "AC" ? "Còn hiệu lực" : "Hết hiệu lực",
      "Ngày bắt đầu làm": e.start_date,
      "Thời hạn hợp đồng": `${e.contract_start} - ${e.contract_end}`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    // Định dạng tiêu đề
    const headerStyle = {
      font: { bold: true, name: "Arial", color: { rgb: "FFFFFF" } }, // Sử dụng font Arial (có sẵn trên hầu hết các hệ thống)
      fill: { fgColor: { rgb: "4F81BD" } }, // Màu xanh dương nhạt
      alignment: { horizontal: "center", vertical: "center" },
    };

    // Áp dụng định dạng cho hàng tiêu đề
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:K1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = headerStyle;
    }

    // Điều chỉnh độ rộng cột
    worksheet["!cols"] = [
      { wch: 10 }, // Mã NV
      { wch: 20 }, // Họ và tên
      { wch: 15 }, // SĐT
      { wch: 25 }, // Email
      { wch: 15 }, // Vị trí
      { wch: 15 }, // Phòng ban
      { wch: 10 }, // Thâm niên
      { wch: 15 }, // Hợp đồng
      { wch: 15 }, // Trạng thái
      { wch: 15 }, // Ngày bắt đầu
      { wch: 25 }, // Thời hạn hợp đồng
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "Employee_List.xlsx");
  };

  return (
    <div
      className={`w-screen ${
        isCollapse ? "md:w-[calc(100vw-160px)]" : "md:w-[calc(100vw-330px)]"
      } px-6`}
    >
      <div className="flex justify-between items-center pt-2 max-md:flex-col max-md:gap-3 mb-2">
        <div className={"flex flex-row"}>
          <Form
            layout="inline"
            className="max-md:gap-2 "
            form={form}
            onValuesChange={onSearchChange}
          >
            <Form.Item name="searchTerm" className="max-md:w-full w-[300px]">
              <Input placeholder="Nhập mã nhân viên, tên, SĐT, email" />
            </Form.Item>
          </Form>
        </div>

        <div className="flex justify-end text-right w-full gap-2">
          <Button
            type="dashed"
            className="flex items-center justify-center border-blue-500 text-blue-500"
            icon={<BsFiletypeXls className="text-blue-500" />}
            onClick={exportToExcel}
          >
            Xuất Excel
          </Button>
          <AddAndUpdateEmployee />
        </div>
      </div>

      <div className="overflow-x-auto mt-3">
        <Table
          columns={columns}
          dataSource={filterData()}
          rowKey="id"
          bordered
          scroll={{ x: 1650 }}
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            total: data?.count || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
        />
      </div>
    </div>
  );
}

export default EmployeesList;
