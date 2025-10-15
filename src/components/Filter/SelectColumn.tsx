import { Button, Checkbox, Col, Form, Input, InputNumber, Modal, Row, Tooltip } from "antd";
import type { CheckboxProps } from "antd";
import React, { useEffect, useState } from "react";
import { GiSettingsKnobs } from "react-icons/gi";

interface DataItem {
  key: string;
  title: string;
  checked: boolean;
  width: number;
  title_column: string;
}

interface DataColumn {
  [key: string]: DataItem[];
}

const SelectColumn = ({ dataColumn, setDataColumn }: { dataColumn: DataColumn; setDataColumn: any }) => {
  const [form] = Form.useForm();
  const [dataKey, setDataKey] = useState<string>("defaultKey");
  const [data, setData] = useState<DataItem[]>([]);

  useEffect(() => {
    if (dataColumn && Object.keys(dataColumn).length > 0) {
      const firstKey = Object.keys(dataColumn)[0];
      setDataKey(firstKey);
      setData(dataColumn[firstKey]);
    }
  }, [dataColumn]);
  const [checkAll, setCheckAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.submit();
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onCheckAllChange: CheckboxProps["onChange"] = (e) => {
    const checked = e.target.checked;
    setCheckAll(checked);
    const updatedData = data.map((item) => ({ ...item, checked }));
    setData(updatedData);
    form.setFieldsValue({ [dataKey]: updatedData });
  };

  useEffect(() => {
    setCheckAll(data?.every((item) => item.checked));
  }, [data]);

  const onFinish = (values: any) => {
    const currentData = JSON.parse(localStorage.getItem("column") || "{}");

    for (const key in values) {
      if (values.hasOwnProperty(key)) {
        currentData[key] = values[key];
      }
    }

    localStorage.setItem("column", JSON.stringify(currentData));
    setDataColumn(values);
  };

  return (
    <>
      <Button
        type="dashed"
        icon={<GiSettingsKnobs className="text-blue-500 " />}
        onClick={showModal}
        className="flex items-center justify-center border-blue-500 !text-blue-500 max-sm:hidden"
      >
        Tùy chỉnh
      </Button>

      <Button
        type="dashed"
        icon={<GiSettingsKnobs className="text-blue-500 w-7" />}
        onClick={showModal}
        className="flex items-center justify-center border-red-500 text-red-500 sm:hidden"
      />

      <Modal title="Basic Modal" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <Row className="border font-semibold text-lg" gutter={16}>
          <Col span={2} className="border-r text-center py-2">
            <Checkbox onChange={onCheckAllChange} checked={checkAll} />
          </Col>
          <Col span={9} className="border-r flex justify-center items-center py-2">
            Cột
          </Col>
          <Col span={9} className="border-r flex justify-center items-center py-2">
            Tiêu đề
          </Col>
          <Col span={4} className="border-r flex justify-center items-center py-2">
            Độ dài
          </Col>
        </Row>
        <Form form={form} onFinish={onFinish}>
          <Form.List name={dataKey}>
            {(fields, { add, remove }) => (
              <>
                {data?.map((item, index) => (
                  <Row key={item.key} className="border" gutter={16}>
                    <Col span={2} className="border-r text-center">
                      <Form.Item
                        name={[index, "checked"]}
                        valuePropName="checked"
                        initialValue={item.checked}
                        className="py-1.5 mb-0"
                      >
                        <Checkbox></Checkbox>
                      </Form.Item>
                      <Form.Item name={[index, "key"]} initialValue={item.key} hidden>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={9} className="border-r flex items-center">
                      <Form.Item name={[index, "title_column"]} initialValue={item.title_column} hidden>
                        <Input />
                      </Form.Item>
                      {item.title_column}
                    </Col>
                    <Col span={9} className="border-r">
                      <Form.Item name={[index, "title"]} initialValue={item.title} className="py-1.5 mb-0">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[index, "width"]} initialValue={item.width} className="py-1.5 mb-0">
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
};

export default SelectColumn;
