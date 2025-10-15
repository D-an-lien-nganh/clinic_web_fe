import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useGetSetupQuery } from "@/api/app_home/apiSetup";
import { locationData } from "@/constants/location";
import {
  Button,
  Checkbox,
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
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { ColumnsType } from "antd/es/table";
import {
  useGetCustomerSocialListQuery,
  useGetCustomerSourceListQuery,
  useGetCustomerStatusListQuery,
} from "@/api/app_home/apiCustomerManagement";
import { useGetAllUserQuery } from "@/api/app_home/apiAccount";
import {
  useCreateBillsMutation,
  useCreateServiceAssignMutation,
  useGetBookingQuery,
  useGetDoctorProcessListQuery,
  useGetNurseProcessListQuery,
} from "@/api/app_treatment/apiTreatment";
import {
  useGetDiscountListQuery,
  useGetTimeFrameListQuery,
  useGetUnitListQuery,
} from "@/api/app_home/apiConfiguration";
import { useGetServiceListQuery } from "@/api/app_product/apiService";
import { RiDeleteBin5Line } from "react-icons/ri";
import { CreateBillPayload } from "@/api/app_treatment/type";

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
  medicine_name: string;
  quantity: number;
  unit: number;
  dosage: string;
  note: string;
  price: number;
}

interface DesignatedService {
  key: React.Key;
  id: number;
  service: number;
  quantity: number;
  unit_str: number;
  price_str: string;
}

interface DesignatedServiceType {
  id: number;
  type?: string;
}

