import { useGetUnitListQuery } from "@/api/app_home/apiConfiguration";
import {
  useCreateFacilityMutation,
  useEditFacilityMutation,
  useGetFacilityQuery,
  useGetMaintenanceListQuery,
  useCreateMaintenanceMutation,
  useDeleteMaintenanceMutation,
  useGetFixScheduleListQuery,
  useCreateFixScheduleMutation,
  useDeleteFixScheduleMutation,
} from "@/api/app_product/apiService";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Table,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { TableProps } from "antd/lib";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { RiDeleteBin5Line } from "react-icons/ri";

const { Option } = Select;

// Interfaces
interface RecordInfo {
  key: React.Key;
  id?: number;
  date?: string;
  note?: string;
  status?: string;
  facility: any;
}

interface Props {
  edit?: boolean;
  title?: string;
  id?: number;
}

export default function AddAndUpdateMaterial({ edit, title, id }: Props) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  // API hooks
  const { data: facilityData } = useGetFacilityQuery(id, {
    skip: !id || !isModalOpen,
  });
  const { data: unitList } = useGetUnitListQuery(undefined, {
    skip: !shouldFetch,
  });
  const { data: maintenanceData } = useGetMaintenanceListQuery(undefined, {
    skip: !shouldFetch,
  });
  const { data: fixScheduleData } = useGetFixScheduleListQuery(undefined, {
    skip: !shouldFetch,
  });

  const [createFacility] = useCreateFacilityMutation();
  const [editFacility] = useEditFacilityMutation();
  const [createMaintenance] = useCreateMaintenanceMutation();
  const [deleteMaintenance] = useDeleteMaintenanceMutation();
  const [createFixSchedule] = useCreateFixScheduleMutation();
  const [deleteFixSchedule] = useDeleteFixScheduleMutation();

  // State for editable tables
  const [maintenanceRecords, setMaintenanceRecords] = useState<RecordInfo[]>(
    []
  );
  const [fixScheduleRecords, setFixScheduleRecords] = useState<RecordInfo[]>(
    []
  );

  // Initial data fetch and setup
  useEffect(() => {
    if (facilityData) form.setFieldsValue(facilityData);

    if (maintenanceData?.results && id) {
      setMaintenanceRecords(
        maintenanceData.results
          .filter((record: RecordInfo) => record.facility === id)
          .map((record: any) => ({ ...record, key: record.id }))
      );
    }

    if (fixScheduleData?.results && id) {
      setFixScheduleRecords(
        fixScheduleData.results
          .filter((record: RecordInfo) => record.facility === id)
          .map((record: any) => ({ ...record, key: record.id }))
      );
    }
  }, [facilityData, maintenanceData, fixScheduleData, id, form]);

  // Handlers
  const handleAddRow = (
    setRecords: React.Dispatch<React.SetStateAction<RecordInfo[]>>
  ) => {
    setRecords((prev) => [
      ...prev,
      {
        key: Date.now(),
        date: "",
        note: "",
        status: "1",
        facility: "",
      },
    ]);
  };

  const showModal = () => {
    setIsModalOpen(true);
    setShouldFetch(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setShouldFetch(false);
  };

  const handleUpdateField = (
    key: React.Key,
    field: string,
    value: any,
    setRecords: React.Dispatch<React.SetStateAction<RecordInfo[]>>
  ) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.key === key ? { ...record, [field]: value } : record
      )
    );
  };

  const handleDeleteRow = async (
    key: React.Key,
    setRecords: React.Dispatch<React.SetStateAction<RecordInfo[]>>,
    deleteApi?: (params: any) => Promise<any>,
    idField?: string
  ) => {
    const recordToDelete =
      maintenanceRecords.find((item) => item.key === key) ||
      fixScheduleRecords.find((item) => item.key === key);

    if (!recordToDelete) return;

    if (recordToDelete.id && deleteApi && idField) {
      try {
        await deleteApi({ [idField]: recordToDelete.id });
        notification.success({
          message: "Xóa thành công!",
          placement: "bottomRight",
          className: "h-16",
        });
      } catch {
        notification.error({
          message: "Xóa thất bại!",
          placement: "bottomRight",
          className: "h-16",
        });
        return;
      }
    }

    setRecords((prevRecords) =>
      prevRecords.filter((record) => record.key !== key)
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, unit: values.unit?.toString() };

      if (edit) {
        await editFacility({ id, ...payload }).unwrap();
      } else {
        await createFacility(payload).unwrap();
      }

      for (const record of maintenanceRecords) {
        if (!record.id) {
          await createMaintenance({ ...record, facility: id }).unwrap();
        }
      }

      for (const record of fixScheduleRecords) {
        if (!record.id) {
          await createFixSchedule({ ...record, facility: id }).unwrap();
        }
      }

      notification.success({
        message: edit ? "Cập nhật thành công!" : "Thêm thành công!",
        placement: "bottomRight",
      });
      setIsModalOpen(false);
    } catch {
      notification.error({
        message: "Xử lý thất bại!",
        placement: "bottomRight",
      });
    }
  };

  const generateColumns = (
    setRecords: React.Dispatch<React.SetStateAction<RecordInfo[]>>,
    deleteApi?: any,
    idField?: string
  ): TableProps<RecordInfo>["columns"] => [
    {
      title: "Lần",
      align: "center",
      render: (_, __, index) => <div>{index + 1}</div>,
    },
    {
      title: "Ngày",
      dataIndex: "date",
      align: "center",
      render: (_, record) => (
        <DatePicker
          placeholder="Chọn thời gian"
          value={record.date ? dayjs(record.date) : null}
          onChange={(date) =>
            handleUpdateField(
              record.key,
              "date",
              date ? dayjs(date).format("YYYY-MM-DD") : null,
              setRecords
            )
          }
        />
      ),
    },
    {
      title: "Chú thích",
      dataIndex: "note",
      align: "center",
      render: (_, record) => (
        <Input
          placeholder="Tình trạng hiện tại"
          value={record.note}
          onChange={(e) =>
            handleUpdateField(record.key, "note", e.target.value, setRecords)
          }
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      render: (_, record) => (
        <Select
          className="w-40"
          value={record.status}
          onChange={(value) =>
            handleUpdateField(record.key, "status", value, setRecords)
          }
        >
          <Option value="1">Chờ đợi</Option>
          <Option value="2">Đang tiến hành</Option>
          <Option value="3">Trì hoãn</Option>
          <Option value="4">Hoàn thành</Option>
          <Option value="5">Huỷ bỏ</Option>
        </Select>
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
            handleDeleteRow(record.key, setRecords, deleteApi, idField)
          }
        >
          <RiDeleteBin5Line style={{ fontSize: "20px" }} />
        </Button>
      ),
    },
  ];

  return (
    <>
      <Button
        type="primary"
        onClick={showModal}
        size={edit ? "small" : "middle"}
      >
        {edit ? "Sửa" : "Thêm vật tư"}
      </Button>
      <Modal
        open={isModalOpen}
        title={title}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            Xác nhận
          </Button>,
        ]}
        destroyOnClose
        width={1289}
      >
        <Form form={form} layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              {/* Tên vật tư + Mã thiết bị đặt cạnh nhau */}
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Tên vật tư"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên vật tư!" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="code"
                    label="Mã thiết bị"
                    rules={[
                      { required: true, message: "Vui lòng nhập mã thiết bị!" },
                    ]}
                  >
                    <Input placeholder="VD: FAC-0001" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item name="quantity" label="Số lượng nhập về">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="unit" label="Đơn vị">
                    <Select>
                      {unitList?.results?.map((unit: any) => (
                        <Option key={unit.id} value={unit.id}>
                          {unit.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="import_price" label="Giá mua">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="effect" label="Tác dụng">
                <TextArea />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="origin" label="Xuất xứ">
                <Input />
              </Form.Item>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="status" label="Trạng thái">
                    <Select>
                      <Option value="new">Hàng mới</Option>
                      <Option value="inuse">Đang sử dụng</Option>
                      <Option value="old">Hỏng</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="is_malfunction" label="Phát hiện hỏng hóc">
                    <Select>
                      <Option value={true}>Có</Option>
                      <Option value={false}>Không</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="malfunction_status" label="Tình trạng hỏng hóc">
                <TextArea />
              </Form.Item>
            </Col>
          </Row>
          {/* Row chứa cả 2 tiêu đề với số lần, cách table 16px */}
          <Row
            justify="space-between"
            align="middle"
            style={{ margin: "16px 0" }}
          >
            <Col>
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                Thông tin bảo trì
              </span>
            </Col>
            <Col>
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                Số lần bảo trì: {maintenanceRecords.length} lần
              </span>
            </Col>
          </Row>
          {/* Bảng bảo trì */}
          <Table
            columns={generateColumns(
              setMaintenanceRecords,
              deleteMaintenance,
              "maintenanceId"
            )}
            dataSource={maintenanceRecords}
            pagination={false}
            bordered
            footer={() => (
              <Button
                type="dashed"
                style={{ color: "#BD8306" }}
                onClick={() => handleAddRow(setMaintenanceRecords)}
                block
              >
                + Thêm
              </Button>
            )}
          />
          {/* Khoảng cách giữa 2 bảng */}
          <Row
            justify="space-between"
            align="middle"
            style={{ margin: "16px 0" }}
          >
            <Col>
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                Thông tin sửa chữa
              </span>
            </Col>
            <Col>
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                Số lần sửa chữa: {fixScheduleRecords.length} lần
              </span>
            </Col>
          </Row>
          {/* Bảng sửa chữa */}
          <Table
            columns={generateColumns(
              setFixScheduleRecords,
              deleteFixSchedule,
              "fixScheduleId"
            )}
            dataSource={fixScheduleRecords}
            pagination={false}
            bordered
            footer={() => (
              <Button
                type="dashed"
                style={{ color: "#BD8306" }}
                onClick={() => handleAddRow(setFixScheduleRecords)}
                block
              >
                + Thêm
              </Button>
            )}
          />
        </Form>
      </Modal>
    </>
  );
}
