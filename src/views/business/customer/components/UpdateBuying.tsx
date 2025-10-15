"use client"
import React, { useEffect, useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Modal, notification, Radio, Row, Select, Table } from 'antd';
import { useGetCustomerSocialListQuery, useGetCustomerSourceListQuery, useGetCustomerStatusListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetSetupQuery } from '@/api/app_home/apiSetup';
import dayjs from 'dayjs'; // Import dayjs
import { locationData } from '@/constants/location';
import { useCreateCustomerCareMutation, useDeleteCustomerCareMutation, useGetCustomerCareListQuery } from '@/api/app_customer/apiMarketing';
import { useGetAllUserQuery } from '@/api/app_home/apiAccount';
import { useGetCommissionListQuery, useGetTimeFrameListQuery } from '@/api/app_home/apiConfiguration';
import { RiDeleteBin5Line } from 'react-icons/ri';
import { ColumnsType } from 'antd/es/table';
import { useGetServiceListQuery } from '@/api/app_product/apiService';
import TextArea from 'antd/es/input/TextArea';

const { Option } = Select;

interface CustomerModalProps {
    open: boolean;
    onCancel: () => void;
    onFinish: (values: any) => void;
    selectedRecord: any | null;
}

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

type IntroducerType = {
    id: number;
    introducer: number | null;
    commission: number | null;
    commission_note?: string;
    introducer_name?: string;
};

interface CustomerProblem {
    key: React.Key;
    id: number;
    problem: string;
    encounter_pain: string;
    desire: string;
}

