import React, { useState } from 'react';
import { Table } from 'antd';
import AddWaitingForNurse from './AddWaitingForNurse';

const employeeMap: Record<string, string> = {
    "1": "Nguyễn Văn A",
    "2": "Trần Thị B",
    "3": "Phạm Minh C",
  };
  
const data = [
    {
        customer_code: '001',
        full_name: 'Nguyễn Văn A',
        phone_number: '0901234567',
        source: { title: 'Facebook' },
        sales_person: '1',
        referrer: 'Trần Văn D',
        receiving_nurse: 'Lê Thị E',
        single_type: 'Khám bệnh',
    },
    {
        customer_code: '002',
        full_name: 'Trần Thị B',
        phone_number: '0912345678',
        source: { title: 'Zalo' },
        sales_person: '2',
        referrer: 'Nguyễn Văn F',
        receiving_nurse: 'Phạm Thị G',
        single_type: 'Tư vấn',
    },
];

const WaitingForNurseTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái modal
    const [selectedPatient, setSelectedPatient] = useState(null); // Lưu trữ bệnh nhân được chọn

    const columns = [
        {
            title: 'STT',
            dataIndex: 'index',
            key: 'index',
            render: (_: any, __: any, index: any) => index + 1,
        },
        {
            title: 'Mã đơn',
            dataIndex: 'customer_code',
            key: 'customer_code',
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string, record: any) => (
                <a
                    onClick={() => {
                        setSelectedPatient(record); // Lưu trữ bệnh nhân được chọn
                        setIsModalOpen(true); // Mở modal
                    }}
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                >
                    {text}
                </a>
            ),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone_number',
            key: 'phone_number',
        },
        {
            title: 'Nguồn',
            dataIndex: 'source',
            key: 'source',
            render: (source: { title: string }) => source?.title || 'Không xác định',
        },
        {
            title: 'Người tiếp thị',
            dataIndex: 'sales_person',
            key: 'sales_person',
            render: (id: string) => employeeMap[id] || 'Không xác định',
        },
        {
            title: 'Người giới thiệu',
            dataIndex: 'referrer',
            key: 'referrer',
        },
        {
            title: 'Y tá tiếp nhận',
            dataIndex: 'receiving_nurse',
            key: 'receiving_nurse',
        },
        {
            title: 'Loại đơn',
            dataIndex: 'single_type',
            key: 'single_type',
        },
    ];

    return (
        <>
            <Table columns={columns} dataSource={data} rowKey="customer_code" bordered />

            {/* Modal hiển thị thông tin bệnh nhân */}
            <AddWaitingForNurse
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setSelectedPatient(null); // Xóa dữ liệu khi đóng modal
                }}
            />
        </>
    );
};

export default WaitingForNurseTable;
