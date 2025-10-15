import { useGetCustomerSocialListQuery, useGetCustomerSourceListQuery, useGetCustomerStatusListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetSetupQuery } from '@/api/app_home/apiSetup';
import { locationData } from '@/constants/location';
import { Button, Checkbox, Col, DatePicker, Form, Input, InputNumber, Modal, Radio, Row, Select, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react'

const { Option } = Select;
const { Text } = Typography;

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

interface MedicineBill {
    key: React.Key;
    id: number;
    medicine_name: string;
    quantity: number;
    unit: string;
    dosage: string;
    amount: number;
}

interface TreatmentBill {
    key: React.Key;
    id: number;
    content: string;
    quantity: number;
    unit: string;
    amount: number;
}

export default function AddFacture({ open, onCancel, onFinish, selectedRecord }: { open: boolean, onCancel: () => void, onFinish: (values: any) => void, selectedRecord: any | null }) {
    const [form] = Form.useForm();
    const [districtList, setDistrictList] = useState<District[] | []>([]);
    const [wardList, setWardList] = useState([]);
    const [isMedicineChecked, setIsMedicineChecked] = useState(true);
    const [isTreatmentChecked, setIsTreatmentChecked] = useState(true);
    const [selectedMedicines, setSelectedMedicines] = useState<MedicineBill[]>([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

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

    const handleQuantityChange = (key: React.Key, increment: boolean) => {
        setSelectedMedicines((prev) =>
            prev.map((medicine) =>
                medicine.key === key
                    ? { ...medicine, quantity: increment ? medicine.quantity + 1 : Math.max(1, medicine.quantity - 1) }
                    : medicine
            )
        );
    };


    const medicineColumns: ColumnsType<MedicineBill> = [
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
            key: "amount",
            title: "Số tiền(VND)",
            dataIndex: "amount",
            align: "center"
        },
    ]
    const treatmentColumns: ColumnsType<TreatmentBill> = [
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
            key: "amount",
            title: "Số tiền(VND)",
            dataIndex: "amount",
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
                    Gửi trị liệu
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
                    <h3 className='text-[18px] font-bold mt-4'>Thanh toán hoá đơn</h3>
                    <Row gutter={[16, 16]} className='p-4'>
                        <Col span={24}>
                            <Checkbox
                                checked={isMedicineChecked}
                                onChange={(e) => setIsMedicineChecked(e.target.checked)}
                                className="mb-2"
                            >
                                Hóa đơn thuốc
                            </Checkbox>
                            {isMedicineChecked && (
                                <Row justify="center">
                                    <Col span={20}>
                                        <Table
                                            className='mt-4'
                                            bordered
                                            columns={medicineColumns}
                                            dataSource={medicineBillData}
                                            pagination={false}
                                            summary={() => (
                                                <>
                                                    <Table.Summary.Row className="border border-gray-300">
                                                        <Table.Summary.Cell index={0} colSpan={5} className="text-left font-bold">
                                                            Tổng tiền
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} className="font-bold text-center">
                                                            4,000,000
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>

                                                    {/* Chọn khuyến mãi */}
                                                    <Table.Summary.Row className="border border-gray-300">
                                                        <Table.Summary.Cell index={0} colSpan={5} className="text-left font-bold">
                                                            Chọn khuyến mãi
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} className='text-center'>
                                                            <Select placeholder="Chọn khuyến mãi" style={{ width: 200 }}>
                                                                <Option value="km1">Khuyến mãi 1</Option>
                                                                <Option value="km2">Khuyến mãi 2</Option>
                                                            </Select>
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>

                                                    {/* Thành tiền */}
                                                    <Table.Summary.Row className="border border-gray-300">
                                                        <Table.Summary.Cell index={0} colSpan={5} className="text-left font-bold">
                                                            Thành tiền
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} className="font-bold text-center">
                                                            4,000,000
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                </>
                                            )}
                                        />
                                    </Col>
                                </Row>
                            )}
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} className='p-4'>
                        <Col span={24}>
                            <Checkbox
                                checked={isTreatmentChecked}
                                onChange={(e) => setIsTreatmentChecked(e.target.checked)}
                                className="mt-4"
                            >
                                Hóa đơn điều trị
                            </Checkbox>
                            {isTreatmentChecked && (
                                <Row justify="center">
                                    <Col span={20}>
                                        <Table
                                            bordered
                                            className='mt-4'
                                            columns={treatmentColumns}
                                            dataSource={treatmentBillData}
                                            pagination={false}
                                            summary={() => (
                                                <>
                                                    <Table.Summary.Row className="border border-gray-300">
                                                        <Table.Summary.Cell index={0} colSpan={4} className="text-left font-bold">
                                                            Tổng tiền
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} className="font-bold text-center">
                                                            4,000,000
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>

                                                    {/* Chọn khuyến mãi */}
                                                    <Table.Summary.Row className="border border-gray-300">
                                                        <Table.Summary.Cell index={0} colSpan={4} className="text-left font-bold">
                                                            Chọn khuyến mãi
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} className='text-center'>
                                                            <Select placeholder="Chọn khuyến mãi" style={{ width: 200 }}>
                                                                <Option value="km1">Khuyến mãi 1</Option>
                                                                <Option value="km2">Khuyến mãi 2</Option>
                                                            </Select>
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>

                                                    {/* Thành tiền */}
                                                    <Table.Summary.Row className="border border-gray-300">
                                                        <Table.Summary.Cell index={0} colSpan={4} className="text-left font-bold">
                                                            Thành tiền
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} className="font-bold text-center">
                                                            4,000,000
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                </>
                                            )}
                                        />
                                    </Col>
                                </Row>
                            )}
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={12}>
                            <div className='text-center font-bold'>
                                Tổng hoá đơn
                            </div>
                            <div className='text-center font-bold'>
                                Đã thanh toán
                            </div>
                            <div className='text-center font-bold'>
                                Số tiền còn lại
                            </div>
                        </Col>
                        <Col span={12}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <div className="text-center font-bold">8,000,00</div>
                                <Input style={{ width: "100px", textAlign: "center" }} />
                                <div className="text-center font-bold">0</div>
                            </div>
                        </Col>
                    </Row>
                </Form>
            )}
        </Modal>
    )
}

