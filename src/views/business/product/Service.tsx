"use client";
import {
  useDeleteProductMutation,
  useDeleteServiceMutation,
  useGetProductListQuery,
  useGetServiceListQuery,
} from "@/api/app_product/apiService";
import { Button, notification, Popconfirm, Table, Tabs, Input } from "antd";
import { ColumnsType } from "antd/es/table";
import React, { useEffect, useState } from "react";
import AddAndUpdateService from "./components/AddAndUpdateService";

import dayjs from "dayjs";
import AddAndUpdateProduct from "./components/AddAndUpdateProduct";
import { BsFiletypePdf, BsFiletypeXls } from "react-icons/bs";
// import { exportServiceListToExcel } from "@/constants/excelFile/Excel";

interface Service {
  key: React.Key;
  id: number;
  code: string; // Mã dịch vụ
  name: string; // Tên dịch vụ
  type: string; // Loại trị liệu
  treatment_package: string; // Gói liệu trình
  duration: number; // Thời gian (đơn vị: phút)
  price: number; // Giá (đơn vị: VNĐ)
}

interface Medicine {
  key: React.Key;
  id: number;
  title: string;
  expiration_date: Date;
  effect: string;
  import_price: number;
  sell_price: number;
  origin: string;
}

const Service = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const {
    data: serviceList,
    isLoading,
    refetch,
  } = useGetServiceListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    searchTerm,
  });
  const [deleteService, { isLoading: isLoadingDelete }] =
    useDeleteServiceMutation();

  const handleRowClick = (record: Service) => {
    setSelectedRowId(record.id);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(tempSearchTerm);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [tempSearchTerm]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const onDelete = async (serviceId: number) => {
    try {
      await deleteService({ serviceId });
      notification.success({
        message: `Xóa dịch vụ thành công`,
        placement: "bottomRight",
        className: "h-16",
      });
    } catch (error) {
      notification.error({
        message: `Xóa dịch vụ thất bại`,
        placement: "bottomRight",
        className: "h-16",
      });
    }
  };

  const columns: ColumnsType<Service> = [
    {
      key: "index",
      title: "STT",
      width: 45,
      align: "center",
      render: (_, __, idx) =>
        (pagination.current - 1) * pagination.pageSize + idx + 1,
    },
    {
      key: "name",
      title: "Tên dịch vụ",
      dataIndex: "name",
      align: "center",
      onCell: (record) => ({
        onClick: () => handleRowClick(record),
        style: { cursor: "pointer" },
      }),
    },
    {
      key: "type",
      title: "Loại trị liệu",
      dataIndex: "type",
      align: "center",
    },
    {
      key: "treatment_package",
      title: "Gói liệu trình",
      dataIndex: "treatment_packages_info",
      align: "center",
      render: (packages) => (
        <div>
          {packages?.map((pkg: any, idx: any) => (
            <div key={idx}>{pkg.name}</div>
          ))}
        </div>
      ),
    },
    {
      key: "duration",
      title: "Thời gian",
      dataIndex: "treatment_packages_info",
      align: "center",
      render: (packages) => (
        <div>
          {packages?.map((pkg: any, idx: any) => (
            <div key={idx}>{pkg.duration} phút</div>
          ))}
        </div>
      ),
    },
    {
      key: "price",
      title: "Giá",
      dataIndex: "treatment_packages_info",
      align: "center",
      render: (packages) => (
        <div>
          {packages?.map((pkg: any, idx: any) => (
            <div key={idx}>{pkg.price.toLocaleString("vi-VN")} đ</div>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      fixed: "right",
      width: 150,
      dataIndex: "",
      align: "center",
      render: (_, { id }) => (
        <div className="flex justify-center items-center space-x-4">
          <AddAndUpdateService title="Sửa dịch vụ" id={id} edit />
          <Popconfirm
            title="Bạn có chắc muốn xóa không?"
            onConfirm={() => onDelete(id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button danger size="small" className="max-sm:hidden">
              Xóa
            </Button>
            <div className="sm:hidden text-center">Xóa</div>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const dataSource =
    serviceList?.results?.map((record: { id: any }) => ({
      ...record,
      key: record.id,
    })) || [];

  const filteredService =
    searchTerm.trim() === ""
      ? dataSource
      : dataSource.filter((emp: any) => {
          const lowerSearch = searchTerm.toLowerCase();
          return (
            emp?.name?.toLowerCase().includes(lowerSearch) ||
            emp?.code?.toLowerCase().includes(lowerSearch)
          );
        });

  const handleDownloadExcel = () => {
    // if (!filteredService || filteredService.length === 0) {
    //     console.error("Không có dữ liệu để xuất Excel!");
    //     return;
    // }
    // exportServiceListToExcel(filteredService);
    console.log("xuất excel");
  };

  return (
    <div className="min-h-[calc(100vh-70px)]">
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Nhập mã sản phẩm, mã dịch vụ..."
          className="!w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className={"flex items-end gap-4"}>
          <AddAndUpdateService title="Thêm dịch vụ" />
        </div>
      </div>
      {selectedRowId && (
        <AddAndUpdateService
          refetch={refetch}
          title="Chi tiết khách hàng"
          id={selectedRowId}
          readOnly={true}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedRowId(null);
          }}
        />
      )}
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={filteredService}
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            total: serviceList?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
          bordered
          scroll={{ x: 1000 }}
          tableLayout="auto"
        />
      </div>
    </div>
  );
};

const Product = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const {
    data: dataProduct,
    isLoading,
    refetch,
  } = useGetProductListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    searchTerm,
  });
  const [deleteProduct, { isLoading: isLoadingDelete }] =
    useDeleteProductMutation();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(tempSearchTerm);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [tempSearchTerm]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

    // ---- thêm ngay trên Product component ----
  const PRODUCT_TYPE_LABEL: Record<string, string> = {
    thuoc: "Thuốc",
    tpchucnang: "TPCN",
    consumable: "Vật tư",
    device: "Thiết bị"
  };

  // Hàm helper: phòng trường hợp backend trả object thay vì string
  const toProductTypeLabel = (raw: any) => {
    const key =
      typeof raw === "string"
        ? raw.toLowerCase()
        : (raw?.code || raw?.slug || raw?.key || "").toLowerCase();

    return PRODUCT_TYPE_LABEL[key] ?? raw?.name ?? raw ?? "Khác";
  };

  const onDelete = async (productId: number) => {
    try {
      await deleteProduct({ productId }).unwrap();
      notification.success({
        message: `Xóa sản phẩm thành công`,
        placement: "bottomRight",
        className: "h-16",
      });
    } catch (error) {
      notification.error({
        message: `Xóa sản phẩm thất bại`,
        placement: "bottomRight",
        className: "h-16",
      });
    }
  };

  const handleRowClick = (record: Medicine) => {
    setSelectedRowId(record.id);
    setIsDetailModalOpen(true);
  };

  const columns: ColumnsType<Medicine> = [
    {
      key: "index",
      title: "STT",
      width: 45,
      align: "center",
      render: (_, __, idx) =>
        (pagination.current - 1) * pagination.pageSize + idx + 1,
    },
    {
      key: "code",
      title: "Mã sản phẩm",
      dataIndex: "code",
      align: "center",
    },
    {
      key: "name",
      title: "Tên sản phẩm",
      dataIndex: "name",
      align: "center",
    },
    {
      key: "product_type",
      title: "Loại sản phẩm",
      dataIndex: "product_type",
      align: "center",
      render: (value) => toProductTypeLabel(value),
    },
    {
      key: "origin",
      title: "Nguồn gốc",
      dataIndex: "origin",
      align: "center",
    },
    {
      key: "unit_name",
      title: "Đơn vị",
      dataIndex: "unit_name",
      align: "center",
    },
    {
      key: "description",
      title: "Mô tả",
      dataIndex: "description",
      align: "center",
    },
    {
      key: "sell_price",
      title: "Giá bán",
      dataIndex: "sell_price",
      render: (value) => {
        if (!value) return "";
        return Number(value)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      },
      align: "center",
    },
    {
      title: "Hành động",
      key: "actions",
      dataIndex: "",
      align: "center",
      width: 100,
      fixed: "right",
      render: (_, { id }) => (
        <div className="flex justify-center items-center space-x-4">
          <AddAndUpdateProduct title="Sửa sản phẩm" id={id} edit={true} />
          <Popconfirm
            title="Bạn có chắc muốn xóa không?"
            onConfirm={() => onDelete(id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button danger className="max-sm:hidden" size="small">
              Xóa
            </Button>
            <div className="sm:hidden text-center">Xóa</div>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const dataSource =
    dataProduct?.results?.map((record: { id: any }) => ({
      ...record,
      key: record.id,
    })) || [];

  const filteredProduct =
    searchTerm.trim() === ""
      ? dataSource
      : dataSource.filter((emp: any) => {
          const lowerSearch = searchTerm.toLowerCase();
          return (
            emp?.name?.toLowerCase().includes(lowerSearch) ||
            emp?.code?.toLowerCase().includes(lowerSearch)
          );
        });
  const handleDownloadExcel = () => {
    // if (!filteredProduct || filteredProduct.length === 0) {
    //     console.error("Không có dữ liệu để xuất Excel!");
    //     return;
    // }
    // exportServiceListToExcel(filteredProduct);
    console.log("xuất excel : ");
  };

  return (
    <div className="min-h-[calc(100vh-70px)]">
      <div className="mb-4 flex justify-between">
        <Input
          placeholder="Tìm theo tên hoặc mã..."
          className="!w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className={"flex items-end justify-end gap-4"}>
          {/* <Button onClick={handleDownloadExcel} color="cyan" variant="dashed"> */}
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
          <AddAndUpdateProduct title="Thêm mới sản phẩm" />
        </div>
      </div>
      {selectedRowId && (
        <AddAndUpdateProduct
          refetch={refetch}
          title="Chi tiết khách hàng"
          id={selectedRowId}
          readOnly={true}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedRowId(null);
          }}
        />
      )}
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={filteredProduct}
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            total: dataProduct?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
          bordered
          scroll={{ x: 1000 }}
          tableLayout="auto"
        />
      </div>
    </div>
  );
};

const Services: React.FC = () => {
  const items = [
    {
      key: "1",
      label: "Dịch vụ",
      children: <Service />,
    },
    {
      key: "2",
      label: "Sản phẩm",
      children: <Product />,
    },
  ];

  return (
    <div className="px-6">
      <Tabs className="mt-6" defaultActiveKey="1" items={items} />
    </div>
  );
};

export default Services;
