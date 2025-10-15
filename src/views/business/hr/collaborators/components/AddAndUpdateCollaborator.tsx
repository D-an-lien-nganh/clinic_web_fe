"use client";

import React, { useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  notification,
  Radio,
  Select,
} from "antd";
import dayjs from "dayjs";
import {
  useCreateEmployeeMutation,
  useEditEmployeeMutation,
} from "@/api/app_hr/apiHR";
import {
  useGetDepartmentListQuery,
  useGetPositionListQuery,
} from "@/api/app_home/apiConfiguration";

const { RangePicker } = DatePicker;

interface AddAndUpdateCollaboratorProps {
  edit?: boolean;
  collaboratorData?: any; // object từ BE (HrUserProfile)
  refresh?: () => void;
}

const AddAndUpdateCollaborator: React.FC<AddAndUpdateCollaboratorProps> = ({
  edit,
  collaboratorData,
  refresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // HR APIs
  const [createEmployee, { isLoading: creatingHR }] =
    useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: updatingHR }] = useEditEmployeeMutation();

  // Catalogs
  const { data: departmentResp, isLoading: loadingDept } =
    useGetDepartmentListQuery();
  const { data: positionResp, isLoading: loadingPosition } =
    useGetPositionListQuery();
  const departments = departmentResp?.results || [];
  const positions = positionResp?.results || [];

  // state lọc chức vụ theo phòng ban
  const [filteredPositions, setFilteredPositions] = useState<any[]>([]);

  const showModal = () => {
    setIsModalOpen(true);

    if (edit && collaboratorData) {
      const positionId =
        (collaboratorData.position && collaboratorData.position.id) ||
        collaboratorData.position ||
        null;
      const departmentId =
        (collaboratorData.position && collaboratorData.position.department) ||
        collaboratorData.department ||
        null;

      form.setFieldsValue({
        // Trường tự thân
        name: collaboratorData.full_name || "",
        email: collaboratorData.email || "",
        phone: collaboratorData.mobile || "",
        level: collaboratorData.level || "",

        // Hợp đồng
        status: collaboratorData.contract_status || "",
        contractType: collaboratorData.contract_type || "",
        start_date: collaboratorData.start_date
          ? dayjs(collaboratorData.start_date)
          : null,
        contract_duration:
          collaboratorData.contract_start && collaboratorData.contract_end
            ? [
                dayjs(collaboratorData.contract_start),
                dayjs(collaboratorData.contract_end),
              ]
            : [],

        // Phòng ban/chức vụ
        department_id: departmentId,
        position_id: positionId,
      });

      if (departmentId) {
        setFilteredPositions(
          positions.filter((p: any) => p.department === departmentId)
        );
      } else {
        setFilteredPositions([]);
      }
    } else {
      form.resetFields();
      setFilteredPositions([]);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setFilteredPositions([]);
    refresh?.();
  };

  const handleDepartmentChange = (departmentId: number) => {
    form.setFieldValue("department_id", departmentId);
    form.setFieldValue("position_id", undefined);
    const filtered = positions.filter(
      (p: any) => p.department === departmentId
    );
    setFilteredPositions(filtered);
  };

  const onFinish = async (values: any) => {
    try {
      if (!values.contract_duration || values.contract_duration.length < 2) {
        notification.error({ message: "Vui lòng chọn thời hạn hợp đồng" });
        return;
      }

      const fd = new FormData();

      // 🔸 Trường tự thân trong HR
      fd.append("full_name", values.name || "");
      fd.append("email", values.email || "");
      fd.append("mobile", values.phone || "");
      if (values.position_id)
        fd.append("position_id", String(values.position_id));

      // 🔸 Hợp đồng / thông tin khác
      fd.append("contract_type", values.contractType); // "OF" | "IN"
      fd.append("contract_status", values.status); // "AC" | "EX"
      fd.append(
        "contract_start",
        values.contract_duration[0].format("YYYY-MM-DD")
      );
      fd.append(
        "contract_end",
        values.contract_duration[1].format("YYYY-MM-DD")
      );
      fd.append("start_date", values.start_date.format("YYYY-MM-DD"));
      if (values.level) fd.append("level", values.level);
      fd.append("type", "collaborator");

      // (Nếu có upload file hợp đồng, thêm:)
      // if (values.contract?.[0]?.originFileObj) {
      //   fd.append("contract", values.contract[0].originFileObj);
      // }

      if (edit && collaboratorData?.id) {
        await updateEmployee({ id: collaboratorData.id, body: fd }).unwrap();
        notification.success({
          message: "Cập nhật cộng tác viên thành công",
          placement: "bottomRight",
        });
      } else {
        await createEmployee(fd).unwrap();
        notification.success({
          message: "Thêm cộng tác viên thành công",
          placement: "bottomRight",
        });
      }

      handleCancel();
    } catch (error: any) {
      notification.error({
        message: edit ? "Cập nhật thất bại" : "Thêm cộng tác viên thất bại",
        description:
          error?.data?.message || error?.data?.detail || "Vui lòng thử lại!",
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      {edit ? (
        <Button type="primary" onClick={showModal} size="small">
          Sửa
        </Button>
      ) : (
        <Button type="primary" onClick={showModal}>
          Tạo mới
        </Button>
      )}

      <Modal
        title={`${edit ? "Cập nhật thông tin" : "Thêm"} cộng tác viên`}
        open={isModalOpen}
        footer={null}
        onCancel={handleCancel}
        className="!w-[1000px]"
      >
        <Form
          id="collabForm"
          layout="vertical"
          onFinish={onFinish}
          form={form}
          className="grid grid-cols-3 gap-3"
        >
          {/* Họ tên CTV */}
          <Form.Item
            name="name"
            label="Họ tên cộng tác viên"
            rules={[
              { required: true, message: "Vui lòng nhập họ tên cộng tác viên" },
            ]}
          >
            <Input placeholder="Nhập họ tên cộng tác viên" />
          </Form.Item>

          {/* Trình độ (map sang level) */}
          <Form.Item name="level" label="Trình độ">
            <Select placeholder="Chọn trình độ" allowClear>
              <Select.Option value="Đại học">Đại học</Select.Option>
              <Select.Option value="Cao đẳng">Cao đẳng</Select.Option>
              <Select.Option value="Trung học">Trung học</Select.Option>
            </Select>
          </Form.Item>

          {/* Hợp đồng + Trạng thái */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Form.Item
              name="contractType"
              label="Hợp đồng"
              rules={[
                { required: true, message: "Vui lòng chọn loại hợp đồng" },
              ]}
              style={{
                display: "inline-block",
                width: "calc(50% - 8px)",
                marginRight: 10,
              }}
            >
              <Select placeholder="Chọn loại hợp đồng">
                <Select.Option value="OF">Chính thức</Select.Option>
                <Select.Option value="IN">Bán thời gian</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              style={{ display: "inline-block", width: "calc(50% - 8px)" }}
            >
              <Select placeholder="Chọn trạng thái">
                <Select.Option value="AC">Còn hiệu lực</Select.Option>
                <Select.Option value="EX">Hết hiệu lực</Select.Option>
              </Select>
            </Form.Item>
          </Form.Item>

          {/* Email */}
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          {/* SĐT */}
          <Form.Item
            name="phone"
            label="SĐT"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{10}$/, message: "Số điện thoại không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          {/* Thời hạn hợp đồng */}
          <Form.Item
            label="Thời hạn hợp đồng"
            name="contract_duration"
            rules={[{ required: true, message: "Chọn thời hạn hợp đồng" }]}
          >
            <RangePicker
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
              format="DD/MM/YYYY"
              allowClear
              className="w-full"
            />
          </Form.Item>

          {/* Phòng ban (chỉ để lọc chức vụ, không gửi lên BE) */}
          <Form.Item name="department_id" label="Phòng ban">
            <Select
              placeholder="Chọn phòng ban"
              loading={loadingDept}
              showSearch
              optionFilterProp="children"
              onChange={handleDepartmentChange}
            >
              {departments.map((dept: any) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Chức vụ (gửi position_id nếu có) */}
          <Form.Item name="position_id" label="Chức vụ">
            <Select
              placeholder="Chọn chức vụ"
              loading={loadingPosition}
              showSearch
              optionFilterProp="children"
              disabled={!form.getFieldValue("department_id")}
            >
              {filteredPositions.map((pos: any) => (
                <Select.Option key={pos.id} value={pos.id}>
                  {pos.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Ngày bắt đầu làm việc */}
          <Form.Item
            label="Ngày bắt đầu làm việc"
            name="start_date"
            rules={[{ required: true, message: "Chọn Ngày bắt đầu làm việc" }]}
          >
            <DatePicker
              placeholder="Chọn ngày bắt đầu làm việc"
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
            />
          </Form.Item>

          {/* Upload hợp đồng (nếu cần, bật lại và gửi fd.append('contract', ...)) */}
          {/* <Form.Item
              name="contract"
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList || []}
            >
              <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.doc,.docx">
                <Button icon={<UploadOutlined />} style={{ color: "#BD8306" }}>
                  Chọn tệp hợp đồng
                </Button>
              </Upload>
            </Form.Item> */}
        </Form>

        <div className="flex justify-end gap-2">
          <Button
            style={{ color: "white", backgroundColor: "#BD8306" }}
            htmlType="submit"
            form="collabForm"
            loading={creatingHR || updatingHR}
          >
            Lưu
          </Button>
          <Button onClick={handleCancel}>Hủy</Button>
        </div>
      </Modal>
    </>
  );
};

export default AddAndUpdateCollaborator;
