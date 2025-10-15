
import React, { useEffect, useState } from "react";
import { useGetCustomerListQuery } from "@/api/app_customer/apiMarketing";
import { Button, Checkbox, Form, Modal, Select, TimePicker } from "antd";
import { useCreateBookingMutation, useEditBookingMutation } from "@/api/app_treatment/apiTreatment";
import { handleAddAndUpdate } from "@/utils/handleAddAndUpdate";
import dayjs from "dayjs";

interface PropType {
    edit?: boolean;
    data?: any;
    is_treatment: boolean;
    title: string;
    timeFrameData: any
}

export default function AddAndUpdateSchedule(props: PropType) {
    const { edit, data, is_treatment, title, timeFrameData } = props;
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const { data: customerData } = useGetCustomerListQuery();
    const [createBooking, { isLoading: isLoadingAdd }] = useCreateBookingMutation();
    const [editBooking, { isLoading: isLoadingEdit }] = useEditBookingMutation();

    const handleCancel = () => setIsModalOpen(false);
    const showModal = () => setIsModalOpen(true);

    useEffect(() => {
        if (edit && data) {
            form.setFieldsValue({
                customer: data.customer,
                note: dayjs(data.note, "HH:mm"),
                time_frame: data.time_frame,
                is_treatment: data.is_treatment,
            })
        }
    }, [edit, data, form])

    const onFinish = (values: any) => {
        if (edit) values.id = data.id;
        values.note = dayjs(values.note).format("HH:mm");
        values.is_treatment = is_treatment ? true : values.is_treatment;
        handleAddAndUpdate({
            form: form,
            title: title,
            setOpen: (value: boolean) => setIsModalOpen(value),
            addAndUpdateItem: () => edit ? editBooking(values).unwrap() : createBooking(values).unwrap(),
        })
    }

    return (
        <>
            <Button
                onClick={showModal}
                style={{
                    backgroundColor: "#BD8306",
                    color: "white",
                    border: "none",
                }}
                size={edit ? "small" : "middle"}
            >
                {edit ? "Sửa" : "Thêm lịch hẹn"}
            </Button>

            <Modal
                open={isModalOpen}
                onCancel={handleCancel}
                title="Đặt lịch"
                footer={null}
                width={500}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="Khách hàng"
                        name="customer"
                        rules={[{ required: true, message: "Vui lòng chọn khách hàng!" }]}
                    >
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={
                                customerData?.results?.filter(
                                    (i: { lead_status: number }) => i.lead_status === 5 || i.lead_status === 6)?.map(
                                        (i: { id: number, name: string }) => ({
                                            value: i.id,
                                            label: i.name,
                                        }))
                            }
                            placeholder="Chọn khách hàng"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Khung giờ"
                        name="time_frame"
                        rules={[{ required: true, message: "Vui lòng chọn khung giờ!" }]}
                    >
                        <Select
                            options={
                                timeFrameData?.results?.map((i: { id: number, start: string, end: string }) => ({
                                    value: i.id,
                                    label: i.start + " - " + i.end,
                                }))
                            }
                            placeholder="Chọn khung giờ"
                        />
                    </Form.Item>
                    <Form.Item label="Giờ hẹn đến" name="note" rules={[{ required: true, message: "Vui lòng chọn giờ hẹn đến!" }]}>
                        <TimePicker className="w-full" />
                    </Form.Item>
                    {!is_treatment &&
                        <Form.Item name="is_treatment" valuePropName="checked">
                            <Checkbox>Áp dụng với lịch trị liệu ?</Checkbox>
                        </Form.Item>
                    }
                    <Form.Item className="flex justify-end">
                        <Button htmlType="button" className="mr-2" onClick={handleCancel}>
                            Hủy
                        </Button>
                        <Button htmlType="submit" type="primary" loading={edit ? isLoadingEdit : isLoadingAdd}>
                            Xác nhận
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}