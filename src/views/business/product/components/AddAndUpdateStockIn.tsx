import { useGetAllUserQuery } from "@/api/app_home/apiAccount";
import {
  useCreateStockInMutation,
  useEditStockInMutation,
  useGetFacilityQuery,
  useGetProductListQuery,
  useGetStockInQuery,
  useGetSuppliersListQuery,
} from "@/api/app_product/apiService";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Row,
  Select,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";

const { Option } = Select;

export default function AddAndUpdateStockIn({
  id,
  title,
  edit,
}: {
  id?: number;
  title?: string;
  edit?: boolean;
}) {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: allUser } = useGetAllUserQuery(undefined, {
    skip: !shouldFetch,
  });
  const { data } = useGetStockInQuery(id, { skip: !id || !isModalOpen });
  const { data: productList } = useGetProductListQuery(
    {},
    { skip: !shouldFetch }
  );
  const { data: supplierList } = useGetSuppliersListQuery(
    { startDate: "", endDate: "", page: 1, pageSize: 10, searchTerm: "" },
    { skip: !shouldFetch }
  );

  const [createStockIn] = useCreateStockInMutation();
  const [editStockIn] = useEditStockInMutation();

  useEffect(() => {
    if (edit && data && productList?.results && supplierList?.results) {
      const selectedProduct = productList.results.find(
        (product: any) => product.id === data.product
      );
      form.setFieldsValue({
        ...data,
        import_date: data.import_date ? dayjs(data.import_date) : null,
        product: data.product,
        supplier: data.supplier,
        unit: selectedProduct?.unit_name || data.unit,
        quantity: data.quantity,
        import_price: data.import_price,
      });
    } else if (!edit) {
      form.resetFields();
    }
  }, [edit, data, productList, supplierList, form]);

  const showModal = () => {
    setIsModalOpen(true);
    setShouldFetch(true);
    if (edit && data) {
      form.setFieldsValue({
        ...data,
        import_date: data.import_date ? dayjs(data.import_date) : null,
        product: data.product,
        supplier: data.supplier,
        quantity: data.quantity,
        import_price: data.import_price,
      });
    } else {
      form.resetFields();
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setShouldFetch(false);
  };

  const onFinish = async () => {
    try {
      const values = await form.validateFields();

      if (values.quantity === 0) {
        notification.error({
          message: "Số lượng không thể bằng 0 khi thêm mới yêu cầu nhập kho.",
          className: "h-16",
          placement: "bottomRight",
        });
        return;
      }

      const payload = {
        ...values,
        product: values.product?.toString(),
        supplier: values.supplier?.toString(),
        import_date: values.import_date
          ? dayjs(values.import_date).format("YYYY-MM-DD")
          : null,
      };

      if (edit && id) {
        await editStockIn({ id, ...payload }).unwrap();
        notification.success({
          message: "Cập nhật yêu cầu nhập kho thành công!",
          className: "h-16",
          placement: "bottomRight",
        });
      } else {
        await createStockIn(payload).unwrap();
        notification.success({
          message: "Thêm mới yêu cầu nhập kho thành công!",
          className: "h-16",
          placement: "bottomRight",
        });
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      notification.error({
        message: "Đã xảy ra lỗi khi xử lý dữ liệu!",
        className: "h-16",
        placement: "bottomRight",
      });
    }
  };

  const handleProductChange = (value: number) => {
    const selectedProduct = productList?.results.find(
      (product: any) => product.id === value
    );
    if (selectedProduct) {
      form.setFieldsValue({
        unit: selectedProduct.unit_name,
      });
    }
  };

  return (
    <>
      <Button
        style={{
          backgroundColor: "#BD8306",
          color: "white",
          border: "none",
        }}
        onClick={showModal}
        size={edit ? "small" : "middle"}
      >
        {edit ? "Sửa" : "Thêm yêu cầu nhập kho"}
      </Button>
      <Modal
        title={title}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={onFinish}>
            Xác nhận
          </Button>,
        ]}
        destroyOnClose
        width={1289}
      >
        <Form form={form} layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Tên hàng hoá"
                name="product"
                rules={[{ required: true, message: "Vui lòng chọn hàng hoá!" }]}
              >
                <Select
                  placeholder="Chọn hàng hoá"
                  onChange={handleProductChange}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    const label = String(option?.children ?? "").toLowerCase();
                    const kw = input.toLowerCase();
                    return label.includes(kw);
                  }}
                  // Nếu list dài, ảo hoá để mượt:
                  virtual
                >
                  {productList?.results?.map((product: any) => (
                    <Option key={product.id} value={product.id}>
                      {product.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="Số lượng nhập về"
                    name="quantity"
                    rules={[
                      { required: true, message: "Vui lòng nhập số lượng!" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Đơn vị"
                    name="unit"
                    rules={[
                      {
                        required: true,
                        message: "Đơn vị không được để trống!",
                      },
                    ]}
                  >
                    <Input disabled placeholder="Đơn vị tự động hiển thị" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Đơn giá"
                    name="import_price"
                    rules={[
                      { required: true, message: "Vui lòng nhập đơn giá!" },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Nhập đơn giá"
                      formatter={(value: any) =>
                        value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value: any) => value.replace(/\D/g, "")}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Nhà cung cấp"
                name="supplier"
                rules={[
                  { required: false, message: "Vui lòng chọn nhà cung cấp!" },
                ]}
              >
                <Select placeholder="Chọn nhà cung cấp">
                  {supplierList?.results?.map((supplier: any) => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item label="Ngày nhập hàng" name="import_date">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