const medicineBillData: MedicineBill[] = [
    { key: 1, id: 1, medicine_name: "Thuốc A", quantity: 2, unit: "vỉ", dosage: "2 viên/lần/ngày", amount: 400000 },
    { key: 2, id: 2, medicine_name: "Thuốc B", quantity: 2, unit: "vỉ", dosage: "2 viên/lần/ngày", amount: 400000 },
    { key: 3, id: 3, medicine_name: "Thuốc C", quantity: 2, unit: "hộp", dosage: "2 viên/lần/ngày", amount: 400000 },
    { key: 4, id: 4, medicine_name: "Thuốc D", quantity: 1, unit: "lọ", dosage: "2 viên/lần/ngày", amount: 400000 },
    { key: 5, id: 5, medicine_name: "Thuốc E", quantity: 10, unit: "túi", dosage: "2 viên/lần/ngày", amount: 400000 },
    { key: 6, id: 6, medicine_name: "Thuốc F", quantity: 1, unit: "vỉ", dosage: "Tẩm 1 lần/ngày", amount: 400000 },
    { key: 7, id: 7, medicine_name: "Thuốc G", quantity: 1, unit: "vỉ", dosage: "2 viên/lần/ngày", amount: 400000 },
    { key: 8, id: 8, medicine_name: "Thuốc H", quantity: 1, unit: "vỉ", dosage: "2 viên/lần/ngày", amount: 400000 },
    { key: 9, id: 9, medicine_name: "Thuốc I", quantity: 2, unit: "vỉ", dosage: "2 viên/lần/ngày", amount: 400000 },
];


const treatmentBillData: TreatmentBill[] = [
    { key: 1, id: 1, content: "Khám tổng quát", quantity: 2, unit: "lần", amount: 500000 },
    { key: 2, id: 2, content: "Siêu âm", quantity: 2, unit: "lần", amount: 300000 },
    { key: 3, id: 3, content: "Xét nghiệm máu", quantity: 2, unit: "lần", amount: 700000 },
    { key: 4, id: 4, content: "Chụp X-quang", quantity: 2, unit: "lần", amount: 600000 },
    { key: 5, id: 5, content: "Vật lý trị liệu", quantity: 2, unit: "buổi", amount: 800000 },
    { key: 6, id: 6, content: "Điều trị phục hồi", quantity: 2, unit: "buổi", amount: 1000000 },
    { key: 7, id: 7, content: "Tư vấn sức khỏe", quantity: 2, unit: "lần", amount: 200000 },
];
