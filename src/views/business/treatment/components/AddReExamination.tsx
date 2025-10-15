import { useGetCustomerSocialListQuery, useGetCustomerSourceListQuery, useGetCustomerStatusListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetSetupQuery } from '@/api/app_home/apiSetup';
import { locationData } from '@/constants/location';
import { Button, Col, DatePicker, Form, Input, InputNumber, Modal, Radio, Row, Select, Space, Table } from 'antd'
import TextArea from 'antd/es/input/TextArea';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react'

const { Option } = Select;

type Ward = {
    Id?: string;
    Name?: string;
    Level: string;
};

type District = {
    Id: string;
    Name: string;
    Wards: Ward[];
};

interface DataType {
    key: React.Key;
    id: number;
    medicine_name: string;
    quantity: number;
    unit: number;
    dosage: string;
    note: string;
}

interface DesignatedService {
    key: React.Key;
    id: number;
    content: string;
    quantity: number;
    unit: string;
    number_of_sessions_performed: string;
}

export default function AddReExamination({ open, onCancel, onFinish, selectedRecord }: { open: boolean, onCancel: () => void, onFinish: (values: any) => void, selectedRecord: any | null }) {
    const [form] = Form.useForm();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [selectedMedicines, setSelectedMedicines] = useState<DataType[]>([]);
    const [selectedServices, setSelectedServices] = useState<DesignatedService[]>([]);
    const [shouldFetch, setShouldFetch] = useState(false);
    const [isSecondModalVisible, setIsSecondModalVisible] = useState(false);
    const [districtList, setDistrictList] = useState<District[] | []>([]);
    const [wardList, setWardList] = useState([]);

    const { data: customerSourceList } = useGetCustomerSourceListQuery();
    const { data: customerStatus } = useGetCustomerStatusListQuery();
    const { data: setUpList } = useGetSetupQuery();
    const { data: customerSocialList } = useGetCustomerSocialListQuery();

    const initialValues = selectedRecord ? {
        ...selectedRecord,
        date_of_birth: selectedRecord.date_of_birth ? dayjs(selectedRecord.date_of_birth) : null
    } : {};

    useEffect(() => {
        if (selectedRecord) {
            form.setFieldsValue({
                ...selectedRecord,
                date_of_birth: selectedRecord.date_of_birth ? dayjs(selectedRecord.date_of_birth) : null,
                source: selectedRecord.source?.id || selectedRecord.source,
                social_media: selectedRecord.social_media?.id || selectedRecord.social_media,
            });
        }
    }, [selectedRecord, form]);

    const handleMedicineChange = (selectedKeys: string[]) => {
        // Lọc danh sách thuốc dựa trên các key đã chọn
        const selected = data.filter((medicine) =>
            selectedKeys.includes(medicine.key as string)
        );
        setSelectedMedicines(selected);
    };

    const handleQuantityChange = (key: React.Key, increment: boolean) => {
        setSelectedMedicines((prev) =>
            prev.map((medicine) =>
                medicine.key === key
                    ? { ...medicine, quantity: increment ? medicine.quantity + 1 : Math.max(1, medicine.quantity - 1) }
                    : medicine
            )
        );
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
            key: "medicine_name",
            title: "Tên thuốc",
            dataIndex: "medicine_name",
            align: "center"
        },
        {
            key: "quantity",
            title: "Số lượng",
            dataIndex: "quantity",
            align: "center",
            render: (_, record) => (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handleQuantityChange(record.key, false)}
                        disabled={record.quantity <= 1}
                    >
                        -
                    </Button>
                    <InputNumber
                        value={record.quantity}
                        min={1}
                        onChange={(value) =>
                            setSelectedMedicines((prev) =>
                                prev.map((medicine) =>
                                    medicine.key === record.key ? { ...medicine, quantity: value || 1 } : medicine
                                )
                            )
                        }
                        style={{ width: "60px", textAlign: "center" }}
                    />
                    <Button type="primary" size="small" onClick={() => handleQuantityChange(record.key, true)}>
                        +
                    </Button>
                </div>
            ),
        },
        {
            key: "unit",
            title: "Đơn vị",
            dataIndex: "unit",
            align: "center"
        },
        {
            key: "dosage",
            title: "Liều lượng",
            dataIndex: "dosage",
            align: "center"
        },
        {
            key: "note",
            title: "Lưu ý",
            dataIndex: "note",
            align: "center"
        },
    ]

    const handleServiceChange = (selectedKeys: string[]) => {
        const selected = serviceData.filter((service) =>
            selectedKeys.includes(service.key as string)
        );
        setSelectedServices(selected);
    };

    const column: ColumnsType<DesignatedService> = [
        {
            title: "STT",
            key: "index",
            width: 45,
            align: "center",
            render: (text, record, index) => (pagination.current - 1) * 10 + index + 1,
        },
        {
            key: "content",
            title: "Nội dung",
            dataIndex: "content",
            align: "center"
        },
        {
            key: "quantity",
            title: "Số lượng",
            dataIndex: "quantity",
            align: "center",
            render: (_, record) => (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handleQuantityChange(record.key, false)}
                        disabled={record.quantity <= 1}
                    >
                        -
                    </Button>
                    <InputNumber
                        value={record.quantity}
                        min={1}
                        onChange={(value) =>
                            setSelectedMedicines((prev) =>
                                prev.map((medicine) =>
                                    medicine.key === record.key ? { ...medicine, quantity: value || 1 } : medicine
                                )
                            )
                        }
                        style={{ width: "60px", textAlign: "center" }}
                    />
                    <Button type="primary" size="small" onClick={() => handleQuantityChange(record.key, true)}>
                        +
                    </Button>
                </div>
            ),
        },
        {
            key: "unit",
            title: "Đơn vị",
            dataIndex: "unit",
            align: "center"
        },
        {
            key: "number_of_sessions_performed",
            title: "Số buổi đã thực hiện",
            dataIndex: "number_of_sessions_performed",
            align: "center"
        },
    ]

    return (
        <Modal
            onCancel={onCancel}
            open={open}
            title="Yêu cầu trải nghiệm"
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button key="submit" type="primary">
                    Gửi chuyên gia
                </Button>,
            ]}
            width={1289}
            destroyOnClose
        >
            {selectedRecord && (
                <Form layout='vertical' initialValues={initialValues}>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item label="Họ tên khách hàng" name="full_name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label="Nguồn khách hàng" name="source" rules={[{ required: true }]}>
                                        <Select placeholder="Chọn nguồn khách hàng">
                                            {customerSourceList?.results?.map((source: any) => (
                                                <Option key={source.id} value={source.id}>
                                                    {source.title}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Trạng thái"
                                        name="status"
                                        rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                    >
                                        <Select placeholder="Chọn trạng thái">
                                            {customerStatus?.results?.map((status: any) => (
                                                <Option key={status.id} value={status.id}>
                                                    {status.title}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Giới tính"
                                name="gender"
                            >
                                <Radio.Group>
                                    <Radio value="Nam">Nam</Radio>
                                    <Radio value="Nữ">Nữ</Radio>
                                    <Radio value="Khác">Khác</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item
                                label="Người tiếp thị"
                                name="sales_person"
                            >
                                <Select placeholder="Chọn người tiếp thị">
                                    {setUpList?.employee_list?.map((employee: { id: number, username: string }) => (
                                        <Option key={employee.id} value={employee.id}>
                                            {employee.username}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Ngày sinh"
                                name="date_of_birth"
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                            <Form.Item label="Lễ tân">
                                <Input />
                            </Form.Item>
                            <Form.Item label="Y tá tiếp nhận">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <hr />
                    <h3 className='text-[18px] font-bold mt-4'>Thông tin liên hệ</h3>
                    <Row gutter={24}>
                        <Col span={8} key="phone-number">
                            <Form.Item
                                label="Số điện thoại"
                                name="phone_number"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                            >
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>
                        </Col>

                        <Col span={8} key="email">
                            <Form.Item
                                label="Email"
                                name="email"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Input placeholder="Nhập email" />
                            </Form.Item>
                            <div>Địa chỉ liên hệ</div>
                            <Row gutter={24}>
                                <Col span={24} key="city">
                                    <Form.Item name="city" className="mb-2">
                                        <Select

                                            placeholder={"Chọn Tỉnh / Thành phố"}
                                            onChange={(value) =>
                                                setDistrictList(locationData?.filter((item: { Name: string }) => item.Name === value)[0]?.Districts)
                                            }
                                        >
                                            {locationData?.map((item: { Id: string; Name: string }) => (
                                                <Option key={item.Id} value={item.Name}>
                                                    {item.Name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={24} key="district">
                                    <Form.Item name="district" className="mb-2">
                                        <Select

                                            placeholder={"Chọn Quận / Huyện"}
                                            onChange={(value) =>
                                                setWardList((districtList?.filter((item: any) => item.Name === value)[0] as any)?.Wards)
                                            }
                                        >
                                            {districtList?.map((item: { Id: string; Name: string }) => (
                                                <Option key={item.Id} value={item.Name}>
                                                    {item.Name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={24} key="ward">
                                    <Form.Item name="ward" className="mb-2">
                                        <Select placeholder={"Chọn Phường / Xã"} allowClear>
                                            {wardList?.map((item: { Id: string; Name: string }) => (
                                                <Option key={item.Id} value={item.Name}>
                                                    {item.Name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={24} key="address">
                                    <Form.Item name="address" className="mb-2">
                                        <Input placeholder="Nhập địa chỉ" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={8} key="social-media">
                            <Row gutter={24}>
                                <Col span={10} key="social-media-select">
                                    <Form.Item
                                        label="Mạng xã hội"
                                        name="social_media"
                                        rules={[{ required: true, message: "Vui lòng chọn mạng xã hội!" }]}
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                    >
                                        <Select placeholder="Chọn mạng xã hội" >
                                            {customerSocialList?.results?.map((social: { id: number, title: string }) => (
                                                <Option key={social.id} value={social.id}>
                                                    {social.title}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={14} key="social-media-input">
                                    <Form.Item
                                        label
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={24} key="appointment-time">
                                    <Form.Item
                                        label="Ngày tới khám"
                                        name="appointment_time"
                                        rules={[{ required: true, message: "Vui lòng chọn ngày tới khám!" }]}
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                    >
                                        <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày tới khám" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <hr />
                    <h3 className='text-[18px] font-bold mt-4'>Thông tin sức khoẻ</h3>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item label="Các xét nghiệm đã có(gần nhất)">
                                <TextArea />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="" label="Huyết áp">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="" label="Chiều cao">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="" label="Nhịp tim">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="" label="Cân nặng">
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="" label="Nhịp thở">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <hr />
                    <h3 className='text-[18px] font-bold mt-4'>Khám lâm sàng</h3>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item label="Bác sĩ khám">
                                <Select placeholder="Chọn bác sĩ">
                                    <Option key="1">Thống trị</Option>
                                    <Option key="2">Bắc Long</Option>
                                    <Option key="3">Cần giờ</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="Chuẩn đoán">
                                <TextArea />
                            </Form.Item>
                            <Form.Item label="Kê đơn thuốc">
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn sản phẩm"
                                    allowClear
                                    optionFilterProp="children"
                                    onChange={handleMedicineChange} // Gọi hàm khi thay đổi lựa chọn
                                >
                                    {data.map((medicine) => (
                                        <Option key={medicine.key} value={medicine.key}>
                                            {medicine.medicine_name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label="Tiền sử bệnh">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Triệu chứng bệnh hiện tại">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Table bordered dataSource={selectedMedicines} columns={columns} />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <br />
                    <hr />
                    <h3 className='text-[18px] font-bold mt-4'>Dịch vụ trị liệu</h3>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item label="Chuyên gia chỉ định">
                                <Select placeholder="Chọn bác sĩ">
                                    <Option key="1">Trần Lê Bảo Châu</Option>
                                    <Option key="2">Bắc Long</Option>
                                    <Option key="3">Cần giờ</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="Phương pháp trị liệu">
                                <Input />
                            </Form.Item>
                            <Form.Item label="Dịch vụ chỉ định">
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn dịch vụ"
                                    allowClear
                                    onChange={handleServiceChange}
                                >
                                    {serviceData.map((service) => (
                                        <Option key={service.key} value={service.key}>
                                            {service.content}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Table
                                bordered
                                dataSource={selectedServices}
                                columns={column}
                                pagination={false}
                                summary={() => (
                                    <>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={4} className="text-left font-bold">
                                                Chọn ngày điều trị tiếp theo
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} className="font-bold text-center">
                                                <DatePicker
                                                    showTime
                                                    placeholder="Chọn ngày"
                                                    className="border-b border-gray-300 focus:outline-none w-48"
                                                />
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                        <Table.Summary.Row className="border border-gray-300">
                                            <Table.Summary.Cell index={0} colSpan={4} className="text-left font-bold">
                                                Chọn ngày tái khám
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} className='text-center'>
                                                <DatePicker
                                                    showTime
                                                    placeholder="Chọn ngày"
                                                    className="border-b border-gray-300 focus:outline-none w-48"
                                                />
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>
                                )}
                            />
                        </Col>
                    </Row>
                    <h3 className='text-[18px] font-bold mt-4'>Kết quả tái khám</h3>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item label="Đánh giá của bác sĩ">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Lời khuyên">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Ngày tới khám">
                                <DatePicker showTime style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            )}
        </Modal>
    )
}
const data: DataType[] = [
    {
        key: "1",
        id: 1,
        medicine_name: "Thống trị",
        quantity: 20,
        unit: 500,
        dosage: "2 tablets per day after meals",
        note: "Use for fever and mild pain relief",
    },
    {
        key: "2",
        id: 2,
        medicine_name: "Bắc Long",
        quantity: 10,
        unit: 250,
        dosage: "1 capsule every 8 hours for 7 days",
        note: "Take with plenty of water; avoid alcohol",
    },
    {
        key: "3",
        id: 3,
        medicine_name: "Cần giờ",
        quantity: 15,
        unit: 400,
        dosage: "1 tablet every 6 hours as needed",
        note: "Use for inflammation or pain; avoid overuse",
    },
];
const serviceData: DesignatedService[] = [
    {
        key: "1",
        id: 1,
        content: "Dịch vụ 1",
        quantity: 1,
        unit: "buổi",
        number_of_sessions_performed: "2",
    },
    {
        key: "2",
        id: 2,
        content: "Dịch vụ 2",
        quantity: 1,
        unit: "buổi",
        number_of_sessions_performed: "1",
    },
    {
        key: "3",
        id: 3,
        content: "Dịch vụ 3",
        quantity: 1,
        unit: "buổi",
        number_of_sessions_performed: "3",
    },
];