const UpdateBuying: React.FC<CustomerModalProps> = ({ open, onCancel, selectedRecord }) => {
    const [form] = Form.useForm();
    const [districtList, setDistrictList] = useState<District[] | []>([]);
    const [wardList, setWardList] = useState([]);

    const { data: customerSourceList } = useGetCustomerSourceListQuery();
    const { data: customerCareList, refetch } = useGetCustomerCareListQuery();
    const { data: serviceList } = useGetServiceListQuery({});
    const [createCustomerCare] = useCreateCustomerCareMutation();
    const [deleteCustomerCare] = useDeleteCustomerCareMutation();
    const { data: commissionList } = useGetCommissionListQuery();
    const { data: timeFrameList } = useGetTimeFrameListQuery();
    const [newCareList, setNewCareList] = useState<any[]>([]);
    const { data: allUser } = useGetAllUserQuery();
    const [rows, setRows] = useState<IntroducerType[]>([]);
    const [tableData, setTableData] = useState([
        {
            key: Date.now(),
            id: 1,
            problem: '',
            encounter_pain: '',
            desire: '',
        },
    ]);


    useEffect(() => {
        if (selectedRecord) {
            form.setFieldsValue({
                ...selectedRecord,
                birth: selectedRecord.birth ? dayjs(selectedRecord.birth) : null,
                contact_date: selectedRecord.contact_date ? dayjs(selectedRecord.contact_date) : null,
                source: selectedRecord.source?.id || selectedRecord.source,
                social_media: selectedRecord.social_media?.id || selectedRecord.social_media,
            });
            if (Array.isArray(selectedRecord.introducers)) {
                setRows(selectedRecord.introducers.map((intro: any) => ({
                    id: intro.id || Date.now(),
                    introducer: intro.introducer_name,
                    commission: intro.commission_note,
                })));
            }
        }
    }, [selectedRecord, form]);

    const customerId = selectedRecord?.id;
    const filteredCustomerCareList = customerCareList?.results?.filter(
        (care: any) => care.customer === customerId
    );

    const onFinish = async () => {
        try {
            const values = await form.validateFields();

            for (const care of newCareList) {
                const payload = {
                    customer: customerId,
                    date: care.date ? dayjs(care.date).format('YYYY-MM-DD') : null,
                    note: care.note,
                    type: care.type,
                };
                await createCustomerCare(payload).unwrap();
            }
        } catch (error) {
            notification.error({
                message: 'Đã xảy ra lỗi khi xử lý dữ liệu!',
                className: "h-16",
                placement: "bottomRight",
            });
        }
    };

    const handleCancel = () => {
        form.resetFields();
    }

    const handleAddRow = () => {
        setNewCareList([
            ...newCareList,
            { id: Date.now(), date: null, note: '', type: '', isNew: true }
        ]);
    };

    const handleChange = (id: any, field: any, value: any) => {
        setRows(
            rows.map((row) =>
                row.id === id
                    ? {
                        ...row,
                        [field]: value,
                        ...(field === 'commission' ? {
                            commission_note: commissionList?.results?.find((comm: any) => comm.id === value)?.note
                        } : {})
                    }
                    : row
            )
        );
    };

    const handleCancelRow = (rowId: number) => {
        setNewCareList(newCareList.filter(item => item.id !== rowId));
    };

    const handleDeleteRow = async (careId: number) => {
        try {
            await deleteCustomerCare({ customerCareId: careId }).unwrap();
            notification.success({
                message: 'Đã xóa thông tin chăm sóc khách hàng!',
                className: "h-16",
                placement: "bottomRight",
            });
            refetch();
        } catch (error) {
            notification.error({
                message: 'Có lỗi khi xóa thông tin chăm sóc!',
                className: "h-16",
                placement: "bottomRight",
            });
        }
    };


    const generateColumns = (): ColumnsType<CustomerProblem> => [
        {
            title: "STT",
            dataIndex: "id",
            align: "center",
            render: (_, __, index) => <div>{index + 1}</div>,
        },
        {
            title: "Vấn đề",
            dataIndex: "problem",
            align: "center",
            render: (_, record) => (
                <Input
                    placeholder='Nhập vấn đề'
                    value={record.problem}
                    onChange={(e) =>
                        setTableData((prev) =>
                            prev.map((item) =>
                                item.key === record.key
                                    ? { ...item, problem: e.target.value }
                                    : item
                            )
                        )
                    }
                />
            ),
        },
        {
            title: "Nỗi đau",
            dataIndex: "encounter_pain",
            align: "center",
            render: (_, record) => (
                <Input
                    placeholder='Nhập nỗi đau'
                    value={record.encounter_pain}
                    onChange={(e) =>
                        setTableData((prev) =>
                            prev.map((item) =>
                                item.key === record.key ? { ...item, encounter_pain: e.target.value } : item
                            )
                        )
                    }
                />
            ),
        },
        {
            title: "Mong muốn",
            dataIndex: "desire",
            align: "center",
            render: (_, record) => (
                <Input
                    placeholder='Nhập mong muốn'
                    value={record.desire}
                    onChange={(e) =>
                        setTableData((prev) =>
                            prev.map((item) =>
                                item.key === record.key
                                    ? { ...item, desire: e.target.value }
                                    : item
                            )
                        )
                    }
                />
            ),
        },
        {
            title: "Hành động",
            align: "center",
            render: (_, record) => (
                <Button
                    type="link"
                    style={{ fontSize: '20px' }}
                    danger
                    onClick={() =>
                        setTableData((prev) => prev.filter((item) => item.key !== record.key))
                    }
                >
                    <RiDeleteBin5Line style={{ fontSize: '20px' }} />
                </Button>
            ),
        },
    ];

    const combinedCareData = [
        ...(filteredCustomerCareList?.map((item: any, index: any) => ({
            ...item,
            key: item.id,
            index: index + 1,
            isNew: false,
        })) || []),
        ...newCareList.map((item, index) => ({
            ...item,
            key: item.key,
            index: (filteredCustomerCareList?.length || 0) + index + 1,
            isNew: true,
        })),
    ];

    const customerCareColumns: ColumnsType<any> = [
        {
            title: "Lần",
            dataIndex: "index",
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Ngày",
            dataIndex: "date",
            align: "center",
            render: (value, record) =>
                record.isNew ? (
                    <DatePicker
                        style={{ width: "100%" }}
                        value={value ? dayjs(value) : null}
                        onChange={(date) =>
                            setNewCareList((prev) =>
                                prev.map((item) =>
                                    item.key === record.key
                                        ? { ...item, date: date ? date.toISOString() : null }
                                        : item
                                )
                            )
                        }
                    />
                ) : (
                    dayjs(value).format("DD/MM/YYYY")
                ),
        },
        {
            title: "Nội dung",
            dataIndex: "note",
            align: "center",
            render: (value, record) =>
                record.isNew ? (
                    <Input
                        placeholder="Nhập nội dung"
                        value={value}
                        onChange={(e) =>
                            setNewCareList((prev) =>
                                prev.map((item) =>
                                    item.key === record.key
                                        ? { ...item, note: e.target.value }
                                        : item
                                )
                            )
                        }
                    />
                ) : (
                    value
                ),
        },
        {
            title: "Loại",
            dataIndex: "type",
            align: "center",
            render: (value, record) =>
                record.isNew ? (
                    <Select
                        placeholder="Chọn loại"
                        style={{ width: "100%" }}
                        value={value}
                        onChange={(selectedValue) =>
                            setNewCareList((prev) =>
                                prev.map((item) =>
                                    item.key === record.key
                                        ? { ...item, type: selectedValue }
                                        : item
                                )
                            )
                        }
                    >
                        <Option value="incoming">Gọi đến</Option>
                        <Option value="outgoing">Gọi đi</Option>
                    </Select>
                ) : value === "incoming" ? (
                    "Gọi đến"
                ) : (
                    "Gọi đi"
                ),
        },
        {
            title: "Hành động",
            align: "center",
            render: (_, record) => (
                <Button
                    type="link"
                    danger
                    onClick={() =>
                        record.isNew
                            ? setNewCareList((prev) =>
                                prev.filter((item) => item.key !== record.key)
                            )
                            : handleDeleteRow(record.id)
                    }
                >
                    <RiDeleteBin5Line style={{ fontSize: "20px" }} />
                </Button>
            ),
        },
    ];

    const handleAddRowCustomerCare = () => {
        setNewCareList([
            ...newCareList,
            { key: Date.now(), date: null, note: '', type: '', isNew: true }
        ]);
    };


    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title="Kết quả chăm sóc"
            footer={[
                <Button key="submit" type="primary"
                    style={{
                        backgroundColor: "#BD8306",
                        color: "white",
                        border: "none",
                    }}
                    onClick={onFinish}>
                    Lưu
                </Button>
            ]}
            width={1289}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                <Row gutter={24} align="middle">
                    <Col span={8} className='mb-10'>
                        <Form.Item
                            label="Họ và tên khách hàng"
                            name="name"
                        >
                            <Input readOnly placeholder="Nhập họ và tên khách hàng" />
                        </Form.Item>
                    </Col>

                    <Col span={8} className='mb-10'>
                        <Form.Item
                            label="Giới tính"
                            name="gender"
                        >
                            <Radio.Group disabled>
                                <Radio value="MA">Nam</Radio>
                                <Radio value="FE">Nữ</Radio>
                                <Radio value="OT">Khác</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            label='Nguồn khách hàng'
                            name='source'
                        >
                            <Select placeholder='Chọn nguồn khách hàng' disabled>
                                {customerSourceList?.results?.map(
                                    (source: { id: number; name: string }) => (
                                        <Option key={source.id} value={source.id}>
                                            {source.name}
                                        </Option>
                                    )
                                )}
                            </Select>
                        </Form.Item>
                        <Form.Item name="source_link">
                            <Input readOnly placeholder="Nhập link nguồn (nếu có)" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item label="Ngày sinh" name="birth">
                            <DatePicker disabled format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày sinh" />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            label='Người tiếp thị'
                            name='marketer'
                        >
                            <Select disabled placeholder='Chọn người tiếp thị'>
                                {allUser?.map((user: any) => (
                                    <Option key={user.id} value={user.id}>
                                        {user.full_name || `${user.first_name} ${user.last_name}`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8} className='mt-7'>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            {rows.map((row, index) => (
                                <div
                                    key={row.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                    }}
                                >
                                    <Select
                                        disabled
                                        style={{ width: 200 }}
                                        placeholder='Chọn người giới thiệu'
                                        value={row.introducer}
                                        onChange={(value) =>
                                            handleChange(row.id, 'introducer', value)
                                        }
                                    >
                                        {allUser?.map((user: any) => (
                                            <Option key={user.id} value={user.id}>
                                                {user.full_name ||
                                                    `${user.first_name} ${user.last_name}`}
                                            </Option>
                                        ))}
                                    </Select>

                                    <Select
                                        disabled
                                        style={{ width: 200 }}
                                        placeholder='Chọn mức'
                                        value={row.commission}
                                        onChange={(value) =>
                                            handleChange(row.id, 'commission', value)
                                        }
                                    >
                                        {commissionList?.results?.map(
                                            (commission: { id: number; note: string }) => (
                                                <Option key={commission.id} value={commission.id}>
                                                    {commission.note}
                                                </Option>
                                            )
                                        )}
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </Col>
                </Row>

                <hr />
                <h3 className='text-[18px] font-bold mt-4'>Thông tin liên hệ</h3>
                <Row gutter={16}>
                    <Col span={8} key="mobile">
                        <Form.Item
                            label="Số điện thoại"
                            name="mobile"
                        >
                            <Input readOnly placeholder="Nhập số điện thoại" />
                        </Form.Item>
                    </Col>

                    <Col span={8} key="email">
                        <Form.Item label="Email" name="email">
                            <Input placeholder="Nhập email" readOnly />
                        </Form.Item>
                        <div>Địa chỉ liên hệ</div>
                        <Row gutter={24}>
                            <Col span={24} key="city">
                                <Form.Item name="city" className="mb-2">
                                    <Select
                                        disabled
                                        placeholder={"Chọn Tỉnh / Thành phố"}
                                        onChange={(value) =>
                                            setDistrictList(locationData?.filter((item: { Name: string }) => item.Name === value)[0]?.Districts.map((district: any) => ({
                                                ...district,
                                                Wards: district.Wards.map((ward: any) => ({
                                                    Id: ward.Id || '',
                                                    Name: ward.Name || '',
                                                    Level: ward.Level,
                                                })),
                                            })))
                                        }
                                        value={selectedRecord?.city}
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
                                        disabled
                                        placeholder={"Chọn Quận / Huyện"}
                                        onChange={(value) =>
                                            setWardList((districtList?.filter((item: any) => item.Name === value)[0] as any)?.Wards)
                                        }
                                        value={selectedRecord?.district}
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
                                    <Select placeholder={"Chọn Phường / Xã"} disabled allowClear value={selectedRecord?.ward}>
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
                                    <Input readOnly placeholder="Nhập địa chỉ" value={selectedRecord?.address} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>

                    <Col span={8} key="social-media">
                        <Row gutter={24}>
                            <Col span={24} key="contact_date">
                                <Form.Item
                                    label='Ngày hẹn đến'
                                    name='contact_date'
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                if (value && dayjs(value).isBefore(dayjs(), 'day')) {
                                                    return Promise.reject(
                                                        'Ngày hẹn đến phải sau ngày hiện tại'
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                >
                                    <DatePicker
                                        format='DD/MM/YYYY'
                                        style={{ width: '100%' }}
                                        placeholder='Chọn hẹn liên hệ'
                                        disabledDate={(current) =>
                                            current && current < dayjs().startOf('day')
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24} key="time_frame">
                                <Form.Item
                                    label="Chọn khung giờ"
                                    name="time_frame"
                                    rules={[{ required: true, message: "Vui lòng chọn khung giờ!" }]}
                                >
                                    <Select placeholder="Chọn khung giờ">
                                        {timeFrameList?.results?.map((timeFrame: any) => (
                                            <Select.Option key={timeFrame.id} value={timeFrame.id}>
                                                {`${timeFrame.start} - ${timeFrame.end}`}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <hr />
                <div className='text-[16px] font-bold mt-4'>Thông tin chi tiết</div>
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            label='Dịch vụ quan tâm'
                            name='service'
                            rules={[{ required: true, message: 'Vui lòng chọn dịch vụ!' }]}
                        >
                            <Select
                                mode='multiple'
                                placeholder='Chọn dịch vụ'
                                allowClear
                                optionFilterProp='children'
                            >
                                {serviceList?.results?.map(
                                    (service: { id: number; name: string }) => (
                                        <Option key={service.id} value={service.id}>
                                            {service.name}
                                        </Option>
                                    )
                                )}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}></Col>
                </Row>
                <Table
                    columns={generateColumns()}
                    dataSource={tableData}
                    rowKey="key"
                    pagination={false}
                    bordered
                    footer={() => (
                        <Button
                            type="dashed"
                            style={{ color: "#BD8306" }}
                            onClick={() =>
                                setTableData((prev) => [
                                    ...prev,
                                    {
                                        key: Date.now(),
                                        id: prev.length + 1,
                                        problem: "",
                                        encounter_pain: "",
                                        desire: "",
                                    },
                                ])
                            }
                            block
                        >
                            + Thêm
                        </Button>
                    )}
                />
                <br />
                <hr />
                <h3 className='text-[18px] font-bold mt-4'>Thông tin sức khoẻ</h3>
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item
                            name="nearest_examination"
                            label="Các xét nghiệm đã có(gần nhất)"
                        >
                            <TextArea readOnly />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item name="blood_presure" label="Huyết áp">
                                    <Input readOnly />
                                </Form.Item>
                                <Form.Item name="height" label="Chiều cao">
                                    <Input readOnly />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="heart_beat" label="Nhịp tim">
                                    <Input readOnly />
                                </Form.Item>
                                <Form.Item name="weight" label="Cân nặng">
                                    <Input readOnly />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="breathing_beat" label="Nhịp thở">
                            <Input readOnly />
                        </Form.Item>
                    </Col>
                </Row>
                <hr />
                <h3 className='text-[18px] font-bold mt-4'>Khám lâm sàng</h3>
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item label="Bác sĩ khám" name="">
                            <Input readOnly />
                        </Form.Item>
                        <Form.Item label="Tiền sử bệnh" name="">
                            <TextArea readOnly />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="Bắt đầu khám" name="">
                            <Input readOnly />
                        </Form.Item>
                        <Form.Item label="Triệu chứng bệnh hiện tại" name="">
                            <TextArea readOnly />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="Kết thúc khám" name="">
                            <Input readOnly />
                        </Form.Item>
                        <Form.Item label="Chuẩn đoán" name="">
                            <TextArea readOnly />
                        </Form.Item>
                    </Col>
                </Row>
                <hr />
                <h3 className='text-[18px] font-bold mt-4'>Tái khám</h3>
                <Form.Item label="Ngày tái khám" name="" className='w-[400px]'>
                    <DatePicker
                        format='DD/MM/YYYY'
                        style={{ width: '100%' }}
                        placeholder='Chọn ngày tái khám'
                    />
                </Form.Item>
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item label="Lời khuyên" name="">
                            <TextArea />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Đánh giá của bác sĩ">
                            <TextArea
                                placeholder='Nhập đánh giá của bác sĩ'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <hr />
                <h3 className='text-[18px] font-bold mt-4'>Thông tin chăm sóc khách hàng</h3>
                <div className="w-full">
                    <Table
                        columns={customerCareColumns}
                        dataSource={combinedCareData}
                        rowKey="key"
                        pagination={false}
                        bordered
                        footer={() => (
                            <Button
                                type="dashed"
                                style={{ color: "#BD8306" }}
                                onClick={handleAddRowCustomerCare}
                                block
                            >
                                + Thêm
                            </Button>
                        )}
                    />
                </div>
            </Form>
        </Modal>
    );
};

export default UpdateBuying;
