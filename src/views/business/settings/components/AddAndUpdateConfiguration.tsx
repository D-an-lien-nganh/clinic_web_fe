"use client";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Col,
  ColorPicker,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  TimePicker,
} from "antd";
import { useGetDepartmentListAllQuery } from "@/api/app_home/apiConfiguration";
import { handleAddAndUpdate } from "@/utils/handleAddAndUpdate";
import { generateRandomCode } from "@/utils/convert";

const Option = Select;

export default function AddAndUpdateConfiguration(props: {
  configData?: any;
  configId?: number;
  title: string;
  edit?: boolean;
  isTabs: string;
  useCreateMutation: () => any;
  useEditMutation: () => any;
}) {
  const {
    configData,
    configId,
    title,
    edit,
    isTabs,
    useCreateMutation,
    useEditMutation,
  } = props;
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { data: departmentListAll } = useGetDepartmentListAllQuery(undefined, {
    skip: isTabs !== "department" && !isModalOpen,
  });

  const [createItem, { isLoading: isLoadingAdd }] = useCreateMutation();
  const [editItem, { isLoading: isLoadingEdit }] = useEditMutation();
  const [rateLabel, setRateLabel] = useState<string>("Mức áp dụng");

  const handleChangeType = (value: string) => {
    if (value === "fixed") {
      setRateLabel("Mức áp dụng (VNĐ)");
    } else if (value === "percentage") {
      setRateLabel("Mức áp dụng (%)");
    } else {
      setRateLabel("Mức áp dụng");
    }
  };

  useEffect(() => {
    if (edit && configData?.type) {
      handleChangeType(configData.type);
    }
  }, [edit, configData]);

  const handleCancel = () => setIsModalOpen(false);
  const showModal = () => setIsModalOpen(true);

  useEffect(() => {
    if (edit && configData) {
      if (isTabs === "discount") {
        form.setFieldsValue({
          id: configId,
          code: configData.code,
          name: configData.name,
          note: configData.note,
          type: configData.type,
          rate: configData.rate,
          start_date: configData.start_date
            ? dayjs(configData.start_date)
            : null,
          end_date: configData.end_date ? dayjs(configData.end_date) : null,
        });
      } else if (isTabs === "commission") {
        form.setFieldsValue({
          percentage: configData.percentage,
          note: configData.note,
        });
      } else if (
        isTabs === "protocol" ||
        isTabs === "floor" ||
        isTabs === "department"
      ) {
        form.setFieldsValue({
          name: configData.name,
          code: configData.code,
          note: configData.note,
        });
      } else if (isTabs === "source" || isTabs === "unit") {
        form.setFieldsValue({
          name: configData.name,
          color: configData.color,
          note: configData.note,
        });
      } else if (isTabs === "position") {
        form.setFieldsValue({
          code: configData.code,
          title: configData.title,
          department: configData.department,
          performance_coefficient: configData.performance_coefficient,
        });
      } else if (isTabs === "treatment-package") {
        form.setFieldsValue({
          name: configData.name,
          value: configData.value,
          note: configData.note,
        });
      } else if (isTabs === "test-services") {
        form.setFieldsValue({
          code: configData.code,
          name: configData.name,
          note: configData.note,
          price: configData.price,
        });
      } else if (isTabs === "technical-settings") {
        form.setFieldsValue({
          type: configData.type,
          name: configData.name,
          note: configData.note,
          duration: configData.duration,
          price: configData.price,
        });
      }
    }
  }, [edit, configData, form, isTabs, configId, isModalOpen]);

  const onFinish = async (values: any) => {
    // Với discount: format ngày rồi SINH CODE nếu là Thêm mới
    if (isTabs === "discount") {
      values.start_date = values.start_date
        ? dayjs(values.start_date).format("YYYY-MM-DD")
        : null;
      values.end_date = values.end_date
        ? dayjs(values.end_date).format("YYYY-MM-DD")
        : null;
      if (!edit) {
        values.code = generateRandomCode(8);
      }
    }
    // Với time: tách time
    else if (isTabs === "time") {
      values.start = values.time?.[0]
        ? dayjs(values.time[0]).format("HH:mm:ss")
        : null;
      values.end = values.time?.[1]
        ? dayjs(values.time[1]).format("HH:mm:ss")
        : null;
    } else if (isTabs === "source" || isTabs === "unit") {
      values.color =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.() || null;
    } else if (isTabs === "test-services") {
      if (!edit) {
        values.code = generateRandomCode(8);
      }
    }
    handleAddAndUpdate({
      form: form,
      title: title?.toLowerCase(),
      setOpen: (value: boolean) => setIsModalOpen(value),
      addAndUpdateItem: () =>
        edit ? editItem(values).unwrap() : createItem(values).unwrap(),
      isEdit: edit,
    });
  };

  const renderFormByIsTabs = (isTabs: string) => {
    if (isTabs === "discount") {
      return (
        <>
          <Form.Item
            name="name"
            label="Tên giảm giá"
            rules={[{ required: true, message: "Vui lòng nhập tên giảm giá" }]}
          >
            <Input placeholder="Nhập tên giảm giá" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Loại giảm giá"
                name="type"
                rules={[
                  { required: true, message: "Vui lòng chọn loại giảm giá!" },
                ]}
              >
                <Select
                  placeholder="Chọn loại giảm giá"
                  onChange={handleChangeType}
                >
                  <Option value="fixed">Số tiền</Option>
                  <Option value="percentage">Phần trăm</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="rate"
                label={rateLabel}
                rules={[
                  { required: true, message: "Vui lòng nhập mức áp dụng" },
                ]}
              >
                <Input className="!w-full" placeholder="Nhập mức áp dụng" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày bắt đầu" name="start_date">
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày kết thúc" name="end_date">
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    } else if (isTabs === "commission") {
      return (
        <Form.Item
          name="percentage"
          label="Mức hoa hồng"
          rules={[{ required: true, message: "Vui lòng nhập mức hoa hồng" }]}
        >
          <InputNumber className="!w-full" />
        </Form.Item>
      );
    } else if (isTabs === "treatment-package") {
      return (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên gói liệu trình"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên gói liệu trình",
                  },
                ]}
              >
                <Input placeholder="Nhập tên gói"/>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="value"
                label="Giá trị"
                rules={[{ required: true, message: "Vui lòng số lượng buổi" }]}
              >
                <Input placeholder="Nhập số lượng buổi"/>
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    } else if (
      isTabs === "protocol" ||
      isTabs === "floor" ||
      isTabs === "department"
    ) {
      return (
        <>
          <Form.Item
            name="code"
            label={`Mã ${title}`}
            rules={[{ required: true, message: `Vui lòng nhập mã ${title}` }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label={`Tên ${title}`}
            rules={[{ required: true, message: `Vui lòng nhập tên ${title}` }]}
          >
            <Input />
          </Form.Item>
        </>
      );
    } else if (isTabs === "unit" || isTabs === "source") {
      return (
        <>
          <Form.Item
            name="name"
            label={title}
            rules={[{ required: true, message: `Vui lòng nhập ${title}!` }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="color" label="Màu sắc" initialValue="#993300">
            <ColorPicker format="hex" />
          </Form.Item>
        </>
      );
    } else if (isTabs === "time") {
      return (
        <Form.Item name="time" label="Thời gian">
          <TimePicker.RangePicker className="!w-full" />
        </Form.Item>
      );
    } else if (isTabs === "position") {
      return (
        <>
          <Form.Item
            name="code"
            label="Mã chức vụ"
            rules={[{ required: true, message: "Vui lòng nhập mã chức vụ" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="title"
            label="Tên chức vụ"
            rules={[{ required: true, message: "Vui lòng nhập tên chức vụ" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="performance_coefficient"
            label="Hệ số hiệu suất"
            rules={[
              { required: true, message: "Vui lòng nhập hệ số hiệu suất" },
            ]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="department"
            label="Phòng ban"
            rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
          >
            <Select placeholder="Chọn phòng ban">
              {departmentListAll?.results?.map(
                (item: { id: number; name: string }) => (
                  <Option key={item?.id} value={item?.id}>
                    {item?.name}
                  </Option>
                )
              )}
            </Select>
          </Form.Item>
        </>
      );
    } else if (isTabs === "test-services") {
      return (
        <>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Tên dịch vụ"
                rules={[
                  { required: true, message: "Vui lòng nhập tên dịch vụ" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    } else if (isTabs === "technical-settings") {
      return (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên kỹ thuật"
                rules={[
                  { required: true, message: "Vui lòng nhập tên kỹ thuật" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại trị liệu"
                rules={[
                  { required: true, message: "Vui lòng chọn loại trị liệu" },
                ]}
              >
                <Select placeholder="Chọn trị liệu">
                  <Option value="TLCB">Trị liệu chữa bệnh</Option>
                  <Option value="TLDS">Trị liệu dưỡng sinh</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="Thời gian thực hiện"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập thời gian thực hiện",
                  },
                ]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá hiệu suất"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập giá hiệu suất",
                  },
                ]}
              >
                <Input className="!w-full" min={0} step={1000} />
              </Form.Item>
            </Col>
          </Row>
        </>
      );
    }
  };

  return (
    <>
      <Button
        onClick={showModal}
        type="primary"
        size={edit ? "small" : "middle"}
      >
        {edit ? "Sửa" : "Thêm mới"}
      </Button>

      <Modal
        open={isModalOpen}
        onCancel={handleCancel}
        title={(edit ? "Sửa " : "Thêm mới ") + title}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          {edit && (
            <Form.Item name="id" initialValue={configId} hidden>
              <Input />
            </Form.Item>
          )}
          {renderFormByIsTabs(isTabs)}
          {isTabs !== "position" && isTabs !== "technical-settings" && (
            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea />
            </Form.Item>
          )}
          <Form.Item wrapperCol={{ span: 24 }} className="flex justify-end">
            <Button htmlType="button" className="mr-2" onClick={handleCancel}>
              Hủy
            </Button>
            <Button
              htmlType="submit"
              type="primary"
              loading={edit ? isLoadingEdit : isLoadingAdd}
            >
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
