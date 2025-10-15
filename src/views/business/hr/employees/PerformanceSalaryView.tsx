"use client";
// import {
//   useDeleteExpertMutation,
//   useGetExpertsQuery,
// } from "@/api/app_schedule/apiExpert"; // Import hook để gọi API
import React, { useEffect, useState } from "react";
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
  Modal,
  Tabs,
} from "antd"; // Thêm Spin để hiển thị khi đang tải dữ liệu
import { ColumnsType } from "antd/es/table";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useRouter } from "next/navigation";
import { TbListTree } from "react-icons/tb";
import { useGetSetupQuery } from "@/api/app_home/apiSetup";
import { FilterOutlined } from '@ant-design/icons';
import ActionTable from "@/components/DropDown/ActionTable";
import { useWindowSize } from "@/utils/responsiveSm";
import { IoMdSettings } from "react-icons/io";
import { FaFileExport } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";
import { BsFiletypePdf, BsFiletypeXls } from "react-icons/bs";
import { MenuProps } from "antd/lib";
import { useGetEmployeeListQuery } from "@/api/app_hr/apiHR";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import DetailTherapy from "./components/DetailTherapy";
import { CiFilter } from "react-icons/ci";

// type DataType = {
//   employeeCode: string;
//   name: string;
//   department: string;
//   position: string;
//   contract: string;
//   experienceSessions: number;
//   experienceBoosts: number;
//   therapySessions: number;
//   therapyBoosts: number;
//   effectiveSalary: string;
// };

interface DataType {
  id: number;
  user: string | null;
  user_profile: number;
  contract: string;
  contract_start: string;
  contract_end: string;
  contract_status: string;
  contract_type: string;
  start_date: string;
  level: string;
  calculate_seniority: string;
  contract_base64: string | null;
  expert_done_session_exp: number;
  expert_done_session_ser: number;
  expert_salary: number;
  full_name?: {
    full_name: string; // Thêm trường này nếu API trả về giá trị tương tự.
  };
}

