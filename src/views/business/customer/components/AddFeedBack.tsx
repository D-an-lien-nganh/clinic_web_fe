"use client";
import { useCreateFeedBackMutation, useGetFeedBackQuery } from '@/api/app_customer/apiMarketing';
import { useGetCustomerSourceListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetServiceListQuery } from '@/api/app_product/apiService';
import { Button, Col, Form, Input, Modal, notification, Radio, Rate, Row, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

export default function AddFeedBack({ id, title, edit }: { id?: number, title: string, edit?: boolean }) {
    const [form] = Form.useForm();
    const [shouldFetch, setShouldFetch] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: customerSourceList } = useGetCustomerSourceListQuery(undefined, { skip: !shouldFetch });
    const { data: serviceList } = useGetServiceListQuery({}, { skip: !shouldFetch });
    const { data: feedBacktId } = useGetFeedBackQuery(id, { skip: !id });
    const [createFeedBack, { isLoading, isError, error }] = useCreateFeedBackMutation(); // Thêm isLoading, isError, error để debug

    const handleCancel = () => {
        setShouldFetch(false);
        setIsModalOpen(false);
        form.resetFields();
    };

    const showModal = () => {
        setShouldFetch(true);
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (isModalOpen) {
            if (edit && feedBacktId) {
                form.setFieldsValue({
                    ...feedBacktId,
                });
            } else {
                form.resetFields();
            }
        }
    }, [isModalOpen, edit, feedBacktId, form]);

    const onFinish = async (values: any) => {
        try {
            // Validate form
            const validatedValues = await form.validateFields();
            
            // Chuẩn bị payload để gửi lên backend
            const payload = {
                name: validatedValues.name, // Họ tên khách hàng
                source: validatedValues.source, // Nguồn khách hàng (ID)
                source_name: validatedValues.source_name, // Tên nguồn (mạng xã hội)
                source_link: validatedValues.source_link, // Liên kết URL
                format: validatedValues.format, // Hình thức phản hồi
                gender: validatedValues.gender, // Giới tính
                email: validatedValues.email, // Email
                mobile: validatedValues.mobile, // Số điện thoại
                service: Array.isArray(validatedValues.service)
                    ? validatedValues.service.map((id: any) => Number(id))
                    : [], // Dịch vụ (mảng ID)
                satification_level: validatedValues.satification_level, // Mức độ hài lòng
                service_quality: validatedValues.service_quality, // Chất lượng dịch vụ
                examination_quality: validatedValues.examination_quality, // Chất lượng thăm khám
                serve_quality: validatedValues.serve_quality, // Chất lượng phục vụ
                customercare_quality: validatedValues.customercare_quality, // Chất lượng CSKH
                unsatify_note: validatedValues.unsatify_note, // Điểm không hài lòng
                suggest_note: validatedValues.suggest_note, // Ý kiến góp ý
            };

            // Gửi dữ liệu lên backend
            const response = await createFeedBack(payload).unwrap();
            
            // Hiển thị thông báo thành công
            notification.success({
                message: "Tạo phản hồi thành công!",
                placement: "bottomRight",
                className: "h-16",
            });
            
            // Đóng modal và reset form
            handleCancel();
            
            // (Tùy chọn) Làm mới dữ liệu hoặc redirect nếu cần
            console.log("Response from backend:", response);
        } catch (error) {
            // Xử lý lỗi
            console.error("Error creating feedback:", error);
            if (isError) {
                notification.error({
                    message: "Lỗi khi tạo phản hồi!",
                    description: error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.",
                    placement: "bottomRight",
                    className: "h-16",
                });
            }
        }
    };

    return (
        <>
            <Button
                onClick={showModal}
                style={{
                    backgroundColor: "#BD8306",
                    color: "white",
                    border: "none",
                }}
            >
                {edit ? "Xem chi tiết" : "Tạo phản hồi"}
            </Button>
            <Modal
                open={isModalOpen}
                onCancel={handleCancel}
                title={title}
                footer={
                    edit
                        ? ""
                        : [
                            <Button key="cancel" onClick={handleCancel}>
                                Làm lại
                            </Button>,
                            <Button key="submit" type="primary" onClick={onFinish} loading={isLoading}>
                                Tạo
                            </Button>,
                        ]
                }
                width={1289}
                destroyOnClose
            >
                <Form
                    form={form}
                    initialValues={{
                        gender: "MA",
                    }}
                >
                    <h3 className='text-[18px] font-bold mt-4'>Thông tin phản hồi</h3>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item
                                name="name"
                                label="Họ tên khách hàng"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
                            >
                                <Input readOnly={edit} />
                            </Form.Item>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Nguồn khách hàng"
                                        name="source"
                                        rules={[{ required: true, message: "Vui lòng chọn nguồn khách hàng!" }]}
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                    >
                                        <Select placeholder="Chọn nguồn khách hàng">
                                            {customerSourceList?.results?.map((source: { id: number, name: string }) => (
                                                <Option key={source.id} value={source.id}>
                                                    {source.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Hình thức phản hồi"
                                        name="format"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        rules={[{ required: true, message: "Vui lòng chọn hình thức phản hồi!" }]}
                                    >
                                        <Select placeholder="Chọn hình thức phản hồi">
                                            <Option value="direct">Trực tiếp</Option>
                                            <Option value="indirect">Gián tiếp</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item
                                label="Dịch vụ khám"
                                name="service"
                                rules={[{ required: true, message: "Vui lòng chọn dịch vụ!" }]}
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn dịch vụ"
                                    allowClear
                                    optionFilterProp="children"
                                >
                                    {serviceList?.results?.map((service: { id: number, name: string }) => (
                                        <Option key={service.id} value={service.id}>
                                            {service.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8} className='mt-10'>
                            <Form.Item
                                label="Giới tính"
                                name="gender"
                            >
                                <Radio.Group>
                                    <Radio value="MA">Nam</Radio>
                                    <Radio value="FE">Nữ</Radio>
                                    <Radio value="OT">Khác</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Mạng xã hội"
                                        name="source_name"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        rules={[{ required: true, message: "Vui lòng chọn mạng xã hội!" }]}
                                    >
                                        <Select placeholder="Chọn mạng xã hội">
                                            {customerSourceList?.results?.map((source: { id: number, name: string }) => (
                                                <Option key={source.id} value={source.name}>
                                                    {source.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label=" "
                                        name="source_link"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        rules={[{ required: true, message: "Vui lòng nhập URL!" }]}
                                    >
                                        <Input placeholder="Nhập URL" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Email"
                                name="email"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, type: 'email', message: "Vui lòng nhập email hợp lệ!" }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label="Số điện thoại"
                                name="mobile"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <hr />
                    <h3 className='text-[18px] font-bold mt-4'>Thông tin khảo sát</h3>
                    <Row gutter={24}>
                        <Col span={10}>
                            <Form.Item
                                label="Mức độ hài lòng"
                                name="satification_level"
                                rules={[{ required: true, message: "Vui lòng đánh giá!" }]}
                            >
                                <Rate style={{ marginLeft: "90px" }} />
                            </Form.Item>

                            <Form.Item
                                label="Chất lượng dịch vụ"
                                name="service_quality"
                                rules={[{ required: true, message: "Vui lòng đánh giá!" }]}
                            >
                                <Rate style={{ marginLeft: "75px" }} />
                            </Form.Item>
                            <Form.Item
                                label="Chất lượng thăm khám"
                                name="examination_quality"
                                rules={[{ required: true, message: "Vui lòng đánh giá!" }]}
                            >
                                <Rate style={{ marginLeft: "50px" }} />
                            </Form.Item>
                            <Form.Item
                                label="Chất lượng phục vụ"
                                name="serve_quality"
                                rules={[{ required: true, message: "Vui lòng đánh giá!" }]}
                            >
                                <Rate style={{ marginLeft: "70px" }} />
                            </Form.Item>
                            <Form.Item
                                label="Chất lượng CSKH"
                                name="customercare_quality"
                                rules={[{ required: true, message: "Vui lòng đánh giá!" }]}
                            >
                                <Rate style={{ marginLeft: "85px" }} />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Điểm không hài lòng"
                                name="unsatify_note"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <TextArea />
                            </Form.Item>
                            <Form.Item
                                label="Ý kiến góp ý"
                                name="suggest_note"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                            >
                                <TextArea />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}