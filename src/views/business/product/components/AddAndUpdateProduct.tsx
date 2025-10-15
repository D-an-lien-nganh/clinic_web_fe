"use client";

import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  notification,
  Radio,
  Row,
  Select,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  useCreateProductMutation,
  useEditProductMutation,
  useGetProductQuery,
} from "@/api/app_product/apiService";
import { useGetUnitListQuery } from "@/api/app_home/apiConfiguration";

function parseNumberLikeVN(input: any): number {
  if (input === null || input === undefined) return NaN;
  const s = String(input).trim();
  if (!s) return NaN;
  // Bỏ mọi ký tự không phải số, dấu . , hoặc -
  const cleaned = s.replace(/[^\d,.\-]/g, "");
  // Nếu có cả . và ,: giả định , là thousands và . là decimal (hoặc ngược lại)
  // Cách an toàn: bỏ dấu phân tách nghìn, giữ dấu thập phân cuối cùng
  // 1) nếu có cả , và . => chọn ký tự xuất hiện sau cùng làm dấu thập phân
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let decimalSep = "";
  if (lastComma === -1 && lastDot === -1) {
    decimalSep = "";
  } else if (lastComma > lastDot) {
    decimalSep = ",";
  } else {
    decimalSep = ".";
  }
  let normalized = cleaned;
  if (decimalSep) {
    // bỏ tất cả dấu phân tách nghìn (.,,) rồi thay dấu thập phân bằng '.'
    normalized = cleaned
      .replace(/[.,](?=.*[.,])/g, (m, offset) =>
        offset === (decimalSep === "," ? lastComma : lastDot) ? m : ""
      )
      .replace(decimalSep, ".");
  } else {
    normalized = cleaned.replace(/[.,]/g, "");
  }
  return Number(normalized);
}

export default function AddAndUpdateProduct({
  id,
  title,
  edit,
  refetch,
  readOnly = false,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: {
  id?: number;
  title?: string;
  edit?: boolean;
  refetch?: any;
  readOnly?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [form] = Form.useForm();
  const [shouldFetch, setShouldFetch] = useState(false);
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const isModalOpen =
    externalIsOpen !== undefined ? externalIsOpen : internalModalOpen;

  const [createProduct] = useCreateProductMutation();
  const [editProduct] = useEditProductMutation();

  const { data: productId } = useGetProductQuery(id, {
    skip: !id || !isModalOpen,
  });

  const { data: unitList } = useGetUnitListQuery(undefined, {
    skip: !shouldFetch,
  });

  const showModal = () => {
    setInternalModalOpen(true);
    setShouldFetch(true);
  };

  const handleCancel = () => {
    if (externalIsOpen !== undefined && externalOnClose) {
      externalOnClose();
    } else {
      setInternalModalOpen(false);
    }
    setShouldFetch(false);
  };

  useEffect(() => {
    if (readOnly && id) {
      if (externalIsOpen === undefined) {
        setInternalModalOpen(true);
      }
      setShouldFetch(true);
    }
  }, [readOnly, id, externalIsOpen]);

  useEffect(() => {
    if (isModalOpen) {
      if ((edit || readOnly) && productId) {
        let price = productId.sell_price;

        // Chuyển về số nếu là string float
        if (price !== null && price !== undefined) {
          const num = Number(price);
          // Nếu là số nguyên (vd: 65000.00) thì hiện 65000
          price = Number.isInteger(num) ? String(num) : String(num);
        }

        form.setFieldsValue({
          ...productId,
          sell_price: price,
          expiration_date: productId.expiration_date
            ? dayjs(productId.expiration_date)
            : null,
        });
      } else if (!edit && !readOnly) {
        form.resetFields();
      }
    }
  }, [isModalOpen, edit, readOnly, productId, form]);

  const onFinish = async () => {
    try {
      const data = await form.validateFields();

      const parsed = parseNumberLikeVN(data.sell_price);
      if (Number.isNaN(parsed)) {
        notification.error({
          message: "Giá bán không hợp lệ",
          description:
            "Vui lòng nhập số hợp lệ (Ví dụ: 120000, 120.000, 120,000.50).",
          placement: "bottomRight",
          className: "h-16",
        });
        return;
      }

      const payload = {
        ...data,
        sell_price: parsed, // gửi số thuần lên API
        unit: String(data.unit),
      };

      if (edit) {
        await editProduct({ id, ...payload }).unwrap();
        notification.success({
          message: "Sản phẩm đã được cập nhật!",
          className: "h-16",
          placement: "bottomRight",
        });
      } else {
        await createProduct(payload).unwrap();
        notification.success({
          message: "Sản phẩm đã được thêm mới!",
          className: "h-16",
          placement: "bottomRight",
        });
      }

      handleCancel();
      if (refetch) refetch();
    } catch (error) {
      console.error("Error during submission:", error);
      notification.error({
        message: "Đã xảy ra lỗi khi xử lý dữ liệu!",
        className: "h-16",
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      {!readOnly && (
        <Button
          style={{ backgroundColor: "#BD8306", color: "white", border: "none" }}
          onClick={showModal}
          size={edit ? "small" : "middle"}
        >
          {edit ? "Sửa" : "Thêm sản phẩm"}
        </Button>
      )}

      <Modal
        title={
          title ||
          (readOnly
            ? "Chi tiết sản phẩm"
            : edit
            ? "Sửa sản phẩm"
            : "Thêm sản phẩm")
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          readOnly
            ? [
                <Button key="close" onClick={handleCancel}>
                  Đóng
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={handleCancel}>
                  Hủy
                </Button>,
                <Button key="submit" type="primary" onClick={onFinish}>
                  Xác nhận
                </Button>,
              ]
        }
        destroyOnClose
        width={800}
      >
        <Form
          layout="vertical"
          form={form}
          disabled={readOnly}
          initialValues={{ product_type: "thuoc" }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Tên sản phẩm không được để trống",
                  },
                ]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Nguồn gốc"
                name="origin"
                rules={[
                  { required: true, message: "Nguồn gốc không được để trống" },
                ]}
              >
                <Input placeholder="Nhập nguồn gốc" />
              </Form.Item>
            </Col>

            {/* Giá bán (Input thường) */}
            <Col span={12}>
              <Form.Item
                label="Giá bán"
                name="sell_price"
                rules={[
                  { required: true, message: "Giá bán không được để trống" },
                  {
                    validator: (_, value) => {
                      if (
                        value === undefined ||
                        value === null ||
                        value === ""
                      ) {
                        return Promise.resolve();
                      }
                      const n = parseNumberLikeVN(value);
                      return Number.isNaN(n)
                        ? Promise.reject("Giá bán phải là số hợp lệ")
                        : Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Ví dụ: 120000 hoặc 120.000" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Đơn vị"
                name="unit"
                rules={[
                  { required: true, message: "Đơn vị không được để trống" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn đơn vị"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {unitList?.results.map((unit: any) => (
                    <Select.Option key={unit.id} value={unit.id}>
                      {unit.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Mô tả" name="description">
                <TextArea rows={2} placeholder="Nhập mô tả" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Loại sản phẩm"
                name="product_type"
                rules={[
                  { required: true, message: "Vui lòng chọn loại sản phẩm" },
                ]}
              >
                <Radio.Group>
                  <Radio value="thuoc">Thuốc</Radio>
                  <Radio value="tpchucnang">Thực phẩm chức năng</Radio>
                  <Radio value="consumable">Vật tư tiêu hao</Radio>
                  <Radio value="device">Thiết bị</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
