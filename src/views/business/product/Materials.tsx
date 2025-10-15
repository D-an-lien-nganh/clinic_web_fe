"use client";
import {
  useDeleteFacilityMutation,
  useGetFacilityListQuery,
} from "@/api/app_product/apiService";
import AddAndUpdateMaterial from "./components/AddAndUpdateMaterial";
import {
  Button,
  DatePicker,
  Form,
  Input,
  notification,
  Popconfirm,
  Table,
} from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useState } from "react";

interface DataType {
  key: React.Key;
  id: number;
  name: string;
  quantity: number;
  status: string;
  is_malfunction: boolean;
  import_price: number;
  effect: string;
  arrival_date: string;
  maintenance_appointment_date: string;
}

export default function Materials() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    searchTerm: "",
    startDate: "",
    endDate: "",
    page: 1,
    pageSize: 10,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const { data: facilityList, refetch } = useGetFacilityListQuery(filters);
  const [deleteFacility] = useDeleteFacilityMutation();

  const onDelete = async (id: number) => {
    try {
      await deleteFacility({ id }).unwrap();
      notification.success({
        message: "Xóa vật tư thành công",
        placement: "bottomRight",
      });
      refetch();
    } catch {
      notification.error({ message: "Xóa thất bại", placement: "bottomRight" });
    }
  };

  // Khi bấm Lọc
  const onFinish = (values: any) => {
    const newFilters = {
      ...filters,
      searchTerm: values.searchTerm || "",
      startDate: values.startDate
        ? dayjs(values.startDate).format("YYYY-MM-DD")
        : "",
      endDate: values.endDate ? dayjs(values.endDate).format("YYYY-MM-DD") : "",
      page: 1,
    };
    setFilters(newFilters);
    setPagination((p) => ({ ...p, current: 1 }));
    refetch();
  };

  // Khi nhấn clear input tìm kiếm
  const handleSearchClear = (e: any) => {
    if (!e.target.value) {
      const newFilters = { ...filters, searchTerm: "", page: 1 };
      setFilters(newFilters);
      setPagination((p) => ({ ...p, current: 1 }));
      refetch();
    }
  };

  // Reset toàn bộ filter
  const handleReset = () => {
    form.resetFields();
    const reset = {
      searchTerm: "",
      startDate: "",
      endDate: "",
      page: 1,
      pageSize: 10,
    };
    setFilters(reset);
    setPagination({ current: 1, pageSize: 10 });
    refetch();
  };

  // Khi đổi trang hoặc pageSize
  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
    setFilters((f) => ({
      ...f,
      page: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (_, __, idx) =>
        (pagination.current - 1) * pagination.pageSize + idx + 1,
    },
    { title: "Tên vật tư", dataIndex: "name", align: "center", key: "name" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      align: "center",
      key: "quantity",
    },
    {
      title: "Tình trạng",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (value: string) => {
        const labels: Record<string, string> = {
          new: "Mới",
          old: "Hỏng",
          inuse: "Đang sử dụng",
        };
        return labels[value] ?? value;
      },
    },
    {
      title: "Phát hiện hỏng hóc",
      dataIndex: "is_malfunction",
      align: "center",
      key: "is_malfunction",
      render: (v) => (v ? "Có" : "Không"),
    },
    {
      title: "Giá mua",
      dataIndex: "import_price",
      align: "center",
      key: "import_price",
      render: (v) =>
        Number(v).toLocaleString("vi-VN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
    },
    { title: "Tác dụng", dataIndex: "effect", align: "center", key: "effect" },
    {
      title: "Ngày nhập hàng",
      dataIndex: "arrival_date",
      key: "arrival_date",
      align: "center",
      sorter: (a, b) =>
        dayjs(a.arrival_date).unix() - dayjs(b.arrival_date).unix(),
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Ngày hẹn bảo trì",
      dataIndex: "maintenance_appointment_date",
      key: "maintenance_appointment_date",
      align: "center",
      sorter: (a, b) =>
        dayjs(a.maintenance_appointment_date).unix() -
        dayjs(b.maintenance_appointment_date).unix(),
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Hành động",
      key: "actions",
      dataIndex: "",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center space-x-2">
          <AddAndUpdateMaterial edit title="Sửa vật tư" id={record.id} />
          <Popconfirm
            title="Bạn có chắc muốn xóa không?"
            onConfirm={() => onDelete(record.id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button danger size="small">
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const dataSource =
    facilityList?.results?.map((r: any) => ({ ...r, key: r.id })) || [];

  return (
    <div className="min-h-[calc(100vh-70px)] p-6">
      {/* Filter Form */}
      <div className="mb-4 flex items-center gap-4">
        <Form
          form={form}
          layout="inline"
          onFinish={onFinish}
          initialValues={{
            searchTerm: filters.searchTerm,
            startDate: filters.startDate ? dayjs(filters.startDate) : null,
            endDate: filters.endDate ? dayjs(filters.endDate) : null,
          }}
        >
          <Form.Item name="searchTerm">
            <Input
              placeholder="Tìm vật tư theo tên"
              allowClear
              onChange={handleSearchClear}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="startDate">
            <DatePicker
              placeholder="Từ ngày nhập"
              format="DD/MM/YYYY"
              style={{ width: 160 }}
            />
          </Form.Item>
          <Form.Item name="endDate">
            <DatePicker
              placeholder="Đến ngày nhập"
              format="DD/MM/YYYY"
              style={{ width: 160 }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lọc
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset}>Làm mới</Button>
          </Form.Item>
        </Form>

        <div className="ml-auto">
          <AddAndUpdateMaterial title="Thêm vật tư" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={{
            ...pagination,
            total: facilityList?.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          bordered
          scroll={{ x: 1300 }}
        />
      </div>
    </div>
  );
}
