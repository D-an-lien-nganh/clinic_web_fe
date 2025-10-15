
import React, { useState } from 'react';
import {Button, Modal, Tabs, TabsProps} from 'antd';
import AddReportfile from "@/views/business/treatment/components/DetailReportfile";
import Addregimen from "@/views/business/treatment/components/AddRegimen";

const ReportFile= ({code,id}:{code:string,id:number}) => {
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


    // TAB
    const onChange = (key: string) => {
        console.log(key);
    };

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Hồ sơ',
            children: <AddReportfile onComplete={() => setIsModalOpen(false)} id={id} code={code} />,
        },
        {
            key: '2',
            label: 'Phác đồ',
            children: <Addregimen id={id} onComplete={() => setIsModalOpen(false)} />,
        },

    ];


    return (
        <>
            <p className={'underline'} onClick={showModal}>
                {code}
            </p>
            <Modal
                width={1300}
                title="Báo cáo chi tiết"
                open={isModalOpen}
                onCancel={handleCancel} // Đóng modal khi bấm dấu X hoặc bấm ra ngoài
                footer={null}
                maskClosable={true} // Bấm ra ngoài cũng đóng modal
                closable={true} // Hiển thị dấu X
            >
                <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
            </Modal>
        </>
    );
};

export default ReportFile;

