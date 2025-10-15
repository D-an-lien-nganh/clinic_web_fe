import { useGetAllUserQuery } from "@/api/app_home/apiAccount";
import {
  useGetDiscountListQuery,
  useGetTimeFrameListQuery,
  useGetUnitListQuery,
} from "@/api/app_home/apiConfiguration";
import {
  useGetCustomerSocialListQuery,
  useGetCustomerSourceListQuery,
  useGetCustomerStatusListQuery,
} from "@/api/app_home/apiCustomerManagement";
import { useGetSetupQuery } from "@/api/app_home/apiSetup";
import { useGetProductListQuery } from "@/api/app_product/apiService";
import {
  useEditBookingMutation,
  useEditDoctorProcessMutation,
  useGetBookingQuery,
  useGetDoctorProcessListQuery,
  useGetNurseProcessListQuery,
  useUpdateStatusBookingMutation,
} from "@/api/app_treatment/apiTreatment";
import { locationData } from "@/constants/location";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Table,
  TimePicker,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { RiDeleteBin5Line } from "react-icons/ri";
import { start } from "repl";

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
  product: string;
  quantity: number;
  unit: number;
  dose: string;
  note: string;
  price: number;
}

export default function AddWaitingForDoctor({
  open,
  onCancel,
  customerId,
}: {
  open: boolean;
  onCancel: () => void;
  customerId: any;
}) {
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [districtList, setDistrictList] = useState<District[] | []>([]);
  const [wardList, setWardList] = useState([]);
  const { data: doctorStatusList } = useGetDoctorProcessListQuery();
  const { data: customerSourceList } = useGetCustomerSourceListQuery();
  const { data: nurseList } = useGetNurseProcessListQuery();
  const { data: allUser } = useGetAllUserQuery();
  const { data } = useGetBookingQuery(customerId, {
    skip: !customerId,
  });
  const { data: discountList } = useGetDiscountListQuery();
  const { data: unitList } = useGetUnitListQuery();
  const { data: timeFrameList } = useGetTimeFrameListQuery();
  const { data: productList } = useGetProductListQuery({});
  const [updateDoctorProcess] = useEditDoctorProcessMutation();
  const [updateStausBooking] = useUpdateStatusBookingMutation();
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    total: 0,
  });
  const [tableData, setTableData] = useState([
    {
      key: Date.now(),
      id: 1,
      product: "",
      quantity: 0,
      unit: 0,
      dose: "",
      note: "",
      price: 0,
    },
  ]);

  useEffect(() => {
    if (customerId && open) {
      // Reset form first to clear previous data
      form.resetFields();

      // Reset other state to default
      setTableData([
        {
          key: Date.now(),
          id: 1,
          product: "",
          quantity: 0,
          unit: 0,
          dose: "",
          note: "",
          price: 0,
        },
      ]);
      setDistrictList([]);
      setWardList([]);
    }
  }, [customerId, form, open]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setTableData([
        {
          key: Date.now(),
          id: 1,
          product: "",
          quantity: 0,
          unit: 0,
          dose: "",
          note: "",
          price: 0,
        },
      ]);
      setDistrictList([]);
      setWardList([]);
    }
  }, [open, form]);

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...data,
        appointment_time: data.appointment_time
          ? dayjs(data.appointment_time)
          : null,
        actual_arrival_time: data.actual_arrival_time
          ? dayjs(data.actual_arrival_time)
          : null,
        birth: data.customer_info?.birth
          ? dayjs(data.customer_info.birth)
          : null,
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
        rereception: data?.nurse_details?.nurse_fullname,
      });

      // Then check if there's matching nurse process data and set it
      if (nurseList?.results && customerId) {
        const nurseProcess = nurseList.results.find(
          (process: any) => process.booking === customerId
        );

        if (nurseProcess) {
          form.setFieldsValue({
            blood_presure: nurseProcess.blood_presure,
            heart_beat: nurseProcess.heart_beat,
            height: nurseProcess.height,
            weight: nurseProcess.weight,
            breathing_beat: nurseProcess.breathing_beat,
            nearest_examination: nurseProcess.nearest_examination,
            reception: nurseProcess.nurse,
          });
        }
      }
      // Tìm thông tin bác sĩ cho booking này
      if (doctorStatusList?.results && customerId) {
        const doctorProcess = doctorStatusList.results.find(
          (process: any) => process.id === data?.doctor_details?.id
        );

        if (doctorProcess) {
          form.setFieldsValue({
            assigned_doctor: doctorProcess.assigned_doctor,
          });
        }
      }
    }
  }, [data, nurseList, customerId, form, doctorStatusList]);

  useEffect(() => {
    const subtotal = tableData.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );
    const selectedDiscount = form.getFieldValue("medicine_discount");
    const discountInfo = discountList?.results?.find(
      (d: any) => d.id === selectedDiscount
    );

    let discountAmount = 0;
    if (discountInfo) {
      if (discountInfo.type === "percentage") {
        discountAmount = subtotal * (discountInfo.rate / 100);
      } else if (discountInfo.type === "fixed") {
        discountAmount = discountInfo.rate;
      }
    }

    const total = subtotal - discountAmount;

    setTotals({
      subtotal,
      discount: discountAmount,
      total,
    });
  }, [tableData, form.getFieldValue("medicine_discount"), discountList]);

  const onFinish = async () => {
    const values = await form.validateFields();

    // Create basic payload
    const payload = {
      medical_history: values?.medical_history,
      present_symptom: values?.present_symptom,
      diagnosis: values?.diagnosis,
      start_time: values?.start_time
        ? dayjs(values?.start_time).format("YYYY-MM-DDTHH:mm:ss")
        : null,
      end_time: values?.end_time
        ? dayjs(values?.end_time).format("YYYY-MM-DDTHH:mm:ss")
        : null,
    };

    if (data?.classification === "service") {
      const medicinesData = tableData
        .filter((item) => item.product) // Only include rows with a product specified
        .map((item) => ({
          product: Number(item.product) || 0,
          quantity: Number(item.quantity) || 0,
          unit: Number(item.unit) || 0,
          dose: item.dose || "",
          note: item.note || "",
          price: String(item.price) || "0",
        }));
      (payload as any).diagnosis_medicines = medicinesData;
      (payload as any).medicine_discount = values?.medicine_discount || 0;
    }

    const doctorProcess = doctorStatusList?.results?.find(
      (process: any) => process.id === data?.doctor_details?.id
    );
    const doctorProcessId = doctorProcess?.id;

    const bookingPayload = {
      id: data?.id, // Assuming data contains the booking ID
      status: "waiting_for_assign",
    };

    try {
      await Promise.all([
        updateDoctorProcess({
          id: Number(doctorProcessId),
          data: payload,
        }).unwrap(),
        updateStausBooking(bookingPayload).unwrap(),
      ]);
      notification.success({
        message: "Gửi sang chờ chuyên gia chỉ định thành công",
        placement: "bottomRight",
      });
      onCancel();
    } catch (error: any) {
      notification.error({
        message: "Cập nhật thất bại",
        description: error?.data?.message || "Có lỗi xảy ra",
        placement: "top",
      });
    }
  };

  const generateColumns = (): ColumnsType<DataType> => [
    {
      title: "STT",
      dataIndex: "id",
      align: "center",
      render: (_, __, index) => <div>{index + 1}</div>,
    },
    {
      title: "Tên thuốc",
      dataIndex: "product",
      align: "center",
      render: (_, record) => (
        <Select
          value={record.product} // Lưu id của sản phẩm
          onChange={(value) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.id === record.id
                  ? { ...item, product: value } // Cập nhật ID thay vì name
                  : item
              )
            )
          }
          style={{ width: 200 }}
          options={productList?.results.map((product: any) => ({
            value: product.id,
            label: product.name,
          }))}
        />
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      align: "center",
      render: (_, record) => (
        <Input
          placeholder="Nhập số lượng"
          type="number"
          min={1}
          value={record.quantity}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item: any) =>
                item.key === record.key
                  ? { ...item, quantity: Number(e.target.value) }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      align: "center",
      render: (_, record) => (
        <Select
          placeholder="Chọn đơn vị"
          value={record.unit}
          onChange={(value) =>
            setTableData((prev) =>
              prev.map((item: any) =>
                item.key === record.key ? { ...item, unit: value } : item
              )
            )
          }
          style={{ width: 120 }}
        >
          {unitList?.results?.map((unit: any) => (
            <Select.Option key={unit.id} value={unit.id}>
              {unit.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Liều lượng",
      dataIndex: "dose",
      align: "center",
      render: (_, record) => (
        <Input
          placeholder="Nhập liều lượng"
          value={record.dose}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.key === record.key
                  ? { ...item, dose: e.target.value }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: "Lưu ý",
      dataIndex: "note",
      align: "center",
      render: (_, record) => (
        <Input
          placeholder="Nhập lưu ý"
          value={record.note}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.key === record.key
                  ? { ...item, note: e.target.value }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: "Số tiền(VND)",
      dataIndex: "price",
      align: "center",
      render: (_, record) => (
        <Input
          placeholder="Nhập số tiền"
          value={record.price}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item: any) =>
                item.key === record.key
                  ? { ...item, price: e.target.value }
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
          style={{ fontSize: "20px" }}
          danger
          onClick={() =>
            setTableData((prev) =>
              prev.filter((item) => item.key !== record.key)
            )
          }
        >
          <RiDeleteBin5Line style={{ fontSize: "20px" }} />
        </Button>
      ),
    },
  ];

  return (
    <Modal
      onCancel={onCancel}
      open={open}
      title="Yêu cầu trải nghiệm"
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={onFinish}>
          Gửi chuyên gia
        </Button>,
      ]}
      width={1289}
      destroyOnClose
    >
      <Form layout="vertical" form={form} className="w-full">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              label="Họ tên khách hàng"
              name="name"
              rules={[{ required: true }]}
            >
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
              label="Nguồn khách hàng"
              name="source"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn nguồn khách hàng!",
                },
              ]}
            >
              <Select placeholder="Chọn nguồn khách hàng">
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
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Giới tính" name="gender">
              <Radio.Group>
                <Radio value="MA">Nam</Radio>
                <Radio value="FE">Nữ</Radio>
                <Radio value="OT">Khác</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="Người tiếp thị"
              name="marketer"
              rules={[
                { required: true, message: "Vui lòng chọn người tiếp thị!" },
              ]}
            >
              <Select placeholder="Chọn người tiếp thị">
                {allUser?.map((user: any) => (
                  <Option key={user.id} value={user.id}>
                    {user.full_name || `${user.first_name} ${user.last_name}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Ngày sinh" name="birth">
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Lễ tân" name="">
              <Input />
            </Form.Item>
            <Form.Item label="Y tá tiếp nhận" name="reception">
              <Select placeholder="Chọn y tá tiếp nhận">
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
        <h3 className="text-[18px] font-bold mt-4">Thông tin liên hệ</h3>
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
                      setDistrictList(
                        locationData?.filter(
                          (item: { Name: string }) => item.Name === value
                        )[0]?.Districts
                      )
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
                      setWardList(
                        (
                          districtList?.filter(
                            (item: any) => item.Name === value
                          )[0] as any
                        )?.Wards
                      )
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
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Chọn hẹn đến"
              />
            </Form.Item>
            <Form.Item label="Chọn khung giờ" name="time_frame">
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
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </Col>
        </Row>
        <hr />
        <h3 className="text-[18px] font-bold mt-4">Thông tin sức khoẻ</h3>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="nearest_examination"
              label="Các xét nghiệm đã có(gần nhất)"
            >
              <TextArea placeholder="Nhập các xét nghiệm" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="blood_presure" label="Huyết áp">
                  <Input placeholder="Nhập huyết áp" />
                </Form.Item>
                <Form.Item name="height" label="Chiều cao">
                  <Input placeholder="Nhập chiều cao" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="heart_beat" label="Nhịp tim">
                  <Input placeholder="Nhập nhịp tim" />
                </Form.Item>
                <Form.Item name="weight" label="Cân nặng">
                  <Input placeholder="Nhập cân nặng" />
                </Form.Item>
              </Col>
            </Row>
          </Col>
          <Col span={8}>
            <Form.Item name="breathing_beat" label="Nhịp thở">
              <Input placeholder="Nhập nhịp thở" />
            </Form.Item>
          </Col>
        </Row>
        <hr />
        <h3 className="text-[18px] font-bold mt-4">Khám lâm sàng</h3>
        {data?.classification === "service" && (
          <div>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Chọn bác sĩ khám" name="assigned_doctor">
                  <Select placeholder="Chọn bác sĩ khám">
                    {allUser?.map((user: any) => (
                      <Option key={user.id} value={user.id}>
                        {user.full_name ||
                          `${user.first_name} ${user.last_name}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Bắt đầu khám" name="start_time">
                  <TimePicker
                    format="HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Chọn giờ khám"
                  />
                </Form.Item>
                <Form.Item label="Kết thúc khám" name="end_time">
                  <TimePicker
                    format="HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Chọn giờ kết thúc"
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label="Tiền sử bệnh" name="medical_history">
                      <Input placeholder="Nhập tiền sử bệnh" />
                    </Form.Item>
                    <Form.Item label="Chuẩn đoán" name="diagnosis">
                      <TextArea placeholder="Nhập chuẩn đoán" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Triệu chứng bệnh hiện tại"
                      name="present_symptom"
                    >
                      <Input placeholder="Nhập triệu chứng bệnh hiện tại" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Table
                      columns={generateColumns()}
                      dataSource={tableData}
                      rowKey="key"
                      pagination={false}
                      bordered
                      footer={() => (
                        <div className="space-y-4">
                          <Button
                            type="dashed"
                            style={{ color: "#BD8306" }}
                            onClick={() =>
                              setTableData((prev) => [
                                ...prev,
                                {
                                  key: Date.now(),
                                  id: prev.length + 1,
                                  product: "",
                                  quantity: 0,
                                  unit: 0,
                                  dose: "",
                                  note: "",
                                  price: 0,
                                },
                              ])
                            }
                            block
                          >
                            + Thêm
                          </Button>

                          <div className="mt-6 border-t pt-4">
                            <Row gutter={24} className="py-2" align="middle">
                              <Col span={4} className="font-medium">
                                Tổng tiền:
                              </Col>
                              <Col span={12} className=""></Col>
                              <Col
                                span={8}
                                className="text-right font-medium text-lg"
                              >
                                {tableData
                                  .reduce(
                                    (sum, item) =>
                                      sum + Number(item.price || 0),
                                    0
                                  )
                                  .toLocaleString()}{" "}
                                VNĐ
                              </Col>
                            </Row>

                            <Row gutter={24} className="py-2" align="middle">
                              <Col span={4} className="font-medium">
                                Chọn khuyến mại:
                              </Col>
                              <Col span={12} className=""></Col>
                              <Col span={8}>
                                <Form.Item name="medicine_discount" noStyle>
                                  <Select
                                    placeholder="Chọn khuyến mại"
                                    onChange={(value) => {
                                      // Calculate new discount when selection changes
                                      const subtotal = tableData.reduce(
                                        (sum, item) =>
                                          sum + Number(item.price || 0),
                                        0
                                      );
                                      const discountInfo =
                                        discountList?.results?.find(
                                          (d: any) => d.id === value
                                        );

                                      let discountAmount = 0;
                                      if (discountInfo) {
                                        if (
                                          discountInfo.type === "percentage"
                                        ) {
                                          discountAmount =
                                            subtotal *
                                            (discountInfo.rate / 100);
                                        } else if (
                                          discountInfo.type === "fixed"
                                        ) {
                                          discountAmount = discountInfo.rate;
                                        }
                                      }

                                      setTotals({
                                        subtotal,
                                        discount: discountAmount,
                                        total: subtotal - discountAmount,
                                      });
                                    }}
                                  >
                                    <Option value={null}>
                                      Không áp dụng khuyến mại
                                    </Option>
                                    {discountList?.results?.map(
                                      (discount: any) => (
                                        <Select.Option
                                          key={discount.id}
                                          value={discount.id}
                                        >
                                          {discount.name}
                                        </Select.Option>
                                      )
                                    )}
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* Show discount amount row only if discount is applied */}
                            {totals.discount > 0 && (
                              <Row gutter={24} className="py-2" align="middle">
                                <Col span={4} className="font-medium">
                                  Tiền chiết khấu:
                                </Col>
                                <Col span={12} className=""></Col>
                                <Col
                                  span={8}
                                  className="text-right font-medium text-lg text-red-500"
                                >
                                  -{totals.discount.toLocaleString()} VNĐ
                                </Col>
                              </Row>
                            )}

                            <Row
                              gutter={24}
                              className="py-3 mt-2 border-t"
                              align="middle"
                            >
                              <Col span={4} className="font-medium text-lg">
                                Thành tiền:
                              </Col>
                              <Col span={12} className=""></Col>
                              <Col
                                span={8}
                                className="text-right font-bold text-xl"
                                style={{ color: "#BD8306" }}
                              >
                                {(
                                  totals.subtotal - totals.discount
                                ).toLocaleString()}{" "}
                                VNĐ
                              </Col>
                            </Row>
                          </div>
                        </div>
                      )}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        )}
        {data?.classification === "experience" && (
          <div>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Chọn bác sĩ khám" name="assigned_doctor">
                  <Select placeholder="Chọn bác sĩ khám">
                    {allUser?.map((user: any) => (
                      <Option key={user.id} value={user.id}>
                        {user.full_name ||
                          `${user.first_name} ${user.last_name}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Chuẩn đoán" name="diagnosis">
                  <TextArea placeholder="Nhập chuẩn đoán" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Tiền sử bệnh" name="medical_history">
                  <TextArea placeholder="Nhập tiền sử bệnh" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Triệu chứng bệnh hiện tại"
                  name="present_symptom"
                >
                  <TextArea placeholder="Nhập triệu chứng bệnh hiện tại" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}
      </Form>
    </Modal>
  );
}
