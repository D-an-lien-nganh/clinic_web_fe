import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  notification,
  Select,
} from "antd";
import dayjs from "dayjs";
import {
  useCreateEmployeeMutation,
  useEditEmployeeMutation,
  useGetEmployeeQuery,
} from "@/api/app_hr/apiHR";
import {
  useGetDepartmentListQuery,
  useGetPositionListQuery,
} from "@/api/app_home/apiConfiguration";
import { MdEdit } from "react-icons/md";

const { RangePicker } = DatePicker;

interface AddAndUpdateEmployeeProps {
  edit?: boolean;
  employeeData?: any;
  refresh?: () => void;
}

const AddAndUpdateEmployee: React.FC<AddAndUpdateEmployeeProps> = ({
  edit,
  employeeData,
  refresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [createEmployee, { isLoading: isCreating }] =
    useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isLoadingUpdate }] =
    useEditEmployeeMutation();
  const { data } = useGetEmployeeQuery(employeeData, { skip: !employeeData });

  const { data: departmentResp, isLoading: loadingDept } =
    useGetDepartmentListQuery();
  const { data: positionResp, isLoading: loadingPosition } =
    useGetPositionListQuery();

  const departments = departmentResp?.results || [];
  const positions = positionResp?.results || [];

  const [filteredPositions, setFilteredPositions] = useState<any[]>([]);

  const showModal = () => setIsModalOpen(true);

  const handleDepartmentChange = (departmentId: number) => {
    form.setFieldValue("department_id", departmentId);
    form.setFieldValue("position_id", null); // reset chức vụ
    const filtered = positions.filter(
      (p: any) => p.department === departmentId
    );
    setFilteredPositions(filtered);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setFilteredPositions([]);
    refresh?.();
  };

  // Prefill khi edit
  useEffect(() => {
    if (edit && data) {
      // Dùng an toàn: position có thể là id hoặc object
      const positionId =
        (data.position && data.position.id) || data.position || null;
      const departmentId =
        (data.position && data.position.department) || data.department || null;

      form.setFieldsValue({
        full_name: data.full_name || "",
        email: data.email || "",
        mobile: data.mobile || "",
        department_id: departmentId,
        position_id: positionId,
        level: data.level || "",
        contract_status: data.contract_status || "",
        contract_type: data.contract_type || "",
        start_date: data.start_date ? dayjs(data.start_date) : null,
        contract_duration:
          data.contract_start && data.contract_end
            ? [dayjs(data.contract_start), dayjs(data.contract_end)]
            : [],
      });

      if (departmentId) {
        const filtered = positions.filter(
          (p: any) => p.department === departmentId
        );
        setFilteredPositions(filtered);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, edit, data, positions]);

  const onFinish = async (values: any) => {
    try {
      if (!values.contract_duration || values.contract_duration.length < 2) {
        message.error("Vui lòng chọn đầy đủ thời hạn hợp đồng.");
        return;
      }
      if (!values.position_id) {
        message.error("Vui lòng chọn chức vụ.");
        return;
      }

      const formData = new FormData();

      // 🔸 Trường tự thân (độc lập)
      formData.append("full_name", values.full_name || "");
      formData.append("email", values.email || "");
      formData.append("mobile", values.mobile || "");
      formData.append("position_id", String(values.position_id));

      // 🔸 Hợp đồng / thông tin khác
      formData.append(
        "contract_start",
        values.contract_duration[0].format("YYYY-MM-DD")
      );
      formData.append(
        "contract_end",
        values.contract_duration[1].format("YYYY-MM-DD")
      );
      formData.append("contract_status", values.contract_status);
      formData.append("contract_type", values.contract_type);
      formData.append("start_date", values.start_date.format("YYYY-MM-DD"));
      formData.append("level", values.level || "");
      formData.append("type", "employee");

      if (edit && data) {
        await updateEmployee({ id: data.id, body: formData }).unwrap();
        notification.success({
          message: "Cập nhật thành công",
          description: `Hồ sơ nhân sự ${
            values.full_name || "này"
          } đã được cập nhật.`,
          placement: "bottomRight",
        });
      } else {
        await createEmployee(formData).unwrap();
        notification.success({
          message: "Thêm mới thành công",
          description: `Hồ sơ nhân sự ${
            values.full_name || "này"
          } đã được thêm vào hệ thống.`,
          placement: "bottomRight",
        });
      }

      handleCancel();
      refresh?.();
    } catch (error: any) {
      console.error("Lỗi xử lý nhân sự:", error);
      notification.error({
        message: "Lỗi",
        description: error?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại!",
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      {edit ? (
        <Button type="link" icon={<MdEdit />} onClick={showModal} />
      ) : (
        <Button type="primary" onClick={showModal}>
          Tạo mới
        </Button>
      )}

      <Modal
        title={
          <div
            style={{
              padding: "20px 0 20px 20px",
              backgroundColor: "#BD8306E5",
              borderTopLeftRadius: 7,
              borderTopRightRadius: 7,
              color: "#fff",
              fontSize: 16,
            }}
          >
            {edit ? "Sửa" : "Thêm"} Nhân Sự
          </div>
        }
        open={isModalOpen}
        footer={null}
        onCancel={handleCancel}
        className="!w-[1000px] custom_modal-updateEmployee"
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          style={{ padding: 24 }}
          className="grid grid-cols-3 gap-3"
        >
          {/* Cột 1 */}
          <Form.Item layout="vertical" className="grid grid-cols-1 gap-1">
            {/* HỌ VÀ TÊN (nhập tay) */}
            <Form.Item
              name="full_name"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input placeholder="Nhập họ tên" allowClear />
            </Form.Item>

            {/* EMAIL (nhập tay) */}
            <Form.Item name="email" label="Email">
              <Input placeholder="Email" allowClear />
            </Form.Item>

            {/* PHÒNG BAN (chỉ lọc chức vụ, không gửi lên BE) */}
            <Form.Item
              name="department_id"
              label="Phòng ban"
              rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
            >
              <Select
                placeholder="Chọn phòng ban"
                loading={loadingDept}
                showSearch
                optionFilterProp="children"
                onChange={handleDepartmentChange}
              >
                {(departments || []).map((dept: any) => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form.Item>

          {/* Cột 2 */}
          <Form.Item layout="vertical" className="grid grid-cols-1 gap-1">
            {/* TRÌNH ĐỘ */}
            <Form.Item name="level" label="Trình độ">
              <Select placeholder="Chọn trình độ" allowClear>
                <Select.Option value="Đại học">Đại học</Select.Option>
                <Select.Option value="Cao đẳng">Cao đẳng</Select.Option>
                <Select.Option value="Trung học">Trung học</Select.Option>
              </Select>
            </Form.Item>

            {/* SỐ ĐIỆN THOẠI (nhập tay) */}
            <Form.Item name="mobile" label="Số điện thoại">
              <Input placeholder="Số điện thoại" allowClear />
            </Form.Item>

            {/* CHỨC VỤ (gửi position_id) */}
            <Form.Item
              name="position_id"
              label="Chức vụ"
              rules={[{ required: true, message: "Vui lòng chọn chức vụ" }]}
            >
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
          </Form.Item>

          {/* Cột 3 */}
          <Form.Item layout="vertical" className="grid grid-cols-1 gap-1">
            <Form.Item style={{ marginBottom: 0 }} required>
              <Form.Item
                name="contract_type"
                label="Hợp đồng"
                rules={[
                  { required: false, message: "Vui lòng chọn loại hợp đồng" },
                ]}
                style={{
                  display: "inline-block",
                  width: "calc(50% - 8px)",
                  marginRight: 10,
                }}
              >
                <Select placeholder="Chọn loại hợp đồng">
                  <Select.Option value="OF">Chính thức</Select.Option>
                  <Select.Option value="IN">Thực tập</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="contract_status"
                label="Trạng thái"
                rules={[
                  { required: false, message: "Vui lòng chọn trạng thái" },
                ]}
                style={{ display: "inline-block", width: "calc(50% - 8px)" }}
              >
                <Select placeholder="Chọn trạng thái">
                  <Select.Option value="AC">Còn hiệu lực</Select.Option>
                  <Select.Option value="EX">Hết hiệu lực</Select.Option>
                </Select>
              </Form.Item>
            </Form.Item>

            <Form.Item
              label="Thời hạn hợp đồng"
              name="contract_duration"
              rules={[{ required: false, message: "Chọn thời hạn hợp đồng" }]}
            >
              <RangePicker
                placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                format="DD/MM/YYYY"
                allowClear
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              label="Ngày bắt đầu làm việc"
              name="start_date"
              rules={[
                { required: false, message: "Chọn Ngày bắt đầu làm việc" },
              ]}
            >
              <DatePicker
                placeholder="Chọn ngày bắt đầu làm việc"
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Form.Item>

          <div className="col-span-3 flex justify-end gap-5 items-center">
            <Button
              style={{ color: "white", backgroundColor: "#BD8306" }}
              htmlType="submit"
              loading={isCreating || isLoadingUpdate}
            >
              Lưu
            </Button>
            <Button onClick={handleCancel}>Hủy</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default AddAndUpdateEmployee;
