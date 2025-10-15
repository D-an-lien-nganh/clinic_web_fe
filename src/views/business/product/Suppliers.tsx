"use client";
import {
  useDeleteSupplierMutation,
  useGetSuppliersListQuery,
} from "@/api/app_product/apiService";
import AddAndUpdateSupplier from "@/views/business/product/components/AddAndUpdateSupplier";
import { Button, Form, Input, notification, Popconfirm , Row, Col,DatePicker} from "antd";
import { ColumnsType } from "antd/es/table";
import { Table } from "antd/lib";
import React, { useState } from "react";
import RelatedProduct from "@/views/business/product/components/RelatedProduct";
import dayjs from 'dayjs';
interface Supplier {
  id: number;
  user: number;
  code: string;
  name: string;
  MST: string;
  contact_person: string;
  mobile: string;
  email: string;
  address: string;
}

export default function Suppliers() {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    page: 1,
    pageSize: 10,
    searchTerm: "",
  });

  // Gọi API với các tham số động
  const { data: supplierList, refetch } = useGetSuppliersListQuery(filters);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [deleteSupplier, { isLoading: isLoadingDelete }] =
      useDeleteSupplierMutation();

  const onFinish = (values:any) => {
    // Format lại giá trị trước khi set vào filters
    const newFilters = {
      ...filters,
      searchTerm: values.searchTerm || "",
      startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : "",
      endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : "",
      page: 1, // Reset về trang 1 khi lọc mới
    };

    setFilters(newFilters);
    refetch(); // Gọi lại API với filters mới
  };
  const handleSearchClear = (e:any) => {
    if (!e.target.value) {
      const newFilters = {
        ...filters,
        searchTerm: "",
        page: 1,
      };
      setFilters(newFilters);
      refetch();
    }
  };
  const handleReset = () => {
    form.resetFields();
    setFilters({
      startDate: "",
      endDate: "",
      page: 1,
      pageSize: 10,
      searchTerm: "",
    });
    refetch();
  };
  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const onDelete = async (SupplierId: number) => {
    console.log("SupplierId", SupplierId);
    try {
      await deleteSupplier({ supplierId: SupplierId });
      notification.success({
        message: `Xóa nhà cung cấp thành công`,
        placement: "bottomRight",
        className: "h-16",
      });
    } catch (error) {
      notification.error({
        message: `Xóa nhà cung cấp thất bại`,
        placement: "bottomRight",
        className: "h-16",
      });
    }
  };

  const columns: ColumnsType<Supplier> = [
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
      title: "Tên NCC",
      dataIndex: "name",
      align: "center",
    },
    {
      key: "MST",
      title: "MST",
      dataIndex: "MST",
      align: "center",
    },
    {
      key: "contact_person",
      title: "Người liên hệ",
      dataIndex: "contact_person",
      align: "center",
    },
    {
      key: "mobile",
      title: "Số điện thoại",
      align: "center",
      dataIndex: "mobile",
    },
    {
      key: "email",
      title: "Email",
      align: "center",
      dataIndex: "email",
    },
    {
      key: "address",
      title: "Địa chỉ",
      dataIndex: "address",
      align: "center",
    },
    {
      title:"Sản phẩm liên quan",

      align: "center",

      render: (_, record) => (
          <RelatedProduct id={record.id} />
      ),
    },
    {
      key: "actions",
      dataIndex: "",
      align: "center",
      fixed: "right",
      width:150,
      render: (_, record) => (
          <div className="flex justify-center items-center space-x-4">
            <AddAndUpdateSupplier data={record} edit={true} />
            <Popconfirm
                title="Bạn có chắc muốn xóa không?"
                onConfirm={() => onDelete(record.id)}
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

  return (
      <div className="min-h-[calc(100vh-70px)] p-6">
        <div className={'flex items-center gap-4 mb-[10px]'}>
          <Form
              form={form}
              onFinish={onFinish}
              layout="inline" // Chuyển sang layout "inline" để các item nằm ngang
              initialValues={{
                searchTerm: filters.searchTerm,
                startDate: filters.startDate ? dayjs(filters.startDate) : null,
                endDate: filters.endDate ? dayjs(filters.endDate) : null,
              }}
          >
            <Form.Item name="searchTerm">
              <Input
                  size="middle"
                  placeholder="Nhập họ tên nhà cung cấp"
                  allowClear
                  onChange={handleSearchClear}
                  style={{width: '200px'}}
              />
            </Form.Item>

            <Form.Item name="startDate">
              <DatePicker
                  size="middle"
                  format="DD/MM/YYYY"
                  placeholder="Từ ngày"
                  style={{width: '200px'}}
              />
            </Form.Item>

            <Form.Item name="endDate">
              <DatePicker
                  size="middle"
                  format="DD/MM/YYYY"
                  placeholder="Đến ngày"
                  style={{width: '200px'}}
              />
            </Form.Item>

            <Button size="middle" type="primary" htmlType="submit">
              Lọc
            </Button>
          </Form>
          <div className="ml-auto">
            <AddAndUpdateSupplier/>
          </div>
        </div>


        <div className="overflow-x-auto">
          <Table
              columns={columns}
              dataSource={supplierList?.results}
              bordered
              scroll={{x: 1000}}
              onChange={handleTableChange}
              pagination={{
                ...pagination,
                total: supplierList?.total,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100", "200"],
              }}
          />
        </div>
      </div>
  );
}