export default function AddWaitForExpertAdvice({
  open,
  onCancel,
  customerId,
}: {
  open: boolean;
  onCancel: () => void;
  customerId?: any;
}) {
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [selectedServices, setSelectedServices] = useState<DesignatedService[]>(
    []
  );
  const [districtList, setDistrictList] = useState<District[] | []>([]);
  const [wardList, setWardList] = useState([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<
    DesignatedServiceType[]
  >([]);

  const { data: customerSourceList } = useGetCustomerSourceListQuery();
  const { data: allUser } = useGetAllUserQuery();
  const { data } = useGetBookingQuery(customerId, {
    skip: !customerId,
  });
  const { data: timeFrameList } = useGetTimeFrameListQuery();
  const { data: serviceList } = useGetServiceListQuery({});
  const { data: unitList } = useGetUnitListQuery();
  const { data: discountList } = useGetDiscountListQuery();
  const { data: nurseList } = useGetNurseProcessListQuery();
  const { data: doctorStatusList } = useGetDoctorProcessListQuery();
  const [createServiceAssign] = useCreateServiceAssignMutation();
  const [createBill] = useCreateBillsMutation();
  const [medicineData, setMedicineData] = useState<DataType[]>([]);
  const [tableData, setTableData] = useState([
    {
      key: Date.now(),
      id: 1,
      service: 0,
      quantity: 0,
      unit_str: 0,
      price_str: "",
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
          service: 0,
          quantity: 0,
          unit_str: 0,
          price_str: "",
        },
      ]);
      setSelectedServices([]);
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
          service: 0,
          quantity: 0,
          unit_str: 0,
          price_str: "",
        },
      ]);
      setSelectedServices([]);
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
        reception: data?.reception_name,
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
            diagnosis: doctorProcess.diagnosis,
            medical_history: doctorProcess.medical_history,
            present_symptom: doctorProcess.present_symptom,
          });

          // Map the diagnosis_medicines to your table format
          if (
            doctorProcess.diagnosis_medicines &&
            doctorProcess.diagnosis_medicines.length > 0
          ) {
            const mappedMedicines = doctorProcess.diagnosis_medicines.map(
              (med: any, index: number) => ({
                key: index,
                id: med.id,
                product_name: med.product_name,
                quantity: med.quantity,
                unit: med.unit,
                dose: med.dose || "",
                note: med.note || "",
                price: med.price || 0,
              })
            );
            setMedicineData(mappedMedicines);
          }
        }
      }
    }
  }, [data, nurseList, customerId, form, doctorStatusList]);

  const onFinish = async () => {
    try {
      const values = await form.validateFields();

      // Lấy doctor_process_id nếu có
      let doctor_process_id: number | null = null;
      if (doctorStatusList?.results && customerId) {
        const doctorProcess = doctorStatusList.results.find(
          (process: any) => process.id === data?.doctor_details?.id
        );
        if (doctorProcess) doctor_process_id = doctorProcess.id;
      }

      // ----- 1) Payload chỉ định dịch vụ -----
      const serviceAssignData = {
        assigned_expert: values.assigned_expert,
        treatment_method: values.treatment_method,
        type: data?.classification === "experience" ? "experience" : "service",
        service_discount: values.service_discount || 0,
        doctor_process_id,
        diagnosis_services: tableData.map((item: any) => ({
          id: item.id,
          service: item.service,
          service_name:
            serviceList?.results?.find((s: any) => s.id === item.service)
              ?.name ?? "",
          quantity: item.quantity,
          unit_str:
            unitList?.results?.find((u: any) => u.id === item.unit_str)?.name ??
            "",
          price_str: item.price_str,
        })),
      };

      // (nếu sau này bạn cần tạo phác đồ từ đây, làm riêng sau khi có bill.id)
      // const treatmentRequests = tableData
      //   .filter((item: any) => item.service > 0)
      //   .map((item: any) => ({ service_id: item.service }));

      // ----- 2) Payload tạo Bill (hợp lệ) -----
      if (!customerId) {
        notification.error({
          message: "Thiếu thông tin",
          description: "Không có customerId",
          placement: "topRight",
        });
        return;
      }

      const billData: CreateBillPayload = {
        customer: Number(customerId), // ✅ bắt buộc
        method: "cash", // hoặc "transfer" nếu giao diện chọn
        paid_ammount: 0, // tuỳ nghiệp vụ
        note: values?.bill_note ?? null, // nếu có field ghi chú
      };

      // ----- 3) Gọi API -----
      const [serviceAssignRes, billRes] = await Promise.all([
        createServiceAssign(serviceAssignData).unwrap(),
        createBill(billData).unwrap(),
      ]);

      // Nếu cần billId để tạo phác đồ => dùng billRes.id ở đây
      // ví dụ:
      // const billId = billRes.id;
      // await createTreatmentRequest({ bill: billId, ... }).unwrap();

      notification.success({
        message: "Thành công",
        description: "Gửi sang quy trình điều trị thành công!",
        placement: "topRight",
      });
      onCancel();
    } catch (error: any) {
      notification.error({
        message: "Thất bại",
        description:
          error?.data?.detail ||
          error?.data?.error ||
          "Có lỗi xảy ra khi xử lý yêu cầu!",
        placement: "topRight",
      });
      console.error("API error:", error);
    }
  };

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      width: 45,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * 10 + index + 1,
    },
    {
      title: "Tên thuốc",
      dataIndex: "product_name",
      align: "center",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      align: "center",
    },

    {
      title: "Đơn vị",
      dataIndex: "unit",
      align: "center",
    },
    {
      title: "Liều lượng",
      dataIndex: "dose",
      align: "center",
    },
    {
      title: "Lưu ý",
      dataIndex: "note",
      align: "center",
    },
    {
      title: "Số tiền(VND)",
      dataIndex: "price",
      align: "center",
      render: (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VNĐ";
      },
    },
  ];

  const getFilteredServices = () => {
    if (data?.classification === "service") {
      return serviceList?.results || [];
    }

    if (data?.classification === "experience") {
      if (!serviceList?.results || !selectedServiceTypes.length) {
        return [];
      }

      return serviceList.results.filter((service: any) =>
        selectedServiceTypes.includes(service.type)
      );
    }

    // Trường hợp mặc định
    return serviceList?.results || [];
  };
  const handleServiceTypeChange = (checkedValues: any) => {
    setSelectedServiceTypes(checkedValues);
  };

  const generateColumns = (): ColumnsType<DesignatedService> => [
    {
      title: "STT",
      dataIndex: "id",
      align: "center",
      render: (_, __, index) => <div>{index + 1}</div>,
    },
    {
      title: "Dịch vụ",
      dataIndex: "service",
      align: "center",
      render: (_, record) => (
        <Select
          value={record.service}
          onChange={(value) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.id === record.id ? { ...item, service: value } : item
              )
            )
          }
          style={{ width: 200 }}
          options={getFilteredServices().map((product: any) => ({
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
      dataIndex: "unit_str",
      align: "center",
      render: (_, record) => (
        <Select
          placeholder="Chọn đơn vị"
          value={record.unit_str}
          onChange={(value) =>
            setTableData((prev) =>
              prev.map((item: any) =>
                item.key === record.key ? { ...item, unit_str: value } : item
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
      title: "Số tiền(VND)",
      dataIndex: "price_str",
      align: "center",
      render: (_, record) => (
        <Input
          placeholder="Nhập số tiền"
          value={record.price_str}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.key === record.key
                  ? { ...item, price_str: e.target.value }
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
        <Button key="submit" type="primary" onClick={form.submit}>
          Gửi lễ tân
        </Button>,
      ]}
      width={1289}
      destroyOnClose
    >
      <Form
        layout="vertical"
        form={form}
        className="space-y-4"
        onFinish={onFinish}
      >
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
                  <DatePicker
                    format="DD/MM/YYYY HH:mm"
                    showTime={{ format: "HH:mm" }}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày giờ khám"
                  />
                </Form.Item>
                <Form.Item label="Kết thúc khám" name="end_time">
                  <DatePicker
                    format="DD/MM/YYYY HH:mm"
                    showTime={{ format: "HH:mm" }}
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày giờ kết thúc"
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label="Tiền sử bệnh" name="medical_history">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Chuẩn đoán" name="diagnosis">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Triệu chứng bệnh hiện tại"
                      name="present_symptom"
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Table
                      columns={columns}
                      dataSource={medicineData}
                      rowKey="key"
                      pagination={false}
                      bordered
                      footer={() => {
                        // Calculate the total price of all medicines
                        const totalPrice = medicineData.reduce(
                          (sum, item) => sum + (Number(item.price) || 0),
                          0
                        );

                        // Calculate discount amount
                        const discountPercent =
                          form.getFieldValue("medicine_discount_percent") || 0;
                        const discountAmount =
                          totalPrice * (discountPercent / 100);

                        // Calculate final price after discount
                        const finalPrice = totalPrice - discountAmount;

                        // Format function to ensure consistency
                        const formatCurrency = (value: any) => {
                          return (
                            Number(value)
                              .toString()
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VNĐ"
                          );
                        };

                        return (
                          <div className="border-t">
                            <Row gutter={24} className="py-2" align="middle">
                              <Col span={4} className="font-medium">
                                Tổng tiền:
                              </Col>
                              <Col span={12} className=""></Col>
                              <Col
                                span={8}
                                className="text-right font-medium text-lg"
                              >
                                {formatCurrency(totalPrice)}
                              </Col>
                            </Row>

                            <Row gutter={24} className="py-2" align="middle">
                              <Col span={4} className="font-medium">
                                Tổng tiền giảm:
                              </Col>
                              <Col span={12} className=""></Col>
                              <Col
                                span={8}
                                className="text-right font-medium text-lg"
                              >
                                {formatCurrency(discountAmount)}
                              </Col>
                            </Row>

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
                                className="text-right font-medium text-lg"
                              >
                                {formatCurrency(finalPrice)}
                              </Col>
                            </Row>
                          </div>
                        );
                      }}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
            <br />
            <hr />
            <h3 className="text-[18px] font-bold mt-4">Dịch vụ trị liệu</h3>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Chuyên gia chỉ định" name="assigned_expert">
                  <Select placeholder="Chọn chuyên gia">
                    {allUser?.map((user: any) => (
                      <Option key={user.id} value={user.id}>
                        {user.full_name ||
                          `${user.first_name} ${user.last_name}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Phương pháp điều trị" name="treatment_method">
                  <TextArea />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Table
                  bordered
                  columns={generateColumns()}
                  pagination={false}
                  dataSource={tableData}
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
                              service: 0,
                              quantity: 0,
                              unit_str: 0,
                              price_str: "",
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
                                (sum, item) => sum + Number(item.price_str),
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
                            <Form.Item name="service_discount">
                              <Select placeholder="Chọn khuyến mại">
                                {discountList?.results?.map((discount: any) => (
                                  <Select.Option
                                    key={discount.id}
                                    value={discount.id}
                                  >
                                    {discount.name} ({discount.code})
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

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
                            {tableData
                              .reduce(
                                (sum, item) => sum + Number(item.price_str),
                                0
                              )
                              .toLocaleString()}{" "}
                            VNĐ
                          </Col>
                        </Row>
                      </div>
                    </div>
                  )}
                />
                <Row gutter={24}>
                  <Col span={7}>Tổng hoá đơn</Col>
                  <Col span={10}></Col>
                  <Col span={6}>10000000</Col>
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
            <hr />
            <h3 className="text-[18px] font-bold mt-4">Gói trải nghiệm</h3>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Chuyên gia chỉ định" name="assigned_expert">
                  <Select placeholder="Chọn chuyên gia">
                    {allUser?.map((user: any) => (
                      <Option key={user.id} value={user.id}>
                        {user.full_name ||
                          `${user.first_name} ${user.last_name}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Chọn dịch vụ trải nghiệm"
                  name="service_types"
                >
                  <Checkbox.Group onChange={handleServiceTypeChange}>
                    <Row>
                      <Col span={24}>
                        <Checkbox value="TLCB">Trị liệu chữa bệnh</Checkbox>
                      </Col>
                      <Col span={24}>
                        <Checkbox value="TLDS">Trị liệu dưỡng sinh</Checkbox>
                      </Col>
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
                <Form.Item label="Ghi chú" name="treatment_method">
                  <TextArea />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Table
                  bordered
                  columns={generateColumns()}
                  pagination={false}
                  dataSource={tableData}
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
                              service: 0,
                              quantity: 0,
                              unit_str: 0,
                              price_str: "",
                            },
                          ])
                        }
                        block
                      >
                        + Thêm
                      </Button>
                    </div>
                  )}
                />
              </Col>
            </Row>
          </div>
        )}
      </Form>
    </Modal>
  );
}
