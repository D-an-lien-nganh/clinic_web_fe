"use client"
import { useGetEmployeeQuery } from '@/api/app_hr/apiHR';
import { Modal, Button, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useState, useEffect } from 'react';

interface DetailTherapyProps {
    type: any;
    recordId?: any;
}

interface Therapy {
    key: React.Key;
    id: number;
    created_at: string;
    customer_name: string;
    service_name: string;
    participation_count: number;
    total_price: number;
}

interface DetailTechnique {
    key: React.Key;
    id: number;
    technique_name: string;
    technique_price: number;
    usage_count: number;
}

export default function DetailTherapy({ type, recordId }: DetailTherapyProps) {
    const { data } = useGetEmployeeQuery(recordId, { skip: !recordId });
    const [therapyData, setTherapyData] = useState<Therapy[]>([]);


    useEffect(() => {
        if (data) {
            const services = data.expert_services[type];
            const formattedData = services?.map((service: any) => ({
                key: service.session_id,
                id: service.session_id,
                created_at: service.created_at,
                customer_name: service.customer_name,
                service_name: service.service_name,
                participation_count: service.participation_count ?? 0,
                total_price: service.total_price ?? 0,
            }));
            setTherapyData(formattedData || []);
        }
    }, [data, type]);

    const formatNumber = (value: number) =>
        Number.isInteger(value)
            ? new Intl.NumberFormat("vi-VN").format(value)
            : new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    const columns: ColumnsType<Therapy> = [
        {
            title: 'Ngày',
            key: 'created_at',
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            render: (_, { created_at }) => <div>{dayjs(created_at).format('DD/MM/YYYY')}</div>,
            align: 'center',
        },
        {
            title: 'Bệnh nhân',
            key: 'customer_name',
            dataIndex: 'customer_name',
            align: 'center',
        },
        {
            title: 'Loại dịch vụ',
            key: 'service_name',
            dataIndex: 'service_name',
            align: 'center',
        },
        {
            title: 'Lượt làm',
            key: 'participation_count',
            dataIndex: 'participation_count',
            align: 'center',
            render: (value) => formatNumber(value),
        },
        {
            title: 'Kỹ thuật thực hiện',
            key: 'total_price',
            dataIndex: 'total_price',
            align: 'center',
            render: (value) => formatNumber(value) + " VND",
        }
    ];

    const columnDetail: ColumnsType<DetailTechnique> = [
        {
            title: 'STT',
            key: 'index',
            width: 45,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Kỹ thuật',
            key: 'technique_name',
            dataIndex: 'technique_name',
            align: 'center',
        },
        {
            title: 'Giá tiền',
            key: 'technique_price',
            dataIndex: 'technique_price',
            align: 'center',
            render: (value) => formatNumber(value) + " VND",
        },
        {
            title: 'Lượt làm',
            key: 'usage_count',
            dataIndex: 'usage_count',
            align: 'center',
            render: (value) => formatNumber(value),
        }
    ];

    const expandedRowRender = (record: Therapy) => {
        const techniques = data?.expert_services[type]?.find(
            (service: any) => service.session_id === record.id
        )?.techniques || [];

        const formattedDetailData = techniques.map((technique: any) => ({
            key: technique.technique_name,
            technique_name: technique.technique_name,
            technique_price: technique.technique_price ?? 0,
            usage_count: technique.usage_count ?? 0,
        }));

        const totalPrice = formattedDetailData.reduce((total: any, technique: any) => total + technique.technique_price, 0);
        const totalUsage = formattedDetailData.reduce((total: any, technique: any) => total + technique.usage_count, 0);

        return (
            <Table
                columns={columnDetail}
                bordered
                dataSource={formattedDetailData}
                pagination={false}
                rowKey="technique_name"
                footer={() => (
                    <div className="h-10 flex justify-between items-center">
                        <div>Tổng: </div>
                        <div className="flex-1 flex justify-end ml-60">
                            <div>{formatNumber(totalPrice) + " VND"}</div>
                        </div>
                        <div className="flex-1 flex justify-end mr-18">
                            <div>{formatNumber(totalUsage)}</div>
                        </div>
                    </div>
                )}
            />
        );
    };

    return (
        <>
            <Table
                bordered
                expandable={{ expandedRowRender }}
                columns={columns}
                dataSource={therapyData}
                rowKey="id"
                footer={() => {
                    let totalParticipation = 0;
                    let totalPrice = 0;
                    therapyData.forEach(({ participation_count, total_price }) => {
                        totalParticipation += participation_count;
                        totalPrice += total_price;
                    });

                    return (
                        <div className='h-10 flex justify-between items-center'>
                            <div className="flex">
                                <div>Tổng:</div>
                            </div>
                            <div className="flex-1 flex justify-end ml-72">
                                <div>{formatNumber(totalParticipation)}</div>
                            </div>
                            <div className="flex-1 flex justify-end mr-7">
                                <div>{formatNumber(totalPrice) + " VND"}</div>
                            </div>
                        </div>
                    );
                }}
            />
        </>
    );
}