function PerformanceSalaryView() {
  const [form] = Form.useForm();
  const [width] = useWindowSize();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    searchTerm: "",
  })
  const isCollapse = useSelector(
    (state: RootState) => state.collapse.isCollapse
  );
  const router = useRouter();
  // Sử dụng hook để gọi API lấy danh sách nhân viên
  const { data, refetch, error, isLoading } = useGetEmployeeListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    searchTerm: pagination.searchTerm,
  });

  const [activeTab, setActiveTab] = useState("therapy");
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null); // State lưu dòng được chọn
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [menuName, setMenuName] = useState<string>("Hành động");
  const [isCheckboxClicked, setIsCheckboxClicked] = useState(false);
  // Định nghĩa các cột cho bảng
  const columns: ColumnsType<DataType> = [
    {
      title: "#",
      key: "index",
      width: 50,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * 10 + index + 1,
    },
    {
      align: "center",
      title: `Mã NV `,
      key: "id",
      dataIndex: "id",
    },
    {
      align: "center",
      title: "Tên",
      key: "full_name",
      render: (_: any, record: any) => `${record?.full_name?.full_name} `,
    },
    {
      align: "center",
      title: "Phòng ban",
      key: "department",
      render: (_: any, record: any) => `${record?.position?.department_name} `,
    },
    {
      align: "center",
      title: "Vị trí",
      key: "position",
      render: (_: any, record: any) => `${record?.position?.title} `,
    },
    {
      align: "center",
      title: "Hợp đồng",
      key: "contract_type",
      dataIndex: "contract_type",
      render: (type) =>
        type === "OF" ? "Chính thức" : type === "IN" ? "Thực tập" : type,
    },
    {
      align: "center",
      title: `Lượt làm trải nghiệm`,
      key: "expert_done_session_exp",
      dataIndex: "expert_done_session_exp",
    },
    {
      align: "center",
      title: `Lượt làm trị liệu`,
      key: "expert_done_session_ser",
      dataIndex: "expert_done_session_ser",
      render: (value) =>
        Number.isInteger(value) ? value : value.toFixed(2),
    },
    {
      align: "center",
      title: `Lương hiệu suất`,
      key: "expert_salary",
      dataIndex: "expert_salary",
      render: (expert_salary) =>
        expert_salary
          ? new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expert_salary) + " VND"
          : "0 VND",
    }
  ];

  const handleCheckboxChange = (id: number) => {
    const selectedKeys = [...selectedRowKeys];
    if (selectedRowKeys.includes(id)) {
      // If already selected, remove it
      setSelectedRowKeys(selectedKeys.filter((key) => key !== id));
    } else {
      // If not selected, add it
      setSelectedRowKeys([...selectedKeys, id]);
    }
    setIsCheckboxClicked(true); // Set the flag to true when checkbox is clicked
  };

  const handleRowClick = (record: any) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => setSelectedRowKeys(selectedRowKeys),
  };

  const onTabChange = (key: string) => {
    setActiveTab(key);  // Chỉ cần cập nhật activeTab
  };

  useEffect(() => {
    if (selectedRecord) {
      // Ensure that the tab is updated or rerendered with the selectedRecord
      setActiveTab('TLCB'); // or 'TLDS' based on the context
    }
  }, [selectedRecord]);

  const cancel = () => { };

  const validData =
    data?.results && Array.isArray(data.results) ? data.results : [];

  const onSearchChange = (values: any) => {
    setPagination((prevState) => ({
      ...prevState,
      current: 1,
      searchTerm: values.searchTerm,
    }));
  };

  const filterData = () => {
    if (!tempSearchTerm) return validData;

    return validData.filter((record: DataType) => {
      const { id, full_name } = record;
      const searchString = `${id} ${full_name?.full_name} `.toLowerCase();
      return searchString.includes(tempSearchTerm);
    });
  };

  // const { onExcelPrint, onPdfPrint } = useExport({
  //   columns: fileColumns,
  //   data: convertedData,
  //   fileName: "DanhSachKhachHang",
  //   pdfTheme: "striped",
  //   pdfOptions,
  // });

  // useEffect(() => {
  //   if (isExportTriggered && AllQuotationList) {
  //     const newData = AllQuotationList.results.map((record: any) => ({
  //       ...record,
  //       key: record.id,
  //     }));
  //     setAllData(newData);
  //     setIsExportComplete(true);
  //     setIsExportTriggered(false);
  //   }
  // }, [AllQuotationList, isExportTriggered]);

  // useEffect(() => {
  //   if (allData.length > 0 && isExportComplete) {
  //     onExcelPrintAllData();
  //     setIsExportComplete(false);
  //   }
  // }, [allData, isExportComplete]);

  // const handleExportAllData = (exportFn: any) => {
  //   setIsExportTriggered(true); // Bắt đầu trạng thái loading khi xuất file
  //   if (allData.length === 0) {
  //     setIsExportTriggered(true);
  //   } else {
  //     exportFn();
  //     setIsExportTriggered(false);
  //   }
  // };

  // const { onExcelPrint: onExcelPrintAllData, onPdfPrint: onPdfPrintAllData } =
  //   useExport({
  //     columns: fileColumns,
  //     data: convertData(allData),
  //     fileName: "DanhSachBaoGia",
  //     pdfTheme: "striped",
  //     pdfOptions,
  //   });

  const items: MenuProps["items"] = [
    {
      label: "Chọn nhiều",
      key: "1",
      icon: <FaFileExport />,
    },
    {
      label: "Xuất tất cả",
      key: "2",
      children: [
        {
          label: "Xuất Excel",
          key: "3",
          // onClick: () => handleExportAllData(onExcelPrintAllData),
        },
        {
          label: "Xuất PDF",
          key: "5",
          // onClick: () => handleExportAllData(onPdfPrintAllData),
        },
      ],
    },
    {
      label: "Huỷ",
      key: "6",
      icon: <FcCancel />,
    },
  ];
  const renderIcon = (name: string, selectedCount: number) => {
    if (name === "Chọn nhiều") {
      return (
        <div style={{ position: "relative" }}>
          {selectedCount > 0 && (
            <div
              style={{
                background: "red",
                borderRadius: 50,
                height: 17,
                width: 17,
                position: "absolute",
                right: -5,
                top: -7,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 10 }}>
                {selectedCount}
              </span>
            </div>
          )}
        </div>
      );
    } else if (name === "Xuất tất cả") {
      return (
        <div style={{ position: "relative" }}>
          {selectedCount > 0 && (
            <div
              style={{
                background: "red",
                borderRadius: 50,
                height: 17,
                width: 17,
                position: "absolute",
                right: -5,
                top: -7,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 10 }}>
                {selectedCount}
              </span>
            </div>
          )}
        </div>
      );
    } else {
      return <IoMdSettings size={17} fill="gray" />;
    }
  };

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "1") setMenuName("Chọn nhiều");
    else if (e.key === "2") setMenuName("Xuất tất cả");
    else if (e.key === "6") {
      setMenuName("Hành động");
      ``;
      setSelectedRowKeys([]);
    }
  };

  const menuProps = {
    items: ["Chọn nhiều", "Xuất tất cả"].includes(menuName)
      ? items
      : items.splice(0, 2),
    onClick: handleMenuClick,
  };

  // Đóng modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  return (
    <div
      className={`w-screen ${isCollapse ? "md:w-[calc(100vw-160px)]" : "md:w-[calc(100vw-300px)]"
        } px-6`}
    >
      <div className="flex justify-between items-center pt-2 max-md:flex-col max-md:gap-3 mb-2">
        <Form
          layout="inline"
          className="max-md:gap-2 w-2/3"
          form={form}
          onFinish={onSearchChange}
        >
          <Form.Item name="searchTerm" className="max-md:w-full w-1/3">
            <Input placeholder="Nhập mã nhân viên, tên, SĐT, email" />
          </Form.Item>
          <Button
            type="default"
            shape="circle"
            size="middle"
            htmlType="submit"
            className="flex items-center justify-center border-blue-500 text-blue-500 rounded-full p-4"
          >
            <CiFilter />
          </Button>
        </Form>
        <div className="flex justify-end text-right w-full gap-2">
          <Button
            type="dashed"
            className="flex items-center justify-center border-blue-500 text-blue-500"
            icon={<BsFiletypePdf className="text-blue-500" />}
          // onClick={onPdfPrint}
          >
            Xuất PDF
          </Button>
          <Button
            type="dashed"
            className="flex items-center justify-center border-blue-500 text-blue-500"
            icon={<BsFiletypeXls className="text-blue-500" />}
          // onClick={onExcelPrint}
          >
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Hiển thị bảng với dữ liệu từ API */}
      <div className="overflow-x-auto mt-3">
        <Table
          columns={columns}
          dataSource={data?.results || []}  // Dữ liệu từ API
          rowKey="id"  // Sử dụng id làm key cho mỗi dòng
          rowSelection={rowSelection}  // Cấu hình row selection với checkboxes
          onRow={(record) => ({
            onClick: () => handleRowClick(record),  // Khi nhấp vào dòng, lưu record vào selectedRecord
          })}
        />
        <Modal
          title="Chi tiết lượt làm"
          visible={isModalVisible}
          onCancel={handleModalClose}
          width={700}
          footer={[
            <Button key="close" onClick={handleModalClose}>Đóng</Button>,
          ]}
        >
          {selectedRecord && (
            <Tabs activeKey={activeTab} onChange={onTabChange}>
              <Tabs.TabPane tab="Lượt làm trị liệu" key="TLCB">
                {/* Truyền selectedRecord vào DetailTherapy */}
                <DetailTherapy type="TLCB" recordId={selectedRecord.id} />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Lượt làm trải nghiệm" key="TLDS">
                {/* Truyền selectedRecord vào DetailTherapy */}
                <DetailTherapy type="TLDS" recordId={selectedRecord.id} />
              </Tabs.TabPane>
            </Tabs>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default PerformanceSalaryView;
