import { useGetAllUserQuery } from '@/api/app_home/apiAccount';
import { useGetDepartmentListAllQuery, useGetFloorListQuery, useGetTimeFrameListQuery } from '@/api/app_home/apiConfiguration';
import { useGetCustomerSocialListQuery, useGetCustomerSourceListQuery, useGetCustomerStatusListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetSetupQuery } from '@/api/app_home/apiSetup';
import { useCreateDoctorProcessMutation, useCreateNurseProcessMutation, useGetBookingQuery, useGetNurseProcessListQuery } from '@/api/app_treatment/apiTreatment';
import { locationData } from '@/constants/location';
import { Button, Col, DatePicker, Form, Input, Modal, notification, Radio, Row, Select } from 'antd'
import TextArea from 'antd/es/input/TextArea';
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

interface FormValues {
    // Các trường của modal đầu tiên
    name?: string;
    status?: string;
    source?: number;
    source_link?: string;
    gender?: string;
    marketer?: number;
    birth?: any;
    reception?: number;
    mobile?: string;
    email?: string;
    city?: string;
    district?: string;
    ward?: string;
    address?: string;
    contact_date?: any;
    time_frame?: number;
    actual_arrival_time?: any;
    nearest_examination?: string;
    blood_presure?: string;
    heart_beat?: string;
    height?: string | number;
    weight?: string | number;
    breathing_beat?: string | number;

    // Các trường của modal thứ hai
    department?: number;
    floor?: number;
    assigned_doctor?: number;

    // Các trường khác
    [key: string]: any;
}

