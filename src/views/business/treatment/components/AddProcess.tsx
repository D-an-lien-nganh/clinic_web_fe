import {
    useCreateMarketingMutation,
    useEditMarketingMutation,
    useGetCustomerRequestQuery,
    useGetMarketingQuery,
} from '@/api/app_customer/apiMarketing';
import { useGetAllUserQuery } from '@/api/app_home/apiAccount';
import { useGetCommissionListQuery } from '@/api/app_home/apiConfiguration';
import { useGetCustomerSourceListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetServiceListQuery } from '@/api/app_product/apiService';
import { locationData } from '@/constants/location';
import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    Modal,
    notification,
    Radio,
    Row,
    Select,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Table } from 'antd/lib';
import dayjs from 'dayjs';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { FaMinus, FaPlus } from 'react-icons/fa6';
import { RiDeleteBin5Line } from 'react-icons/ri';

const { Option } = Select;

interface CustomerProblem {
    key: React.Key;
    id: number;
    problem: string;
    encounter_pain: string;
    desire: string;
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


export default function Process({
}: {

    }) {
    const [form] = Form.useForm();
    const [districtList, setDistrictList] = useState<District[] | []>([]);
    const [wardList, setWardList] = useState([]);
    const [createMarketing] = useCreateMarketingMutation();
    const [editMarketing] = useEditMarketingMutation();
    const [internalModalOpen, setInternalModalOpen] = useState(false);
    const { data: customerSourceList } = useGetCustomerSourceListQuery();
    const { data: commissionList } = useGetCommissionListQuery();
    const { data: serviceList } = useGetServiceListQuery({});
    const { data: allUser } = useGetAllUserQuery();
    const { data: customerRequestList } = useGetCustomerRequestQuery();

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


    // Sửa lại hàm khởi tạo rows nếu chưa có
    useEffect(() => {
        if (rows.length === 0) {
            setRows([{ id: Date.now(), introducer: null, commission: null }]);
        }
    }, []);

    // Giữ nguyên hàm handleAddRow với tham số index
    const handleAddRow = (index: number) => {
        const newRow = { id: Date.now(), introducer: null, commission: null };
        setRows([...rows.slice(0, index + 1), newRow, ...rows.slice(index + 1)]);
    };

    // Giữ nguyên hàm handleRemoveRow
    const handleRemoveRow = (id: any) => {
        setRows(rows.filter((row) => row.id !== id));
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

    const handleCancel = () => {
        // Close internal modal state
        setInternalModalOpen(false);
    };


    const showModal = () => {
        setInternalModalOpen(true);
    };

    const onFinish = async (values: any) => {
        try {
            const validatedValues = await form.validateFields();
            const payload = {
                ...validatedValues,
                contact_date: validatedValues.contact_date
                    ? dayjs(validatedValues.contact_date).format('YYYY-MM-DD')
                    : null,
                birth: validatedValues.birth
                    ? dayjs(validatedValues.birth).format('YYYY-MM-DD')
                    : null,
                service: Array.isArray(validatedValues.service)
                    ? validatedValues.service.map((id: any) => Number(id))
                    : [],
                introducers: rows
                    .filter(row => row.introducer && row.commission)
                    .map(row => ({
                        id: row.id,
                        introducer: Number(row.introducer),
                        commission: Number(row.commission),
                    })),
                customer_request: Array.isArray(validatedValues.customer_request)
                    ? validatedValues.customer_request.map((id: any) => Number(id))
                    : [],


                customer_problems: tableData.map((item) => ({
                    problem: item.problem,
                    encounter_pain: item.encounter_pain,
                    desire: item.desire,
                })),
            };

            await createMarketing(payload).unwrap();
            setRows(payload.introducers.length > 0 ? payload.introducers : [{ id: Date.now(), introducer: null, commission: null }]);
            notification.success({
                message: 'Khách hàng đã được thêm mới!',
                placement: 'bottomRight',
                className: 'h-16',
            });

            handleCancel();
        } catch (error) {
            console.error('Error during submission:', error);
            notification.error({
                message: 'Lỗi',
                description: 'Đã xảy ra lỗi khi xử lý dữ liệu!',
            });
        }
    };

    return (
        <>
            <Button onClick={showModal} type='primary'>Thêm bệnh nhân</Button>

            <Modal
                open={internalModalOpen}
                onCancel={handleCancel}
                footer={[
                    <Button key='cancel' onClick={handleCancel}>
                        Hủy
                    </Button>,
                    <Button key='submit' type='primary' onClick={onFinish}>
                        Xác nhận
                    </Button>,
                ]}
                width={1289}
                destroyOnClose
            >
                <Form
                    form={form}
                    id='marketingForm'
                    layout='vertical'
                    onFinish={onFinish}
                    initialValues={{
                        gender: 'MA',
                    }}
                >
                    <Row gutter={24} align='middle'>
                        <Col span={8} className='mb-10'>
                            <Form.Item
                                label='Họ và tên khách hàng'
                                name='name'
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập họ tên khách hàng!',
                                    },
                                ]}
                            >
                                <Input placeholder='Nhập họ và tên khách hàng' />
                            </Form.Item>
                        </Col>

                        {/* Giới tính */}
                        <Col span={8} className='mb-10'>
                            <Form.Item label='Giới tính' name='gender'>
                                <Radio.Group>
                                    <Radio value='MA'>Nam</Radio>
                                    <Radio value='FE'>Nữ</Radio>
                                    <Radio value='OT'>Khác</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>

