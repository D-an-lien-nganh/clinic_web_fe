"use client";
import React from "react";
import { Modal, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useGetReferredCustomersQuery } from "@/api/app_customer/apiMarketing";

type RowType = {
  id: number;
  name: string;
  gender: string | null;
  mobile: string | null;
  created: string; // ISO
};

const genderMap: Record<string, string> = { MA: "Nam", FE: "Nữ", OT: "Khác" };

interface Props {
  open: boolean;
  onClose: () => void;
  customerId?: number;
  customerName?: string;
}

const ReferredCustomersModal: React.FC<Props> = ({ open, onClose, customerId, customerName }) => {
  const { data = [], isLoading } = useGetReferredCustomersQuery(customerId!, {
    skip: !open || !customerId,
  });

  const columns: ColumnsType<RowType> = [
    { title: "ID", dataIndex: "id", key: "id", width: 90, align: "center" },
    { title: "Họ và tên", dataIndex: "name", key: "name" },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      align: "center",
      render: (g) => genderMap[g as string] || "Không rõ",
      width: 120,
    },
    { title: "SĐT", dataIndex: "mobile", key: "mobile", align: "center", width: 150 },
    {
      title: "Ngày tạo",
      dataIndex: "created",
      key: "created",
      align: "center",
      width: 170,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      width={800}
      title={
        <div className="flex items-center gap-2">
          Danh sách khách được <b>{customerName ?? `KH #${customerId}`}</b> giới thiệu
          <Tag color="blue">{data?.length ?? 0} người</Tag>
        </div>
      }
      okText="Đóng"
      cancelButtonProps={{ style: { display: "none" } }}
    >
      <Table<RowType>
        columns={columns}
        dataSource={data as RowType[]}
        rowKey="id"
        bordered
        size="small"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />
    </Modal>
  );
};

export default ReferredCustomersModal;
