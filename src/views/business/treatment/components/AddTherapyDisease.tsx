import {
  useGetCustomerSocialListQuery,
  useGetCustomerSourceListQuery,
  useGetCustomerStatusListQuery,
} from "@/api/app_home/apiCustomerManagement";
import { useGetSetupQuery } from "@/api/app_home/apiSetup";
import { useGetAllTechnicalSettingListQuery } from "@/api/app_product/apiService";
import { useEditTreatmentSessionMutation } from "@/api/app_treatment/apiTreatment";
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
  TimePicker,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { BiPlusCircle, BiTrash } from "react-icons/bi";

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

interface DesignatedService {
  key: React.Key;
  id: number;
  content: string;
  treatment_day: string;
  came_for_treatment: boolean;
}

interface DataType {
  id: number;
  name: string;
  user: number;
}

export default function AddTherapyDisease({
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
  const [value, setValue] = useState("");
  const [isFirstModalVisible, setIsFirstModalVisible] = useState(open);

  const [districtList, setDistrictList] = useState<District[] | []>([]);
  const [wardList, setWardList] = useState([]);

  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<
    { id: number; is_done: boolean }[]
  >([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const { data: techList } = useGetAllTechnicalSettingListQuery();
  const { data: customerSourceList } = useGetCustomerSourceListQuery(
    undefined,
    { skip: !shouldFetch }
  );
  const { data: customerStatus } = useGetCustomerStatusListQuery(undefined, {
    skip: !shouldFetch,
  });
  const { data: customerSocialList } = useGetCustomerSocialListQuery(
    undefined,
    { skip: !shouldFetch }
  );
  const [UpdateTreatmentSession, { isLoading: isLoadingUpdate }] =
    useEditTreatmentSessionMutation();

  const findFirstPendingTreatmentSession = (selectedRecord: any) => {
    const tlcbRequest = selectedRecord.treatment_request.find(
      (request: any) => request.service_name === "TLCB"
    );

    const firstPendingSession = tlcbRequest?.treatment_sessions.find(
      (session: any) => !session.is_done
    );

    const { designated_experts, note, floor, floor_name, id } =
      firstPendingSession;

    return {
      id,
      designated_experts,
      note,
      floor,
      floor_name,
    };
  };

  useEffect(() => {
    if (selectedRecord) {
      const session = findFirstPendingTreatmentSession(selectedRecord);
      setSessionInfo(session);
      form.setFieldsValue({
        floor: sessionInfo?.floor_name,
        designated_experts: sessionInfo?.designated_experts?.map(
          (expert: any) => expert.full_name
        ),
        note: sessionInfo?.note,
        name: selectedRecord.customer_details?.name,
        gender: selectedRecord.customer_details?.gender,
        date_of_birth: selectedRecord.customer_details?.date_of_birth
          ? dayjs(selectedRecord.customer_details.date_of_birth)
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
        appointment_time: selectedRecord.booking_detail?.receiving_day
          ? dayjs(selectedRecord.booking_detail.receiving_day)
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
        present_symptom: selectedRecord.doctor_process_details?.present_symptom,
        nurse_fullname:
          selectedRecord.doctor_process_details?.nurse_process_details
            .nurse_fullname,
        type:
          selectedRecord.type === "both"
            ? "Cả hai"
            : selectedRecord.type === "service"
            ? "Dịch vụ"
            : "Sản phẩm",
        assigned_doctor:
          selectedRecord.doctor_process_details?.assigned_doctor_name,
        service_name: selectedRecord.treatment_request[0]?.service_name,
      });
    }
  }, [selectedRecord, form, sessionInfo]);

  // Hàm đóng Modal 1
  const closeFirstModal = () => {
    setIsFirstModalVisible(false);
    onCancel(); // Gọi hàm onCancel của Modal 1
  };

  useEffect(() => {
    if (selectedRecord) {
      const filteredRequest = selectedRecord.treatment_request.find(
        (request: { service_name: string }) => request.service_name === "TLCB"
      );

      if (filteredRequest) {
        const sessionData = filteredRequest.treatment_sessions.map(
          (session: any) => ({
            key: session.id,
            index: session.id,
            content: session.content,
            treatment_day: session.treatment_day || "-",
            is_done: session.is_done,
          })
        );

        setSessions(sessionData);
      }
    }
  }, [selectedRecord]);

  const handleCheckboxChange = (checked: boolean, id: number) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.key === id ? { ...session, is_done: checked } : session
      )
    );
  };

  const column: ColumnsType<any> = [
    {
      title: "Buổi",
      key: "index",
      dataIndex: "index", // Hiển thị ID của session
      width: 70,
      align: "center",
    },
    {
      key: "content",
      title: "Nội dung",
      dataIndex: "content",
      align: "center",
    },
    {
      key: "treatment_day",
      title: "Ngày điều trị",
      dataIndex: "treatment_day",
      align: "center",
    },
    {
      title: "Đã điều trị",
      dataIndex: "is_done",
      key: "is_done",
      align: "center",
      render: (_, record) => (
        <Checkbox
          checked={record.is_done}
          onChange={(e) => handleCheckboxChange(e.target.checked, record.key)}
        />
      ),
    },
  ];

  const columns: ColumnsType<any> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      key: "name",
      title: "Tên kỹ thuật",
      render: (_, record) => {
        if (record.isNew) {
          return (
            <Form.Item
              name={[
                "session_techical_settings",
                record.name,
                "techical_setting",
              ]}
              noStyle
            >
              <Select placeholder="Chọn kỹ thuật" style={{ width: "100%" }}>
                {techList?.results?.map((tech: any) => (
                  <Option key={tech.id} value={tech.id}>
                    {tech.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        }

        const technicalSettings = record?.treatment_sessions?.flatMap(
          (session: { session_techical_settings_details: [] }) =>
            session?.session_techical_settings_details?.map(
              (detail: { techical_setting_name: string }) =>
                detail.techical_setting_name
            )
        );

        return technicalSettings?.join(", ") || "Không có kỹ thuật";
      },
      align: "center",
    },
    {
      key: "user",
      title: "Người thực hiện",
      render: (_, record) => {
        if (record.isNew) {
          return (
            <Form.Item
              name={["session_techical_settings", record.name, "experts"]}
              noStyle
            >
              <Select
                placeholder="Chọn người thực hiện"
                style={{ width: "100%" }}
              >
                {sessionInfo?.designated_experts?.map((expert: any) => (
                  <Option key={expert.id} value={expert.id}>
                    {expert.full_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        }

        const experts = record?.treatment_sessions?.flatMap(
          (session: { session_techical_settings_details: [] }) =>
            session?.session_techical_settings_details?.flatMap(
              (detail: { experts: [] }) =>
                detail?.experts?.map(
                  (expert: { full_name: string }) => expert.full_name
                )
            )
        );

        return experts?.join(", ") || "Chưa có người thực hiện";
      },
      align: "center",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      align: "center",
      render: (_, record) =>
        record.isNew ? (
          <Button
            type="text"
            icon={<BiTrash />}
            danger
            onClick={() => {
              const session_techical_settings = form.getFieldValue(
                "session_techical_settings"
              );
              form.setFieldsValue({
                session_techical_settings: session_techical_settings.filter(
                  (_: any, index: number) => index !== record.name
                ),
              });
            }}
          />
        ) : null,
    },
  ];

  const formattedSessions = [
    ...(sessionInfo?.session_techical_settings_details?.map(
      (item: any, index: number) => ({
        key: index,
        ...item,
      })
    ) || []),
    ...(form.getFieldValue("session_techical_settings") || []).map(
      (item: any, index: number) => ({
        ...item,
        key: `new-${index}`,
        name: index,
        isNew: true,
      })
    ),
  ];

  const onFinish = async (values: any) => {
    console.log("ss", sessions);
    console.log("vo day", values);
    const body = {
      session_techical_settings: values.session_techical_settings,
    };
    try {
      await UpdateTreatmentSession({
        // id: selectedSessions.id,
        data: body,
      }).unwrap();
      await notification.success({
        message: "Thành công",
        placement: "bottomRight",
      });
      form.resetFields();
    } catch (error) {
      notification.error({
        message: `Thất bại`,
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      <Modal
        onCancel={closeFirstModal}
        open={open}
        title="Yêu cầu trải nghiệm"
        footer={null}
        width={1289}
        destroyOnClose
      >
        {selectedRecord && (
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
                  </Row>
                </Col>
              </Row>
            </div>
            <hr />
            <h3 className="text-[18px] font-bold mt-4">Dịch vụ trị liệu</h3>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Chuyên gia chỉ định" name="assigned_doctor">
                  <Select placeholder="Chọn bác sĩ" disabled>
                    <Option key="1">Trần Lê Bảo Châu</Option>
                    <Option key="2">Bắc Long</Option>
                    <Option key="3">Cần giờ</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Phương pháp trị liệu" name="service_name">
                  <Input disabled />
                </Form.Item>
                <Form.Item label="Phòng thực hiện" name="floor">
                  <Select placeholder="Chọn bác sĩ">
                    <Option key="1">Phòng 522</Option>
                    <Option key="2">Phòng t11</Option>
                    <Option key="3">Phòng</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Chuyên gia chỉ định"
                  name="designated_experts"
                >
                  <Select placeholder="Chọn bác sĩ" mode="multiple">
                    {sessionInfo?.designated_experts?.map((expert: any) => (
                      <Option key={expert.id} value={expert.id}>
                        {expert.full_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Bắt đầu trị liệu" name="start">
                  <TimePicker />
                </Form.Item>
                <Form.Item label="Ghi chú" name="note">
                  <TextArea />
                </Form.Item>
                <Form.Item label="Kỹ thuật thực hiện">
                  <Table
                    dataSource={formattedSessions}
                    columns={columns}
                    bordered
                    pagination={false}
                  />
                  <div className="mx-2 flex justify-center">
                    <Button
                      type="link"
                      icon={<BiPlusCircle />}
                      onClick={() => {
                        const newTech = {
                          techical_setting: null,
                          experts: [],
                        };
                        form.setFieldsValue({
                          session_techical_settings: [
                            ...(form.getFieldValue(
                              "session_techical_settings"
                            ) || []),
                            newTech,
                          ],
                        });
                      }}
                    >
                      Thêm
                    </Button>
                  </div>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Col span={24}>
                  <Table bordered dataSource={sessions} columns={column} />
                </Col>
              </Col>
            </Row>
            <div className="col-span-3 flex justify-end gap-5 items-center ">
              <Button key="cancel" onClick={onCancel}>
                Hủy
              </Button>
              <Button htmlType="submit" type="primary">
                Hoàn thành
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </>
  );
}
