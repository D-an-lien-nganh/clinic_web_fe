"use client"
import { useGetAllUserQuery } from '@/api/app_home/apiAccount';
import { useGetTimeFrameListQuery } from '@/api/app_home/apiConfiguration';
import { useGetCustomerSocialListQuery, useGetCustomerSourceListQuery, useGetCustomerStatusListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetSetupQuery } from '@/api/app_home/apiSetup';
import { useEditBookingMutation, useGetBookingQuery } from '@/api/app_treatment/apiTreatment';
import { locationData } from '@/constants/location';
import { Button, Col, DatePicker, Form, Input, Modal, notification, Radio, Row, Select } from 'antd'
import dayjs from 'dayjs';
import React, { use, useEffect, useState } from 'react'

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

export default function AddExperienceRequest({ open, onCancel, bookingId }: { open: boolean, onCancel: () => void, bookingId?: any }) {
    const [form] = Form.useForm();
    const { data: customerSourceList } = useGetCustomerSourceListQuery();
    const { data: timeFrameList } = useGetTimeFrameListQuery();
    const { data: allUser } = useGetAllUserQuery();
    const [editBooking] = useEditBookingMutation();
    const [districtList, setDistrictList] = useState<District[] | []>([]);
    const [wardList, setWardList] = useState([]);
    const { data } = useGetBookingQuery(bookingId, {
        skip: !bookingId,
    });

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                ...data,
                appointment_time: data.appointment_time ? dayjs(data.appointment_time) : null,
                actual_arrival_time: data.actual_arrival_time ? dayjs(data.actual_arrival_time) : null,
                birth: data.customer_info?.birth ? dayjs(data.customer_info.birth) : null,
                contact_date: data.contact_date ? dayjs(data.contact_date) : null,
                source: data?.customer_info?.source_details?.source_name,
                source_link: data?.customer_info?.source_details?.source_link,
                name: data.customer_info?.name,
                gender: data.customer_info?.gender,
                mobile: data.customer_info?.mobile,
                email: data.customer_info?.email,
                city: data.customer_info?.city,
                district: data.customer_info?.district,
                ward: data.customer_info?.ward,
                address: data.customer_info?.address,
                marketer: data.customer_info?.marketer_full,
            });
        }
    }, [data, form]);

    const onFinishNurse = async () => {
        const validatedValues = await form.validateFields()
        const payload = {
            status: "waiting_for_nurse",
            reception: validatedValues.reception,
            customer: data?.customer_info?.id,
        };

        try {
            await editBooking({ id: bookingId, ...payload }).unwrap();
            onCancel();
            form.resetFields();
            notification.success({
                message: "Đã gửi lên y tá thành công",
                placement: "bottomRight",
                className: 'h-16',
            });
        } catch (error) {
            console.error("Lỗi khi tạo yêu cầu:", error);
            notification.error({
                message: "Gửi yêu cầu thất bại",
                description: "Có lỗi xảy ra khi gửi yêu cầu lên y tá",
                placement: "bottomRight",
            });
        }
    }
    const onFinishExpert = () => {

    }

    return (
        <Modal
            onCancel={onCancel}
            open={open}
            title="Yêu cầu trải nghiệm"
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button key="submit" type="primary" onClick={onFinishNurse}>
                    Gửi y tá
                </Button>,
                data?.is_treatment && (
                    <Button key="submit" type="primary" onClick={onFinishExpert}>
                        Gửi chuyên gia
                    </Button>
                ),
            ]}
            width={1289}
            destroyOnClose
        >

            <Form layout='vertical' form={form} onFinish={onFinishNurse} className='w-full'>
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item label="Họ tên khách hàng" name="name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Trạng thái"
                            name="status"
                            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                        >
                            <Select placeholder="Chọn trạng thái">
                                <Option value="YCTN">Yêu cầu trải nghiệm</Option>
                                <Option value="YCDV">Yêu cầu dịch vụ</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            label='Nguồn khách hàng'
                            name='source'
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
                    <Col span={8}>
                        <Form.Item
                            label="Giới tính"
                            name="gender"
                        >
                            <Radio.Group>
                                <Radio value='MA'>Nam</Radio>
                                <Radio value='FE'>Nữ</Radio>
                                <Radio value='OT'>Khác</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            label='Người tiếp thị'
                            name='marketer'
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
                    <Col span={8}>
                        <Form.Item label='Ngày sinh' name='birth'>
                            <DatePicker
                                format='DD/MM/YYYY'
                                style={{ width: '100%' }}
                                placeholder='Chọn ngày sinh'
                            />
                        </Form.Item>
                        <Form.Item
                            label='Lễ tân'
                            name=''
                        >
                            <Select placeholder='Chọn lễ tân'>
                                {allUser?.map((user: any) => (
                                    <Option key={user.id} value={user.id}>
                                        {user.full_name || `${user.first_name} ${user.last_name}`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            label='Y tá tiếp nhận'
                            name='reception'
                            rules={[{ required: true, message: "Vui lòng chọn y tá tiếp nhận!" }]}
                        >
                            <Select placeholder='Chọn y tá tiếp nhận'>
                                {allUser?.map((user: any) => (
                                    <Option key={user.id} value={user.id}>
                                        {user.full_name || `${user.first_name} ${user.last_name}`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <hr />
                <h3 className='text-[18px] font-bold mt-4'>Thông tin liên hệ</h3>
                <Row gutter={16}>
                    <Col span={8} key="mobile">
                        <Form.Item
                            label="Số điện thoại"
                            name="mobile"
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
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
                        <Form.Item
                            label="Ngày hẹn đến"
                            name="contact_date"
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                        >
                            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn hẹn đến" />
                        </Form.Item>
                        <Form.Item
                            label="Chọn khung giờ"
                            name="time_frame"
                        >
                            <Select placeholder="Chọn khung giờ">
                                {timeFrameList?.results?.map((timeFrame: any) => (
                                    <Select.Option key={timeFrame.id} value={timeFrame.id}>
                                        {`${timeFrame.start} - ${timeFrame.end}`}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            label="Ngày đến"
                            name="actual_arrival_time"
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                        >
                            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}
