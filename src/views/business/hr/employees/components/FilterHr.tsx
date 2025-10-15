import React, { useState } from "react";
import { Modal, Form, DatePicker, Select, Button } from "antd";
import { CiFilter } from "react-icons/ci";

const { Option } = Select;

interface FilterHrProps {
  onFilterApply: (values: any) => void;
  onClearFilters: () => void;
  departmentOptions: { label: string; value: string }[]; // Thêm prop để nhận danh sách phòng ban
}

const FilterHr: React.FC<FilterHrProps> = ({
  onFilterApply,
  onClearFilters,
  departmentOptions,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const onClearFiltersLocal = () => {
    form.resetFields(["startDate", "endDate", "department"]); // Reset cả department
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields(); // Reset form when closing
  };

  const handleFilterSubmit = (values: any) => {
    console.log("Filter Hr Values:", values); // Debug giá trị form
    onFilterApply({
      startDate: values.startDate,
      endDate: values.endDate,
      department: values.department,
    });
    setIsModalVisible(false); // Close modal after applying
  };

  console.log("Department Options in FilterHr:", departmentOptions); // Debug danh sách phòng ban

  return (
    <div>
      <Form layout="inline" className="max-md:gap-2 w-2/3" form={form} onFinish={showModal}>
        <Button
          type="default"
          shape="circle"
          size="middle"
          onClick={showModal}
          className="flex items-center justify-center border-blue-500 text-blue-500 rounded-full p-4"
        >
          <CiFilter />
        </Button>
      </Form>

      <Modal
        title="Bộ lọc"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleFilterSubmit}
          initialValues={{
            startDate: null,
            endDate: null,
            department: undefined,
          }}
          form={form}
        >
          <Form.Item label="Thời gian">
            <div className="flex w-full gap-2">
              <Form.Item name="startDate" className="w-1/2">
                <DatePicker allowClear placeholder="Ngày bắt đầu" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="endDate" className="w-1/2">
                <DatePicker allowClear placeholder="Ngày kết thúc" style={{ width: "100%" }} />
              </Form.Item>
            </div>
          </Form.Item>
          <div className="flex flex-row gap-2">
            <Form.Item label="Phòng ban" name="department" className="w-[100%]">
              <Select allowClear placeholder="Chọn phòng ban">
                {departmentOptions.map((dept) => (
                  <Option key={dept.value} value={dept.value}>
                    {dept.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item>
            <div className={"flex justify-end"}>
              <Button onClick={onClearFiltersLocal}>Xóa bộ lọc</Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-blue-500"
                style={{ marginRight: "8px" }}
              >
                Tiến hành lọc
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FilterHr;