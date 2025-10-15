"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useAllFunctionsQuery,
  useDeleteAccountMutation,
  useGetAllUserQuery,
} from "@/api/app_home/apiAccount";
import {
  Button,
  Col,
  Row,
  Table,
  notification,
  Space,
  Popconfirm,
  Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useWindowSize } from "@/utils/responsiveSm";
import ActionTable from "@/components/DropDown/ActionTable";
import UpdateEmployee from "./components/UpdateEmployee";
import AddEmployee from "./components/AddEmployee";

interface DataType {
  date_joined: string;
  email: string;
  first_name: string;
  full_name: string;
  groups: any;
  id: number;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_name: string;
  user_profile: any;
  username: string;
}

const UserAccount: React.FC = () => {
  const [width] = useWindowSize();

  const [deleteAccount, { isLoading: isLoadingDelete }] =
    useDeleteAccountMutation();

  const [searchTerms, setSearchTerms] = useState({
    username: "",
    fullname: "",
    email: "",
    phone: "",
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const { data: allFunction, refetch: refetchAllFunction } =
    useAllFunctionsQuery({});
  const {
    data: allUser,
    isLoading: isLoadingAllUser,
    refetch,
  } = useGetAllUserQuery();

  const onDelete = async (id: number) => {
    try {
      await deleteAccount(id).unwrap();
      refetchAllFunction();
      notification.success({
        message: "Thành công",
        description: "Xóa tài khoản thành công",
      });
      refetch();
    } catch {
      notification.error({
        message: "Thất bại",
        description: "Xóa tài khoản thất bại",
      });
    }
  };

  // ✅ Reset về trang 1 khi thay đổi điều kiện tìm kiếm
  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [
    searchTerms.username,
    searchTerms.fullname,
    searchTerms.email,
    searchTerms.phone,
  ]);

  // ✅ Dữ liệu sau lọc
  const filteredEmployeeData: DataType[] = useMemo(() => {
    const list: DataType[] = allUser || [];
    const u = searchTerms.username.trim().toLowerCase();
    const f = searchTerms.fullname.trim().toLowerCase();
    const e = searchTerms.email.trim().toLowerCase();
    const p = searchTerms.phone.trim();

    if (!u && !f && !e && !p) return list;

    return list.filter((emp) => {
      const byU = !u || emp?.username?.toLowerCase().includes(u);
      const byF = !f || emp?.full_name?.toLowerCase().includes(f);
      const byE = !e || emp?.email?.toLowerCase().includes(e);
      const byP =
        !p || (emp?.user_profile?.user_mobile_number || "").includes(p);
      return byU && byF && byE && byP;
    });
  }, [allUser, searchTerms]);

  // ✅ Cắt dữ liệu theo trang (client-side)
  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredEmployeeData.slice(start, end);
  }, [filteredEmployeeData, pagination.current, pagination.pageSize]);

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      width: 50,
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      align: "center",
    },
    { title: "Tài khoản", dataIndex: "username", align: "center" },
    { title: "Họ tên", dataIndex: "full_name", align: "center" },
    {
      title: "Số điện thoại",
      dataIndex: "user_mobile_number",
      render: (_: any, { user_profile }) => (
        <div>{user_profile?.user_mobile_number}</div>
      ),
      align: "center",
    },
    { title: "Email", dataIndex: "email", align: "center" },
    {
      width: width > 640 ? 125 : 35,
      fixed: "right",
      render: (_: any, record: DataType) => (
        <Space size="middle" direction="vertical" className="text-center">
          <div className="flex gap-2">
            <ActionTable
              items={[
                {
                  key: "1",
                  label: (
                    <UpdateEmployee
                      userId={record.id}
                      detailFunctionData={allFunction?.categories}
                      refetchSetupList={refetch}
                    />
                  ),
                },
                {
                  key: "2",
                  label: (
                    <Popconfirm
                      title="Xóa tài khoản"
                      description="Bạn thật sự muốn xóa tài khoản này?"
                      onConfirm={() => onDelete(record.id)}
                      okText="Xác nhận"
                      cancelText="Đóng"
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

  return (
    <div className="w-full px-2">
      <div className="flex justify-between mb-4 gap-4">
        <Input
          placeholder="Tìm theo tên người..."
          className="!w-[600px]"
          value={searchTerms.fullname}
          onChange={(e) =>
            setSearchTerms((prev) => ({ ...prev, fullname: e.target.value }))
          }
        />
        <AddEmployee
          detailFunctionData={allFunction?.categories}
          refetchSetupList={refetch}
        />
      </div>

      <div className="overflow-x-auto">
        <Table<DataType>
          columns={columns}
          rowKey={"id"}
          expandable={{
            expandedRowRender: (record) => (
              <Row gutter={16}>
                {record.user_profile?.detail_function?.map(
                  (
                    func: { id: number; title: React.ReactNode },
                    idx: React.Key
                  ) => (
                    <Col key={idx} xs={24} md={12} lg={8}>
                      <p style={{ margin: 0 }}>{func.title}</p>
                    </Col>
                  )
                )}
              </Row>
            ),
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredEmployeeData.length, // ✅ tổng sau lọc
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
          onChange={(p) =>
            setPagination({
              current: p.current ?? 1,
              pageSize: p.pageSize ?? 10,
            })
          }
          dataSource={paginatedData}
          loading={isLoadingAllUser}
          scroll={{ x: 1000 }}
          bordered
        />
      </div>
    </div>
  );
};

export default UserAccount;
