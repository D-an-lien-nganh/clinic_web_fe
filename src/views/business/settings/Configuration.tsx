"use client";
import React, { useState } from "react";
import { List, Table, Tag } from "antd";
import AddAndUpdateConfiguration from "./components/AddAndUpdateConfiguration";
import { ColumnsType } from "antd/es/table";
import DeleteConfirm from "@/components/Popconfirm/DeleteConfirm";
import { convertYMDToDMY, formatCurrency } from "@/utils/convert";

const TypeStatus = [
  { value: "percentage", label: "Phần trăm" },
  { value: "fixed", label: "Số tiền" },
];

interface PropsType {
  isTabs: string;
  display: "table" | "list";
  useGetListQuery: (args: any) => any;
  useCreateMutation: () => any;
  useEditMutation: () => any;
  useDeleteMutation: () => any;
}

interface DataType {
  id: number;
  title?: string;
  code?: string;
  name?: string;
  type?: string;
  note?: string;
  start_date?: string;
  end_date?: string;
  percentage?: number;
  rate?: number;
  color?: string;
  duration?: number;
  price?: number;
  department_name?: string;
  performance_coefficient?: number;
}

const ConfigTypeList = [
  { key: "discount", name: "Mã giảm giá" },
  { key: "commission", name: "Mức hoa hồng" },
  { key: "protocol", name: "Phác đồ" },
  { key: "source", name: "Nguồn khách hàng" },
  { key: "department", name: "Phòng ban" },
  { key: "floor", name: "Tầng điều trị" },
  { key: "position", name: "Chức vụ" },
  { key: "time", name: "Khung giờ" },
  { key: "unit", name: "Đơn vị tính" },
  { key: "treatment-package", name: "gói liệu trình" },
  { key: "test-services", name: "dịch vụ xét nghiệm" },
  { key: "technical-settings", name: "Kỹ thuật" },
];

