"use client";

import {
  useDeleteTechnicalSettingMutation,
  useGetTechnicalSettingListQuery,
} from "@/api/app_product/apiService";
import { Button, Form, Input, notification, Popconfirm, Space } from "antd";
import { ColumnsType } from "antd/es/table";
import { Table } from "antd/lib";
import React, { useState } from "react";
import AddAndUpdateTechnical from "./components/AddAndUpdateTechnical";
import { CiFilter } from "react-icons/ci";

interface Technical {
  key: React.Key;
  id: any;
  name: string;
  duration: number;
  price: string;
  is_active: string;
}

export default function Technicals() {
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    searchTerm: "",
  });

  const { data, refetch } = useGetTechnicalSettingListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    searchTerm: pagination.searchTerm,
  });
  const [deleteTechnical, { isLoading: isLoadingDelete }] =
    useDeleteTechnicalSettingMutation();

  const onFinish = () => {
    setPagination({ ...pagination, current: 1 });
    // refetch();
  };
  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const onDelete = async (id: number) => {
    try {
      const response = await deleteTechnical({ id }).unwrap();

      notification.success({
        message: "Chuyển trạng thái thành công",
        description: "Kỹ thuật đã bị vô hiệu hóa",
        placement: "bottomRight",
        className: "h-22",
      });
      refetch();
    } catch (error) {
      notification.error({
        message: "Cập nhật trạng thái thất bại",
        placement: "bottomRight",
        className: "h-22",
      });
    }
  };

  const columns: ColumnsType<Technical> = [
    {
      key: "index",
      title: "STT",
      width: 45,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      key: "name",
      title: "Kỹ thuật",
      dataIndex: "name",
      align: "center",
    },
    {
      key: "duration",
      title: "Thời gian",
      dataIndex: "duration",
      align: "center",
    },
    {
      key: "price",
      title: "Số tiền",
      dataIndex: "price",
      align: "center",
      render: (price) =>
        price ? new Intl.NumberFormat("vi-VN").format(price) + " VND" : "0 VND",
    },
    {
      key: "is_active",
      title: "Trạng thái",
      dataIndex: "is_active",
      align: "center",
      render: (isActive) => (isActive ? "Hoạt động" : "Không hoạt động"),
    },
    {
      key: "actions",
      dataIndex: "",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center items-center space-x-4">
          <AddAndUpdateTechnical data={record?.id} edit={true} />
          <Popconfirm
            title="Bạn có chắc muốn xóa không?"
            onConfirm={() => onDelete(record.id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              danger={!!record.is_active}
              type={record.is_active ? "primary" : "default"}
              size="small"
              className={`min-w-[90px] text-center ${
                record.is_active
                  ? ""
                  : "bg-green-500 hover:bg-green-600 text-white border-none"
              }`}
            >
              {record.is_active ? "Khóa" : "Mở khóa"}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const onSearchChange = (values: any) => {
    setPagination((prevState) => ({
      ...prevState,
      current: 1,
      searchTerm: values.searchTerm,
    }));
  };

  const dataSource =
    data?.results?.map((record: { id: any }) => ({
      ...record,
      key: record.id,
    })) || [];

  return (
    <div className="min-h-[calc(100vh-70px)] p-6">
      <Form
        layout="inline"
        className="max-md:gap-2 w-2/3"
        form={form}
        onFinish={onSearchChange}
      >
        <Form.Item name="searchTerm" className="max-md:w-full w-1/3">
          <Input placeholder="Tên kỹ thuật" />
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

      <div className="mb-4 flex justify-end">
        <AddAndUpdateTechnical />
      </div>
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={dataSource}
          bordered
          scroll={{ x: 1300 }}
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            total: data?.total | 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
        />
      </div>
    </div>
  );
}