                        {/* Nguồn khách hàng */}
                        <Col span={8}>
                            <Form.Item
                                label='Nguồn khách hàng'
                                name='source'
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng chọn nguồn khách hàng!',
                                    },
                                ]}
                            >
                                <Select placeholder='Chọn nguồn khách hàng'>
                                    {customerSourceList?.results?.map(
                                        (source: { id: number; name: string }) => (
                                            <Option key={source.id} value={source.id}>
                                                {source.name}
                                            </Option>
                                        )
                                    )}
                                </Select>
                            </Form.Item>
                            <Form.Item name='source_link'>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        {/* Nguồn khách hàng */}
                        <Col span={8}>
                            <Form.Item label='Ngày sinh' name='birth'>
                                <DatePicker
                                    format='DD/MM/YYYY'
                                    style={{ width: '100%' }}
                                    placeholder='Chọn ngày sinh'
                                />
                            </Form.Item>
                        </Col>

                        {/* Người tiếp thị */}
                        <Col span={8}>
                            <Form.Item
                                label='Người tiếp thị'
                                name='marketer'
                                rules={[
                                    { required: true, message: 'Vui lòng chọn người tiếp thị!' },
                                ]}
                            >
                                <Select placeholder='Chọn người tiếp thị'>
                                    {allUser?.map((user: any) => (
                                        <Option key={user.id} value={user.id}>
                                            {user.full_name || `${user.first_name} ${user.last_name}`}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8} className='mt-7'>
                            <Form.Item label="Người giới thiệu">
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8,
                                    }}
                                >
                                    {rows.map((row, index) => (
                                        <div
                                            key={row.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 16,
                                            }}
                                        >
                                            <div className='border rounded-full'>
                                                <Button
                                                    type='text'
                                                    icon={<FaPlus />}
                                                    onClick={() => handleAddRow(index)}
                                                />
                                            </div>
                                            {/* Chọn người giới thiệu */}
                                            <Select
                                                style={{ width: 180 }}
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

                                            {/* Chọn mức */}
                                            <Select
                                                style={{ width: 130 }}
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

                                            {/* Nút xóa */}
                                            <div className='border rounded-full'>
                                                <Button
                                                    danger
                                                    type='text'
                                                    icon={<FaMinus />}
                                                    onClick={() => handleRemoveRow(row.id)}
                                                    disabled={rows.length === 1} // Không cho xóa nếu chỉ còn 1 hàng
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Trạng thái" name="customer_request">
                                <Select placeholder='Chọn trạng thái' mode="multiple" allowClear>
                                    {customerRequestList?.results?.map((item: any) => (
                                        <Option key={item.id} value={item.id}>
                                            {item?.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <hr />

                    {/* Thông tin liên hệ */}
                    <h3 className='text-[16px] font-bold mt-4'>Thông tin liên hệ</h3>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label='Số điện thoại'
                                name='mobile'
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                                ]}
                            >
                                <Input placeholder='Nhập số điện thoại' />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label='Email'
                                name='email'
                                rules={[
                                    {
                                        type: 'email',
                                        message: 'Vui lòng nhập đúng định dạng email!',
                                    },
                                ]}
                            >
                                <Input placeholder='Nhập email' />
                            </Form.Item>
                            <div>Địa chỉ liên hệ</div>
                            <Row gutter={24}>
                                <Col span={24}>
                                    <Form.Item name='city' className='mb-2'>
                                        <Select
                                            placeholder={'Chọn Tỉnh / Thành phố'}
                                            onChange={(value) =>
                                                setDistrictList(
                                                    locationData?.filter(
                                                        (item: { Name: string }) => item.Name === value
                                                    )[0]?.Districts
                                                )
                                            }
                                        >
                                            {locationData &&
                                                locationData?.map(
                                                    (item: { Id: string; Name: string }) => (
                                                        <Option key={item.Id} value={item.Name}>
                                                            {item.Name}
                                                        </Option>
                                                    )
                                                )}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name='district' className='mb-2'>
                                        <Select
                                            placeholder={'Chọn Quận / Huyện'}
                                            onChange={(value) =>
                                                setWardList(
                                                    (
                                                        districtList?.filter(
                                                            (item: any) => item.Name === value
                                                        )[0] as any
                                                    )?.Wards
                                                )
                                            }
                                        >
                                            {districtList?.map(
                                                (item: { Id: string; Name: string }) => (
                                                    <Option key={item.Id} value={item.Name}>
                                                        {item.Name}
                                                    </Option>
                                                )
                                            )}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name='ward' className='mb-2'>
                                        <Select placeholder={'Chọn Phường / Xã'} allowClear>
                                            {wardList?.map((item: { Id: string; Name: string }) => (
                                                <Option key={item.Id} value={item.Name}>
                                                    {item.Name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name='address' className='mb-2'>
                                        <Input placeholder='Nhập địa chỉ' />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Row gutter={24}>
                                <Col span={14}></Col>
                                <Col span={24}>
                                    <Form.Item
                                        label='Ngày hẹn liên hệ'
                                        name='contact_date'
                                        rules={[
                                            {
                                                validator: (_, value) => {
                                                    if (value && dayjs(value).isBefore(dayjs(), 'day')) {
                                                        return Promise.reject(
                                                            'Ngày hẹn liên hệ phải sau ngày hiện tại'
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
                            </Row>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}