export default function AddWaitingForNurse({ open, onCancel, customerId }: { open: boolean, onCancel: () => void, customerId?: any }) {
    const [form] = Form.useForm();
    const [isSecondModalVisible, setIsSecondModalVisible] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>('first');
    const [districtList, setDistrictList] = useState<District[] | []>([]);
    const [wardList, setWardList] = useState([]);
    const [formValues, setFormValues] = useState<FormValues>({});
    const { data } = useGetBookingQuery(customerId, {
        skip: !customerId,
    });
    const { data: timeFrameList } = useGetTimeFrameListQuery();
    const { data: departmentList } = useGetDepartmentListAllQuery();
    const { data: floorList } = useGetFloorListQuery();
    const { data: customerSourceList } = useGetCustomerSourceListQuery();
    const { data: allUser } = useGetAllUserQuery();
    const [createNurseProcess] = useCreateNurseProcessMutation();
    const [createDoctorProcess] = useCreateDoctorProcessMutation();

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
                reception: data?.reception_name,
            });
        }
    }, [data, form]);

    useEffect(() => {
        if (!open) {
            setActiveModal(null);
            form.resetFields(); // Reset form when closed
        } else {
            setActiveModal('first');
        }
    }, [open, form]);

    const onFinish = async () => {
        try {
            const secondModalValues = await form.validateFields(['department', 'floor', 'assigned_doctor']);
            const allValues = { ...formValues, ...secondModalValues };

            const nursePayload = {
                nearest_examination: formValues.nearest_examination || "",
                blood_presure: formValues.blood_presure || "",
                heart_beat: formValues.heart_beat || "",
                height: formValues.height ? Number(formValues.height) : null,
                weight: formValues.weight ? Number(formValues.weight) : null,
                breathing_beat: formValues.breathing_beat ? Number(formValues.breathing_beat) : null,
                booking: customerId,
                nurse: formValues.reception ? Number(formValues.reception) : null,
            };

            const nurseProcessResult = await createNurseProcess(nursePayload).unwrap();

            const nurseProcessId = nurseProcessResult.id;

            const doctorPayload = {
                assigned_doctor: allValues.assigned_doctor || 0,
                floor: allValues.floor || 0,
                department: allValues.department || 0,
                booking: customerId,
                nurse_process_id: nurseProcessId,
            };

            await createDoctorProcess(doctorPayload).unwrap();

            notification.success({
                placement: "bottomRight",
                message: "Gửi bác sĩ thăm khám thành công",
            });

            setActiveModal(null);
            onCancel();
        } catch (error: any) {
            console.error("Error creating processes:", error);

            if (error?.data?.error === "Không thể tạo dữ liệu của y tá vì booking khi khách hàng chưa đến.") {
                notification.error({
                    placement: "bottomRight",
                    message: "Lỗi",
                    description: "Không thể tạo dữ liệu của y tá vì khách hàng chưa đến lịch hẹn.",
                });
            } else {
                notification.error({
                    placement: "bottomRight",
                    message: "Đã xảy ra lỗi",
                    description: error?.data?.error || "Có lỗi xảy ra trong quá trình xử lý.",
                });
            }
        }
    };

    const handleSendToDoctor = async () => {
        try {
            // Xác thực và lưu trữ giá trị form từ modal đầu tiên
            const firstModalValues = await form.validateFields();
            setFormValues(firstModalValues); // Lưu trữ giá trị

            // Chuyển sang modal thứ hai
            setActiveModal('second');
        } catch (error) {
            console.error("Form validation failed:", error);
        }
    };

    const handleSecondModalSubmit = async () => {
        try {
            // Xác thực các trường form của modal thứ hai
            const secondModalValues = await form.validateFields(['department', 'floor', 'assigned_doctor']);

            // Kết hợp giá trị từ cả hai modal
            setFormValues(prevValues => ({
                ...prevValues,
                ...secondModalValues
            }));

            // Sau khi đã cập nhật formValues, gọi onFinish để gửi cả hai API
            await onFinish();
        } catch (error) {
            console.error("Form validation failed:", error);
        }
    };

    return (
        <>
            <Modal
                onCancel={onCancel}
                open={open && activeModal === 'first'}
                title="Yêu cầu trải nghiệm"
                footer={[
                    <Button key="cancel" onClick={onCancel}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleSendToDoctor}>
                        Gửi bác sĩ
                    </Button>,
                ]}
                width={1289}
                destroyOnClose
            >
                <Form layout='vertical' form={form}>
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
                        <Col span={8}>
                            <Form.Item
                                label="Ngày sinh"
                                name="birth"
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                            <Form.Item label="Lễ tân" name="">
                                <Input />
                            </Form.Item>
                            <Form.Item label="Y tá tiếp nhận" name="reception">
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
                        <Col span={8} key="phone-number">
                            <Form.Item
                                label="Số điện thoại"
                                name="mobile"
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
                    <hr />
                    <h3 className='text-[18px] font-bold mt-4'>Thông tin sức khoẻ</h3>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="nearest_examination" label="Các xét nghiệm đã có(gần nhất)">
                                <TextArea placeholder='Nhập các xét nghiệm' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="blood_presure" label="Huyết áp">
                                        <Input placeholder='Nhập huyết áp' />
                                    </Form.Item>
                                    <Form.Item name="height" label="Chiều cao">
                                        <Input placeholder='Nhập chiều cao' />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="heart_beat" label="Nhịp tim">
                                        <Input placeholder='Nhập nhịp tim' />
                                    </Form.Item>
                                    <Form.Item name="weight" label="Cân nặng">
                                        <Input placeholder='Nhập cân nặng' />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="breathing_beat" label="Nhịp thở">
                                <Input placeholder='Nhập nhịp thở' />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
            <Modal
                open={open && activeModal === 'second'}
                title="Thông tin gửi bác sĩ"
                onCancel={() => setIsSecondModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setActiveModal('first')}>
                        Quay lại
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleSecondModalSubmit}>
                        Gửi
                    </Button>,
                ]}
                width={1289}
            >
                <Form layout='vertical' form={form}>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item label="Chọn khoa" name="department">
                                <Select placeholder="Chọn khoa">
                                    {departmentList?.results.map((item: any) => (
                                        <Option key={item.id} value={item.id}>
                                            {item?.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Chọn phòng khám" name="floor">
                                <Select placeholder="Chọn phòng khám">
                                    {floorList?.results.map((item: any) => (
                                        <Option key={item.id} value={item.id}>
                                            {item?.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Chọn bác sĩ khám" name="assigned_doctor">
                                <Select placeholder='Chọn bác sĩ khám' >
                                    {allUser?.map((user: any) => (
                                        <Option key={user.id} value={user.id}>
                                            {user.full_name || `${user.first_name} ${user.last_name}`}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>

    )
}
