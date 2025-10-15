import React, { useState } from "react";
import { Button, Modal, Descriptions, Table, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { convertYMDToDMY } from "@/utils/convert";

const { Title } = Typography;

interface DetailHrEmployeeProps {
    employeeData: any;
    refresh: any;
}

const DetailHrEmployee = ({ employeeData, refresh }: DetailHrEmployeeProps) => {
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

    return (
        <>
            {/* Biểu tượng để mở modal */}
            <UserOutlined onClick={showModal} />

            {/* Modal hiển thị chi tiết */}
            <Modal
                title={<Title level={4}>Chi tiết nhân viên</Title>}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                width={800} // Tăng chiều rộng để hiển thị bảng
                footer={[
                    <Button key="refresh" onClick={refresh}>
                        Làm mới
                    </Button>,
                    <Button key="ok" type="primary" onClick={handleOk}>
                        Đóng
                    </Button>,
                ]}
            >
                {/* Thông tin cá nhân */}
                <Descriptions title="Thông tin cá nhân" bordered column={1} size="small">
                    <Descriptions.Item label="Mã NV">{employeeData.code}</Descriptions.Item>
                    <Descriptions.Item label="Họ và tên">{employeeData.full_name?.full_name || "Không có"}</Descriptions.Item>
                    <Descriptions.Item label="SĐT">{employeeData.mobile}</Descriptions.Item>
                    <Descriptions.Item label="Email">{employeeData.email}</Descriptions.Item>
                    <Descriptions.Item label="Vị trí">{employeeData.position?.title || "Chưa xác định"}</Descriptions.Item>
                    <Descriptions.Item label="Phòng ban">{employeeData.position?.department_name || "Chưa xác định"}</Descriptions.Item>
                    <Descriptions.Item label="Trình độ">{employeeData.level}</Descriptions.Item>
                </Descriptions>

                {/* Thông tin hợp đồng */}
                <Descriptions title="Thông tin hợp đồng" bordered column={1} size="small" style={{ marginTop: "20px" }}>
                    <Descriptions.Item label="Loại hợp đồng">
                        {employeeData.contract_type === "OF" ? "Chính thức" : employeeData.contract_type === "IN" ? "Thực tập" : "Không xác định"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {employeeData.contract_status === "AC" ? "Còn hiệu lực" : employeeData.contract_status === "EX" ? "Hết hiệu lực" : "Không xác định"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày bắt đầu làm việc">{convertYMDToDMY(employeeData.start_date)}</Descriptions.Item>
                    <Descriptions.Item label="Thời hạn hợp đồng">{`Từ ${convertYMDToDMY(employeeData.contract_start)} đến ${convertYMDToDMY(employeeData.contract_end)}`}</Descriptions.Item>
                </Descriptions>
            </Modal>
        </>
    );
};

export default DetailHrEmployee;