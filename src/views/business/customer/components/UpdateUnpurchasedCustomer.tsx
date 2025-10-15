"use client"
import { useEditMarketingMutation, useGetMarketingQuery } from '@/api/app_customer/apiMarketing';
import { useGetCustomerSocialListQuery, useGetCustomerSourceListQuery, useGetCustomerStatusListQuery } from '@/api/app_home/apiCustomerManagement';
;
import { useGetSetupQuery } from '@/api/app_home/apiSetup';
import { locationData } from '@/constants/location';
import { Button, Col, DatePicker, Form, Input, Modal, notification, Radio, Row, Select, TimePicker } from 'antd'
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react'
import { IoAddCircleOutline } from 'react-icons/io5';

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

export default function UpdateUnpurchasedCustomer({ title, id }: { title: string, id: number }) {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(false);
    const [districtList, setDistrictList] = useState<District[] | []>([]);
    const [wardList, setWardList] = useState([]);
    const { data: customerSourceList } = useGetCustomerSourceListQuery(undefined, { skip: !shouldFetch });
    const { data: customerSocialList } = useGetCustomerSocialListQuery(undefined, { skip: !shouldFetch });
    const { data: customerStatus } = useGetCustomerStatusListQuery(undefined, { skip: !shouldFetch });
    const { data: data } = useGetMarketingQuery(id, { skip: !id });
    const { data: setUpList } = useGetSetupQuery(undefined, { skip: !shouldFetch });
    const [editCustomer] = useEditMarketingMutation();

    useEffect(() => {
        if (data) {

            const comments = (data.comment || []).map((comment: any) => ({
                ...comment,
                time: comment.time ? dayjs(comment.time) : null,
                status_id: comment.status?.id || null,  // Sử dụng status_id thay vì status
            }));

            // Gán giá trị vào form
            form.setFieldsValue({
                ...data,
                date_of_birth: data.date_of_birth ? dayjs(data.date_of_birth) : null,
                appointment_time: data.appointment_time ? dayjs(data.appointment_time) : null,
                actual_arrival_time: data.actual_arrival_time ? dayjs(data.actual_arrival_time) : null,
                comments: comments,
                source: data.source?.id || null,
                social_media: data.social_media?.id || null,
                status: data.status?.id || null,
            });
        }
    }, [data, form]);

    const showModal = () => {
        setShouldFetch(true);
        setIsModalOpen(true);
        form.resetFields();

        if (data) {
            const comments = (data.comment || []).map((comment: any) => ({
                ...comment,
                time: comment.time ? dayjs(comment.time) : null,
                status: comment.status?.id || null,
            }));
            form.setFieldsValue({
                ...data,
                comments: comments,
                date_of_birth: data.date_of_birth ? dayjs(data.date_of_birth) : null,
                appointment_time: data.appointment_time ? dayjs(data.appointment_time) : null,
                actual_arrival_time: data.actual_arrival_time ? dayjs(data.actual_arrival_time) : null,
                source: data.source?.id || null,
                social_media: data.social_media?.id || null,
                status: data.status?.id || null,
            });
        }
    };



    const handleCancel = () => {
        setIsModalOpen(false);
        setShouldFetch(false);
        form.resetFields();
    }

    const onFinish = async () => {
        try {
            const values = await form.validateFields(); // Lấy giá trị từ form

            // Lọc các comment hợp lệ (có title)
            const filteredComments = values.comments?.filter((comment: any) => comment?.title?.trim() !== "");

            const payload = {
                ...values,
                comments: filteredComments?.map((comment: any) => ({
                    ...comment,
                    status_id: comment.status, // Đổi từ status sang status_id
                    time: comment.time ? dayjs(comment.time).format('YYYY-MM-DD') : null,
                })),
                status_id: values.status, // Đảm bảo rằng status_id được gán đúng
                appointment_time: values.appointment_time
                    ? dayjs(values.appointment_time).format('YYYY-MM-DD HH:mm')
                    : null,
                actual_arrival_time: values.actual_arrival_time
                    ? dayjs(values.actual_arrival_time).format('YYYY-MM-DD HH:mm')
                    : null,
            };

            // Gửi payload lên API
            const response = await editCustomer({ id: id, ...payload }).unwrap();
            if (response) {
                notification.success({
                    message: 'Khách hàng đã được cập nhật!',
                    className: "h-16",
                    placement: "bottomRight",
                });
                handleCancel();  // Đóng modal
            } else {
                notification.error({
                    message: response?.message || 'Đã có lỗi xảy ra trong quá trình cập nhật!',
                    className: "h-16",
                    placement: "bottomRight",
                });
            }
        } catch (error) {
            console.error("Error during submission:", error);
            notification.error({
                message: 'Đã xảy ra lỗi khi xử lý dữ liệu!',
                className: "h-16",
                placement: "bottomRight",
            });
        }
    };



    return (
        <>
            <Button onClick={showModal} style={{
                backgroundColor: "#BD8306",
                color: "white",
                border: "none",
            }}>
                Cập nhật
            </Button>
            <Modal
                open={isModalOpen}
                onCancel={handleCancel}
                title={title}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" onClick={onFinish}>
                        Xác nhận
                    </Button>
                ]}
                width={1289}
                destroyOnClose
            >
                <Form form={form}>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item
                                name="full_name"
                                label="Họ tên khách hàng"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Input disabled />
                            </Form.Item>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Nguồn khách hàng"
                                        name="source"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                    >
                                        <Select placeholder="Chọn nguồn khách hàng" disabled>
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
                                style={{ marginTop: "40px" }}
                            >
                                <Radio.Group disabled>
                                    <Radio value="Nam">Nam</Radio>
                                    <Radio value="Nữ">Nữ</Radio>
                                    <Radio value="Khác">Khác</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item
                                label="Người tiếp thị"
                                name="sales_person"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Select placeholder="Chọn người tiếp thị" disabled>
                                    {setUpList?.employee_list?.map((employee: any) => (
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
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <DatePicker
                                    disabled
                                    format="DD/MM/YYYY"
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <hr />

                    <h3 className='text-[18px] font-bold mt-4'>Thông tin liên hệ</h3>
                    <Row gutter={16}>
                        <Col span={8} key="phone-number">
                            <Form.Item
                                label="Số điện thoại"
                                name="phone_number"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                            >
                                <Input disabled placeholder="Nhập số điện thoại" />
                            </Form.Item>
                        </Col>

                        <Col span={8} key="email">
                            <Form.Item
                                label="Email"
                                name="email"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Input placeholder="Nhập email" disabled />
                            </Form.Item>
                            <div>Địa chỉ liên hệ</div>
                            <Row gutter={24}>
                                <Col span={24} key="city">
                                    <Form.Item name="city" className="mb-2">
                                        <Select
                                            disabled
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
                                            disabled
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
                                        <Select placeholder={"Chọn Phường / Xã"} disabled allowClear>
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
                                        <Input disabled placeholder="Nhập địa chỉ" />
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
                                        <Select placeholder="Chọn mạng xã hội" disabled >
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
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                                <Col span={24} key="appointment-time">
                                    <Form.Item
                                        label="Ngày hẹn đến"
                                        name="appointment_time"
                                        rules={[{ required: true, message: "Vui lòng chọn hẹn đến!" }]}
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                    >
                                        <DatePicker
                                            showTime
                                            format="DD/MM/YYYY HH:mm"
                                            style={{ width: '100%' }}
                                            placeholder="Chọn hẹn đến"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24} key="actual-arrival-time">
                                    <Form.Item
                                        label="Chọn khung giờ"
                                        name="actual_arrival_time"
                                        rules={[{ required: true, message: "Vui lòng chọn khung giờ!" }]}
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                    >
                                        <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
                                    </Form.Item>

                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <hr />
                    <h3 className='text-[18px] font-bold mt-4'>Thông tin chăm sóc khách hàng</h3>
                    <div className="w-full">
                        <Row gutter={24} className="border rounded-t-xl bg-gray-100">
                            <Col span={3} className="py-4 text-center">
                                <strong>Lần</strong>
                            </Col>
                            <Col span={7} className="py-4 text-center">
                                <strong>Ngày</strong>
                            </Col>
                            <Col span={7} className="py-4 text-center">
                                <strong>Kết quả chăm sóc</strong>
                            </Col>
                            <Col span={7} className="py-4 text-center">
                                <strong>Cập nhật trạng thái</strong>
                            </Col>
                            {/* <Col span={3} className="py-4 text-center">
                                <strong>Hành động</strong>
                            </Col> */}
                        </Row>
                        <Form.List name="comments">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                                        // Lấy giá trị title, time, status từ form
                                        const title = form.getFieldValue(['comments', name, 'title']);
                                        const time = form.getFieldValue(['comments', name, 'time']);
                                        const status = form.getFieldValue(['comments', name, 'status']);

                                        // Tạo key duy nhất cho mỗi comment
                                        const uniqueKey = key || `${name}-${index}`;

                                        return (
                                            <Row key={uniqueKey} gutter={24} className="border-t border-l border-r">
                                                <Form.Item {...restField} name={[name, 'id']} hidden>
                                                    <Input />
                                                </Form.Item>

                                                {/* STT */}
                                                <Col span={3} className="text-center mt-3">{index + 1}</Col>

                                                {/* Thời gian */}
                                                <Col span={7} className="p-2 h-12">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'time']}
                                                        noStyle
                                                        initialValue={time ? dayjs(time) : null} // Gán dayjs nếu có giá trị time
                                                    >
                                                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày" />
                                                    </Form.Item>
                                                </Col>

                                                {/* Tiêu đề */}
                                                <Col span={7} className="p-2 h-12">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'title']}
                                                        noStyle
                                                        initialValue={title || ''} // Gán tiêu đề nếu có giá trị
                                                    >
                                                        <Input placeholder="Nhập kết quả chăm sóc" />
                                                    </Form.Item>
                                                </Col>

                                                {/* Trạng thái */}
                                                <Col span={7} className="p-2 h-12">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'status']}
                                                        noStyle
                                                        initialValue={status || null} // Gán trạng thái nếu có giá trị
                                                    >
                                                        <Select placeholder="Chọn trạng thái" className="w-full">
                                                            {customerStatus?.results?.map((statusItem: any) => (
                                                                <Option key={statusItem.id} value={statusItem.id}>
                                                                    {statusItem.title}
                                                                </Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>

                                                {/* Nút Xóa */}
                                                {/* <Col span={3} className="p-2 h-12 text-center">
                                                    <Button
                                                        type="link"
                                                        onClick={() => {
                                                            remove(name); // Xóa comment khỏi form

                                                            // Cập nhật lại danh sách comments trong form sau khi xóa
                                                            const newComments = form.getFieldValue('comments').filter((_: any, idx: any) => idx !== index);
                                                            form.setFieldsValue({ comments: newComments }); // Đồng bộ lại giá trị trong form
                                                        }}
                                                        ghost
                                                        danger
                                                    >
                                                        Xóa
                                                    </Button>
                                                </Col> */}
                                            </Row>
                                        );
                                    })}

                                    {/* Nút Thêm Dòng */}
                                    <Row gutter={24}>
                                        <Col span={24}>
                                            <Button
                                                type="dashed"
                                                className="!rounded-none flex"
                                                style={{ color: '#BD8306' }}
                                                onClick={() => add()}
                                                block
                                            >
                                                <IoAddCircleOutline />
                                                Thêm
                                            </Button>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </Form.List>
                    </div>

                </Form>
            </Modal>
        </>
    )
}
