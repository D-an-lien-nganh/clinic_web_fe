import { useGetAllUserQuery } from "@/api/app_home/apiAccount";
import { useGetFloorListQuery } from "@/api/app_home/apiConfiguration";
import {
  useGetCustomerSocialListQuery,
  useGetCustomerSourceListQuery,
  useGetCustomerStatusListQuery,
} from "@/api/app_home/apiCustomerManagement";
import {
  useCreateReExaminationMutation,
  useEditBillsMutation,
  useEditTreatmentSessionMutation,
} from "@/api/app_treatment/apiTreatment";
import { locationData } from "@/constants/location";
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
  Table,
  TimePicker,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { ColumnsType } from "antd/es/table";
import { TableRowSelection } from "antd/es/table/interface";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";

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
}

interface DesignatedService {
  key: React.Key;
  id: number;
  service_name: string;
  service_type: string;
  treatment_sessions_done: string;
  service_unit: string;
  service_number: number;
}

export default function AddTherapy({
  open,
  onCancel,
  selectedRecord,
}: {
  open: boolean;
  onCancel: () => void;
  onFinish: (values: any) => void;
  selectedRecord: any | null;
}) {
  const [form] = Form.useForm();
  const [shouldFetch, setShouldFetch] = useState(false);
  const [districtList, setDistrictList] = useState<District[] | []>([]);
  const [wardList, setWardList] = useState([]);
  const [value, setValue] = useState("");
  const [selectedTreatmentRequestId, setSelectedTreatmentRequestId] = useState<
    string | null
  >(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: customerSourceList } = useGetCustomerSourceListQuery(
    undefined,
    { skip: !shouldFetch }
  );
  const { data: customerStatus } = useGetCustomerStatusListQuery(undefined, {
    skip: !shouldFetch,
  });
  const { data: userList } = useGetAllUserQuery();
  const { data: floorList } = useGetFloorListQuery();
  const { data: customerSocialList } = useGetCustomerSocialListQuery(
    undefined,
    { skip: !shouldFetch }
  );
  const [updateBills] = useEditBillsMutation();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [createReExam, { isLoading: isLoadingCreate }] =
    useCreateReExaminationMutation();

  const handleRowSelectionChange = (
    selectedKeys: React.Key[],
    selectedRows: any[]
  ) => {
    if (selectedRows.length > 0) {
      const row = selectedRows[0];
      const treatmentSessions = row?.treatment_sessions || [];
      const firstPendingSession = treatmentSessions.find(
        (session: any) => !session.is_done
      );

      if (firstPendingSession) {
        setSelectedRowKeys([firstPendingSession.id]);
        setSelectedTreatmentRequestId(row.treatmentRequestId);
      }
    } else {
      setSelectedRowKeys([]);
      setSelectedTreatmentRequestId(null);
    }
  };

  const rowSelection: TableRowSelection<any> = {
    type: "radio",
    selectedRowKeys,
    onChange: handleRowSelectionChange,
  };
  const dataSource = selectedRecord?.treatment_request?.map((request: any) => {
    console.log("Processing request:", request); // Kiểm tra dữ liệu
    return {
      key: request.id, // Đảm bảo id tồn tại và duy nhất
      ...request.service_details,
      treatmentRequestId: request.id,
      treatment_sessions: request.treatment_sessions || [],
    };
  }) || [];

  useEffect(() => {
    if (selectedRecord) {
      form.setFieldsValue({
        name: selectedRecord.customer_details?.name,
        gender: selectedRecord.customer_details?.gender,
        birth: selectedRecord.customer_details?.birth
          ? dayjs(selectedRecord.customer_details.birth)
          : null,
        mobile: selectedRecord.customer_details?.mobile,
        email: selectedRecord.customer_details?.email,
        address: selectedRecord.customer_details?.address,
        city: selectedRecord.customer_details?.city,
        district: selectedRecord.customer_details?.district,
        ward: selectedRecord.customer_details?.ward,
        source_name:
          selectedRecord.customer_details?.source_details?.source_name,
        source_link:
          selectedRecord.customer_details?.source_details?.source_link,
        introducer_name:
          selectedRecord.customer_details?.introducers?.[0]?.introducer_name ||
          "",
        receiving_day: selectedRecord.doctor_process_details
          ?.nurse_process_details.receiving_day
          ? dayjs(
            selectedRecord.doctor_process_details.nurse_process_details
              .receiving_day
          ).format("YYYY-MM-DD")
          : null,
        start_time: selectedRecord.doctor_process_details?.start_time
          ? dayjs(selectedRecord.doctor_process_details.start_time, "HH:mm:ss")
          : null,
        end_time: selectedRecord.doctor_process_details?.end_time
          ? dayjs(selectedRecord.doctor_process_details.end_time, "HH:mm:ss")
          : null,
        blood_presure:
          selectedRecord.doctor_process_details?.nurse_process_details
            ?.blood_presure,
        heart_beat:
          selectedRecord.doctor_process_details?.nurse_process_details
            ?.heart_beat,
        height:
          selectedRecord.doctor_process_details?.nurse_process_details?.height,
        weight:
          selectedRecord.doctor_process_details?.nurse_process_details?.weight,
        breathing_beat:
          selectedRecord.doctor_process_details?.nurse_process_details
            ?.breathing_beat,
        nearest_examination:
          selectedRecord.doctor_process_details?.nurse_process_details
            ?.nearest_examination,
        doctor: selectedRecord.doctor,
        diagnosis: selectedRecord.doctor_process_details?.diagnosis,
        medical_history: selectedRecord.doctor_process_details?.medical_history,
        assigned_doctor_name:
          selectedRecord.doctor_process_details?.assigned_doctor_name,
        present_symptom: selectedRecord.doctor_process_details?.present_symptom,
        service_name: selectedRecord.treatment_request[0]?.service_name,
        note: selectedRecord.note,
        nurse_fullname:
          selectedRecord.doctor_process_details?.nurse_process_details
            .nurse_fullname,
        type:
          selectedRecord.type === "both"
            ? "Cả hai"
            : selectedRecord.type === "service"
              ? "Dịch vụ"
              : "Sản phẩm",
      });
    }
  }, [selectedRecord, form]);

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * 10 + index + 1,
    },
    {
      key: "product_name",
      title: "Tên thuốc",
      dataIndex: "product_name",
      align: "center",
    },
    {
      key: "quantity",
      title: "Số lượng",
      dataIndex: "quantity",
      align: "center",
    },
    {
      key: "unit_str",
      title: "Đơn vị",
      dataIndex: "unit_str",
      align: "center",
    },
    {
      key: "dose",
      title: "Liều lượng",
      dataIndex: "dose",
      align: "center",
    },
    {
      key: "note",
      title: "Lưu ý",
      dataIndex: "note",
      align: "center",
    },
  ];

  const column: ColumnsType<DesignatedService> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * 10 + index + 1,
    },
    {
      key: "service_name",
      title: "Nội dung",
      dataIndex: "service_name",
      align: "center",
    },
    {
      key: "service_type",
      title: "Loại trị liệu",
      dataIndex: "service_type",
      align: "center",
    },
    {
      key: "service_number",
      title: "Số lượng",
      dataIndex: "service_number",
      align: "center",
    },
    {
      key: "service_unit",
      title: "Đơn vị",
      dataIndex: "service_unit",
      align: "center",
    },
    {
      key: "treatment_sessions_done",
      title: "Số buổi đã thực hiện",
      dataIndex: "treatment_sessions_done",
      align: "center",
    },
  ];

  const onFinish = async (values: any) => {
    // Find the selected service in the table
    const selectedService = dataSource.find((item: any) => item.key === selectedRowKeys[0]);

    if (!selectedService && selectedRowKeys.length > 0) {
      notification.error({
        message: "Không thể tìm thấy dịch vụ đã chọn",
        placement: "bottomRight",
      });
      return;
    }

    // Prepare data for bill update
    const billUpdateData = {
      id: selectedRecord.id,
      data: {
        treatment_request: selectedRecord.treatment_request.map((request: any) => {
          // Check if this is the selected request
          if (request.id === selectedTreatmentRequestId) {
            return {
              service_id: request.service_id, // Keep the original service_id
              user: values.designated_expert && values.designated_expert.length > 0 ?
                values.designated_expert[0] : null, // Take the first expert if multiple are selected
              floor: values.floor,
              note: values.note,
            };
          }
          // For non-selected requests, keep the original data
          return {
            service_id: request.service_id,
            user: request.user,
            floor: request.floor,
            note: request.note,
          };
        }),
      }
    };

    try {
      // Update bills with new treatment request data
      await updateBills(billUpdateData).unwrap();

      // Show success notification
      notification.success({
        message: "Cập nhật thành công",
        placement: "bottomRight",
      });

      // Reset form and close modal
      form.resetFields();
      onCancel();
    } catch (error) {
      notification.error({
        message: `Cập nhật thất bại`,
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      <Modal
        onCancel={onCancel}
        open={open}
        title="Yêu cầu trải nghiệm"
        footer={null}
        width={1289}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Họ tên khách hàng"
                name="name"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="Nguồn khách hàng"
                    name="source_name"
                    rules={[{ required: true }]}
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
                    name="type"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn trạng thái!",
                      },
                    ]}
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                  >
                    <Select placeholder="Chọn trạng thái" disabled>
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
              <Form.Item label="Giới tính" name="gender">
                <Radio.Group
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled
                >
                  <Radio value="MA">Nam</Radio>
                  <Radio value="FE">Nữ</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="Lễ tân" name="introducer_name">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày sinh" name="birth">
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  disabled
                />
              </Form.Item>
              <Form.Item label="Y tá tiếp nhận" name="nurse_fullname">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <hr />
          <h3 className="text-[18px] font-bold mt-4">Thông tin liên hệ</h3>
          <Row gutter={24}>
            <Col span={8} key="mobile">
              <Form.Item
                label="Số điện thoại"
                name="mobile"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" disabled />
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
                      placeholder={"Chọn Tỉnh / Thành phố"}
                      onChange={(value) =>
                        setDistrictList(
                          locationData?.filter(
                            (item: { Name: string }) => item.Name === value
                          )[0]?.Districts
                        )
                      }
                      disabled
                    >
                      {locationData?.map(
                        (item: { Id: string; Name: string }) => (
                          <Option key={item.Id} value={item.Name}>
                            {item.Name}
                          </Option>
                        )
                      )}
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
                      disabled
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
                <Col span={24} key="ward">
                  <Form.Item name="ward" className="mb-2">
                    <Select placeholder={"Chọn Phường / Xã"} disabled>
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
                    <Input placeholder="Nhập địa chỉ" disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={8} key="source_name">
              <Row gutter={24}>
                <Col span={10} key="source_name">
                  <Form.Item
                    label="Mạng xã hội"
                    name="source_name"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn mạng xã hội!",
                      },
                    ]}
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                  >
                    <Select placeholder="Chọn mạng xã hội" disabled>
                      {customerSocialList?.results?.map(
                        (social: { id: number; title: string }) => (
                          <Option key={social.id} value={social.id}>
                            {social.title}
                          </Option>
                        )
                      )}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={14} key="source_link">
                  <Form.Item
                    label=" "
                    name="source_link"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={24} key="receiving_day">
                  <Form.Item
                    label="Ngày tới khám"
                    name="receiving_day"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      placeholder="Chọn ngày tới khám"
                      disabled
                    />
                  </Form.Item>
                </Col>
              </Row>
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
                <TextArea disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="blood_presure" label="Huyết áp">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item name="height" label="Chiều cao">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="heart_beat" label="Nhịp tim">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item name="weight" label="Cân nặng">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col span={8}>
              <Form.Item name="breathing_beat" label="Nhịp thở">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <hr />
          <h3 className="text-[18px] font-bold mt-4">Khám lâm sàng</h3>
          <div>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Bác sĩ khám" name="doctor">
                  <Select placeholder="Chọn bác sĩ" disabled>
                    <Option key="1">Thống trị</Option>
                    <Option key="2">Bắc Long</Option>
                    <Option key="3">Cần giờ</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Chuẩn đoán" name="diagnosis">
                  <Input disabled />
                </Form.Item>
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="Bắt đầu khám"
                      name="start_time"
                    >
                      <TimePicker disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Kết thúc khám"
                      name="end_time"
                    >
                      <TimePicker disabled />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              <Col span={16}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label="Tiền sử bệnh" name="medical_history">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Triệu chứng bệnh hiện tại"
                      name="present_symptom"
                    >
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Table
                      bordered
                      columns={columns}
                      dataSource={
                        selectedRecord?.doctor_process_details
                          ?.diagnosis_medicines
                      }
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
          <br />
          <hr />
          <h3 className="text-[18px] font-bold mt-4">Dịch vụ trị liệu</h3>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Chuyên gia chỉ định"
                name="assigned_doctor_name"
              >
                <Input disabled />
              </Form.Item>
              <Form.Item label="Phương pháp trị liệu" name="treatment_method">
                <TextArea disabled />
              </Form.Item>
              <Form.Item label="Ghi chú" name="note">
                <TextArea />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Table
                rowSelection={rowSelection}
                bordered
                dataSource={dataSource}
                columns={column}
                pagination={false}
                footer={() => (
                  <div className="flex justify-between items-center px-4 py-2 w-full">
                    <span className="text-red-500 font-semibold">
                      Chọn ngày tái khám
                    </span>
                    <Form.Item name="appointment_date" style={{ margin: 0 }}>
                      <DatePicker
                        placeholder="Chọn ngày"
                        className="border-red-500 rounded-md h-8"
                      />
                    </Form.Item>
                  </div>
                )}
              />
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Chọn phòng thực hiện" name="floor">
                    <Select
                      placeholder="Chọn phòng"
                      options={floorList?.results.map(
                        (i: { id: number; name: string }) => ({
                          value: i.id,
                          label: i.name,
                        })
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Chuyên gia điều trị chữa bệnh"
                    name="designated_expert"
                  >
                    <Select
                      placeholder="Chọn chuyên gia"
                      mode="multiple"
                      allowClear
                      options={
                        userList && userList.length > 0
                          ? userList
                            .filter(
                              (user: {
                                user_profile: {
                                  type: string;
                                };
                              }) => user.user_profile?.type === "employee"
                            )
                            .map(
                              (user: {
                                user_profile: {
                                  id: number;
                                };
                                full_name: string;
                              }) => ({
                                value: user.user_profile.id,
                                label: user.full_name,
                              })
                            )
                          : []
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
          <div className="col-span-3 flex justify-end gap-5 items-center ">
            <Button key="cancel" onClick={onCancel}>
              Hủy
            </Button>
            <Button htmlType="submit" type="primary">
              Tiến hành trị liệu
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
