import React, { useState } from 'react';
import { Button, Modal, Table, TableProps } from 'antd';

interface DataType {
    key: string;
    introducer: number;
    commission: number;
    introducer_name: string;
}

const columns: TableProps<DataType>['columns'] = [
    {
        title: "STT",
        key: "index",
        align: "center",
        render: (_, __, index) => index + 1,
    },
    {
        title: 'Mã',
        dataIndex: 'introducer',
        align: "center",
        key: 'introducer',
        render: (text) => <a>{text}</a>,
    },
    {
        title: 'Hoa hồng',
        dataIndex: 'commission',
        align: "center",
        key: 'commission',
    },
    {
        title: 'Tên người giới thiệu',
        dataIndex: 'introducer_name',
        align: "center",
        key: 'introducer_name',
    },
];

const DetailIntroducer = ({ data }: { data: any[] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // Chuyển đổi dữ liệu API thành DataType[]
    const formattedData: DataType[] = data.map((item, index) => ({
        key: index.toString(),
        introducer: item.introducer,
        commission: item.commission,
        introducer_name: item.introducer_name,
    }));

    return (
        <>
            <Button type="dashed" onClick={showModal}>
                Xem chi tiết
            </Button>
            <Modal title="Thông tin người giới thiệu" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <Table<DataType> columns={columns} dataSource={formattedData} pagination={false} />
            </Modal>
        </>
    );
};

export default DetailIntroducer;
