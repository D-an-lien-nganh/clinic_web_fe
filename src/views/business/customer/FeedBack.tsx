"use client"
import { useGetFeedBackListQuery, useGetMarketingListQuery } from '@/api/app_customer/apiMarketing';
import { ColumnsType } from 'antd/es/table';
import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import AddFeedBack from './components/AddFeedBack';
import dayjs from 'dayjs';

interface DataType {
    key: React.Key;
    id: number;
    code: string;
    name: string;
    gender: string;
    source: string;
    mobile: string;
    email: string;
    user: string;
    notes: string;
    created: Date;
    service_names: string[];
}

export default function FeedBack() {
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const { data: feedBackList, isLoading, refetch } = useGetFeedBackListQuery();

    const handleTableChange = (newPagination: any) => {
        setPagination(newPagination);
        refetch();
    };

    const columns: ColumnsType<DataType> = [
        {
            title: "STT",
            key: "index",
            width: 45,
            align: "center",
            render: (text, record, index) => (pagination.current - 1) * 10 + index + 1,
        },
        {
            key: 'code',
            title: 'Mã KH',
            dataIndex: 'code',
            align: 'center',
        },
        {
            key: "name",
            title: "Họ và tên",
            dataIndex: "name",
            align: "center"
        },
        {
            key: "mobile",
            title: "Số điện thoại",
            dataIndex: "mobile",
            align: "center"
        },
        {
            key: "email",
            title: "Email",
            dataIndex: "email",
            align: "center"
        },
        {
            key: "source_name",
            title: "Nguồn",
            dataIndex: "source_name",
            align: "center"
        },
        {
            key: "service_names",
            title: "Dịch vụ",
            align: "center",
            render: (text: any, record: DataType) => {
                return record.service_names?.join(", ") || "Không có dịch vụ";
            },
        },
        {
            key: "format",
            title: "Hình thức phản hồi",
            align: "center",
            dataIndex: "format",
            render: (text: string) =>
                text === "direct"
                    ? "Trực tiếp"
                    : text === "indirect"
                        ? "Gián tiếp"
                        : "Không xác định",
        },
        {
            title: "Ngày tạo",
            key: "created",
            sorter: (a, b) => dayjs(a.created).unix() - dayjs(b.created).unix(),
            render: (_, { created }) => (
                <div>
                    {dayjs(created).format("DD/MM/YYYY")}
                </div>
            ),
            align: "center",
        },
        {
            key: "",
            title: "Chi tiết phản hồi",
            align: "center",
            render: (_, { id }) => (
                <div className="flex justify-center items-center space-x-4">
                    <AddFeedBack id={id} title="Chi tiết phản hồi" edit={true} />
                </div>
            ),
        },
    ];

    const dataSource = feedBackList?.results?.map((record: { id: any }) => ({
        ...record,
        key: record.id
    })) || [];

    return (
        <div className="min-h-[calc(100vh-70px)] p-6">
            <div className="mb-4">
                <AddFeedBack title="Tạo phản hồi" />
            </div>
            <div className="overflow-x-auto">
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    onChange={handleTableChange}
                    loading={isLoading}
                    pagination={{
                        ...pagination,
                        total: feedBackList?.count || 0,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50", "100", "200"],
                    }}
                    bordered
                    scroll={{ x: 1300 }}
                />
            </div>
        </div>
    );
}