export default function Configuration(props: PropsType) {
  const {
    isTabs,
    display,
    useGetListQuery,
    useCreateMutation,
    useEditMutation,
    useDeleteMutation,
  } = props;

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // API BE: { total, page, pageSize, results }
  const { data: configData, isLoading } = useGetListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    searchTerm: "",
  });

  const configTypeName =
    ConfigTypeList.find((i) => i.key === isTabs)?.name || "Cấu hình";

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_t, _r, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    ...(isTabs === "discount"
      ? ([
          { title: "Mã", dataIndex: "code", align: "center" as const },
          {
            title: "Tên mã giảm giá",
            dataIndex: "name",
            align: "center" as const,
          },
          {
            title: "Loại giảm giá",
            align: "center" as const,
            render: (_: any, record: DataType) =>
              TypeStatus.find((i) => i.value === record.type)?.label,
          },
          {
            title: "Mức áp dụng",
            align: "center" as const,
            render: (_: any, record: DataType) => {
              if (record.type === "fixed")
                return formatCurrency(record.rate || 0);
              if (record.type === "percentage") return `${record.rate}%`;
              return record.rate;
            },
          },
          {
            title: "Ngày bắt đầu",
            dataIndex: "start_date",
            align: "center" as const,
            render: (date?: string) => (date ? convertYMDToDMY(date) : ""),
          },
          {
            title: "Ngày kết thúc",
            dataIndex: "end_date",
            align: "center" as const,
            render: (date?: string) => (date ? convertYMDToDMY(date) : ""),
          },
        ] as ColumnsType<DataType>)
      : []),
    ...(isTabs === "department" || isTabs === "floor" || isTabs === "protocol"
      ? ([
          {
            title: `Mã ${
              (isTabs === "department" && "phòng ban") ||
              (isTabs === "floor" && "tầng") ||
              (isTabs === "protocol" && "phác đồ")
            }`,
            dataIndex: "code",
            align: "center" as const,
          },
          {
            title: `Tên ${
              (isTabs === "department" && "phòng ban") ||
              (isTabs === "floor" && "tầng") ||
              (isTabs === "protocol" && "phác đồ")
            }`,
            dataIndex: "name",
            align: "center" as const,
          },
          { title: "Ghi chú", dataIndex: "note", align: "center" as const },
        ] as ColumnsType<DataType>)
      : []),
    ...(isTabs === "position"
      ? ([
          { title: "Mã chức vụ", dataIndex: "code", align: "center" as const },
          {
            title: "Tên chức vụ",
            dataIndex: "title",
            align: "center" as const,
          },
          {
            title: "Phòng ban",
            dataIndex: "department_name",
            align: "center" as const,
          },
          {
            title: "Hệ số hiệu suất",
            dataIndex: "performance_coefficient",
            align: "center" as const,
          },
        ] as ColumnsType<DataType>)
      : []),
    ...(isTabs === "treatment-package"
      ? ([
          {
            title: "Gói liệu trình",
            dataIndex: "name",
            align: "center" as const,
          },
          { title: "Số buổi", dataIndex: "value", align: "center" as const },
          { title: "Ghi chú", dataIndex: "note", align: "center" as const },
        ] as ColumnsType<DataType>)
      : []),
    ...(isTabs === "technical-settings"
      ? ([
          {
            title: "Tên kỹ thuật",
            dataIndex: "name",
            align: "center" as const,
          },
          {
            title: "Loại trị liệu",
            dataIndex: "type",
            align: "center" as const,
          },
          {
            title: "Thời gian",
            dataIndex: "duration",
            align: "center" as const,
          },
          {
            title: "Giá hiệu suất",
            dataIndex: "price",
            align: "center" as const,
            render: (value?: number) => formatCurrency(value || 0),
          },
        ] as ColumnsType<DataType>)
      : []),
    ...(isTabs === "test-services"
      ? ([
          { title: "Mã dịch vụ", dataIndex: "code", align: "center" as const },
          { title: "Tên dịch vụ", dataIndex: "name", align: "center" as const },
          { title: "Mô tả", dataIndex: "note", align: "center" as const },
        ] as ColumnsType<DataType>)
      : []),
    {
      align: "center",
      render: (_: any, record: any) => (
        <div className="flex justify-center items-center space-x-4">
          <AddAndUpdateConfiguration
            key={`edit_${record.id}`}
            edit
            title={String(configTypeName)}
            configId={record.id}
            configData={record}
            isTabs={isTabs}
            useCreateMutation={useCreateMutation}
            useEditMutation={useEditMutation}
          />
          <DeleteConfirm
            key={`${isTabs}_${record.id}`}
            id={record.id}
            title={configTypeName}
            useDeleteMutation={useDeleteMutation}
          />
        </div>
      ),
    },
  ];

  const total = configData?.total ?? 0;
  const dataSource: DataType[] = configData?.results ?? [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <AddAndUpdateConfiguration
          isTabs={isTabs}
          title={configTypeName}
          useCreateMutation={useCreateMutation}
          useEditMutation={useEditMutation}
        />
      </div>

      {display === "table" ? (
        <Table<DataType>
          rowKey="id"
          dataSource={dataSource}
          columns={columns}
          bordered
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total, // ✅ đọc đúng từ API
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (t, range) => `${range[0]}-${range[1]} / ${t}`,
          }}
          onChange={(p) =>
            setPagination({
              current: p.current ?? 1,
              pageSize: p.pageSize ?? 10,
            })
          }
        />
      ) : (
        <List<DataType>
          className="w-full"
          rowKey="id"
          bordered
          loading={isLoading}
          itemLayout="horizontal"
          dataSource={dataSource}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total, // ✅ đọc đúng từ API
            onChange: (page, pageSize) =>
              setPagination({ current: page, pageSize }),
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (t, range) => `${range[0]}-${range[1]} / ${t}`,
          }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <AddAndUpdateConfiguration
                  key={`edit_${item.id}`}
                  edit
                  title={String(configTypeName)}
                  configId={item.id}
                  configData={item}
                  isTabs={isTabs}
                  useCreateMutation={useCreateMutation}
                  useEditMutation={useEditMutation}
                />,
                <DeleteConfirm
                  key={`del_${item.id}`}
                  id={item.id}
                  title={configTypeName}
                  useDeleteMutation={useDeleteMutation}
                />,
              ]}
            >
              <List.Item.Meta
                title={
                  (isTabs === "commission" && (
                    <>
                      {item.percentage} - {item.note}
                    </>
                  )) ||
                  (isTabs === "time" && (
                    <>
                      {item.start_date} - {item.end_date}
                    </>
                  )) ||
                  ((isTabs === "unit" || isTabs === "source") && (
                    <>
                      <Tag color={item.color}>{item.name}</Tag> - {item.note}
                    </>
                  )) ||
                  item.name
                }
              />
            </List.Item>
          )}
        />
      )}
    </>
  );
}
