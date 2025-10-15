import { useGetAllUserQuery } from "@/api/app_home/apiAccount";
import {
  useCreateStockOutMutation,
  useEditStockOutMutation,
  useGetProductListQuery,
  useGetStockOutQuery,
  useGetStockInListQuery,
} from "@/api/app_product/apiService";
import { useGetCustomerListQuery } from "@/api/app_customer/apiMarketing"; 
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
} from "antd";
import dayjs from "dayjs";
import React, { useState, useEffect } from "react";

const { Option } = Select;

export default function AddAndUpdateStockOut({
  id,
  title,
  edit,
  viewMode = false,
  record,
}: {
  id?: number;
  title?: string;
  edit?: boolean;
  viewMode?: boolean;
  record?: any;
}) {
  const [form] = Form.useForm();
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: productList } = useGetProductListQuery(
    {},
    { skip: !shouldFetch }
  );

  // ✅ LẤY DANH SÁCH KHÁCH HÀNG (THAY NHÀ CUNG CẤP)
  const { data: customerResp } = useGetCustomerListQuery(undefined, {
    skip: !shouldFetch,
  });

  const { data: stockInList } = useGetStockInListQuery(undefined, {
    skip: !shouldFetch,
  });

  const { data: allUser } = useGetAllUserQuery(undefined, {
    skip: !shouldFetch || !isModalOpen,
  });

  const [createStockOut] = useCreateStockOutMutation();
  const [editStockOut] = useEditStockOutMutation();
  const { data: stockOutData } = useGetStockOutQuery(id, {
    skip: !id || !isModalOpen,
  });

  const productIndex = React.useMemo(() => {
    const m = new Map<number, any>();
    productList?.results?.forEach((p: any) => m.set(Number(p.id), p));
    return m;
  }, [productList]);

  const toId = (v: any) => Number(v?.id ?? v);

  // Build danh sách KH từ API (chịu được cả results và mảng phẳng)
  const customers: any[] = React.useMemo(
    () => (customerResp?.results ?? customerResp ?? []) as any[],
    [customerResp]
  );

  const customerOptions = React.useMemo(
    () =>
      customers.map((c: any) => ({
        id: c.id,
        label:
          c?.full_name?.full_name ||
          c?.full_name ||
          c?.name ||
          c?.customer_name ||
          `KH #${c.id}`,
      })),
    [customers]
  );

  // Tạo danh sách sản phẩm từ stockInList
  const availableProducts = React.useMemo(() => {
    if (!stockInList?.results) return [];
    const seen = new Map<number, any>();

    stockInList.results.forEach((r: any) => {
      const id = toId(r.product);
      if (!id) return;

      const p = productIndex.get(id) ?? r.product ?? {};
      const name = r.product_name ?? p?.name ?? "";
      const unit_name = p?.unit_name ?? r?.unit_name ?? "";
      const sell_price = p?.sell_price ?? r?.sell_price ?? 0;

      if (!seen.has(id)) {
        seen.set(id, { id, name, unit_name, sell_price });
      }
    });

    return Array.from(seen.values());
  }, [stockInList, productIndex]);

  // Prefill khi edit / view
  React.useEffect(() => {
    if ((edit || viewMode) && stockOutData) {
      const pid = toId(stockOutData.product);
      const p =
        availableProducts.find((x: any) => x.id === pid) ||
        productIndex.get(pid);

      form.setFieldsValue({
        unit: p?.unit_name || stockOutData.unit || "",
        export_date: stockOutData.export_date
          ? dayjs(stockOutData.export_date)
          : null,
        product: pid,
        // ✅ DÙNG customer thay vì supplier
        customer: stockOutData.customer?.id ?? stockOutData.customer,
        original_stockout_price:
          Number(stockOutData.actual_stockout_price) *
          Number(stockOutData.quantity),
      });
    }
  }, [edit, viewMode, stockOutData, availableProducts, productIndex, form]);

  // Auto tính lại tổng khi quantity/price đổi (nếu cần)
  useEffect(() => {
    const quantity = form.getFieldValue("quantity");
    const actualPrice = form.getFieldValue("actual_stockout_price");
    if (quantity && actualPrice) {
      form.setFieldsValue({
        original_stockout_price: Number(actualPrice) * Number(quantity),
      });
    }
  }, [form]);

  const showModal = () => {
    setIsModalOpen(true);
    setShouldFetch(true);
    if ((edit || viewMode) && stockOutData) {
      const selectedProduct = availableProducts.find(
        (p: any) => p.id === (stockOutData.product?.id || stockOutData.product)
      );
      form.setFieldsValue({
        ...stockOutData,
        export_date: stockOutData.export_date
          ? dayjs(stockOutData.export_date)
          : null,
        product: stockOutData.product?.id || stockOutData.product,
        // ✅ Prefill customer
        customer: stockOutData.customer?.id || stockOutData.customer,
        unit: selectedProduct?.unit_name || stockOutData.unit || "",
        original_stockout_price:
          stockOutData.actual_stockout_price * stockOutData.quantity,
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
    if (viewMode) return;

    try {
      const validatedValues = await form.validateFields();

      // Kiểm tra tồn kho
      const selectedProductId = validatedValues.product;
      const requestedQuantity = Number(validatedValues.quantity);

      const stockInRecords =
        stockInList?.results?.filter(
          (record: any) =>
            (record.product?.id || record.product) === selectedProductId
        ) || [];

      const totalStockIn = stockInRecords.reduce(
        (total: number, record: any) => total + Number(record.quantity),
        0
      );

      if (!stockInRecords.length || totalStockIn <= 0) {
        notification.error({
          message:
            "Sản phẩm này không tồn tại trong kho. Vui lòng kiểm tra lại.",
          className: "h-16",
          placement: "bottomRight",
        });
        return;
      }

      if (requestedQuantity > totalStockIn) {
        notification.error({
          message: `Số lượng tồn kho không đủ! Hiện tại chỉ có ${totalStockIn} sản phẩm trong kho.`,
          className: "h-16",
          placement: "bottomRight",
        });
        return;
      }

      // ✅ GỬI customer thay vì supplier
      const payload: any = {
        product: String(validatedValues.product),
        export_date: validatedValues.export_date?.format("YYYY-MM-DD"),
        quantity: Number(validatedValues.quantity),
        type: validatedValues.type,
        actual_stockout_price: Number(validatedValues.actual_stockout_price),
        // chỉ gửi nếu có
        approver: validatedValues.approver
          ? String(validatedValues.approver)
          : undefined,
        note: validatedValues.note,
      };

      // nếu là khách hàng thì mới kèm customer
      if (validatedValues.type === "customer" && validatedValues.customer) {
        payload.customer = String(validatedValues.customer);
      }

      if (edit && id) {
        await editStockOut({ id, ...payload }).unwrap();
        notification.success({
          message: "Yêu cầu xuất kho đã được cập nhật!",
          className: "h-16",
          placement: "bottomRight",
        });
      } else {
        await createStockOut(payload).unwrap();
        notification.success({
          message: "Đã xuất kho thành công!",
          className: "h-16",
          placement: "bottomRight",
        });
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      let errorMessage = "Đã xảy ra lỗi khi xuất kho!";
      if (error?.data?.message) errorMessage = error.data.message;
      else if (error?.message) errorMessage = error.message;

      notification.error({
        message: errorMessage,
        className: "h-16",
        placement: "bottomRight",
      });
      console.error("Error during stock out:", error);
    }
  };

  const handleProductChange = (value: number) => {
    const pid = Number(value);
    const p =
      availableProducts.find((x: any) => x.id === pid) || productIndex.get(pid);
    form.setFieldsValue({ unit: p?.unit_name || "" });

    const q = Number(form.getFieldValue("quantity") || 0);
    if (p?.sell_price && q) {
      form.setFieldsValue({
        original_stockout_price: Number(p.sell_price) * q,
      });
    }
  };

  const handlePriceOrQuantityChange = () => {
    const quantity = form.getFieldValue("quantity");
    const actualPrice = form.getFieldValue("actual_stockout_price");
    if (quantity && actualPrice) {
      form.setFieldsValue({
        original_stockout_price: Number(actualPrice) * Number(quantity),
      });
    }
  };

  return (
    <>
      {viewMode ? (
        <div onClick={showModal}>{record?.original_stockout_price}</div>
      ) : (
        <Button
          style={{ backgroundColor: "#BD8306", color: "white", border: "none" }}
          onClick={showModal}
        >
          {edit ? "Sửa" : "Thêm yêu cầu xuất kho"}
        </Button>
      )}

      <Modal
        title={title}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          viewMode
            ? null
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
        width={1000}
      >
        <Form form={form} layout="vertical">
          {/* 1) Tên hàng hóa */}
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Tên hàng hoá"
                name="product"
                rules={[{ required: true, message: "Vui lòng chọn hàng hoá!" }]}
              >
                <Select
                  placeholder="Chọn hàng hoá"
                  onChange={handleProductChange}
                  disabled={viewMode || edit}
                  showSearch
                  optionFilterProp="label"
                >
                  {availableProducts.map((product: any) => (
                    <Option
                      key={product.id}
                      value={product.id}
                      label={product.name}
                    >
                      {product.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* 2) Đối tượng xuất */}
            <Col span={8}>
              <Form.Item
                label="Đối tượng xuất"
                name="type"
                rules={[
                  { required: true, message: "Vui lòng chọn đối tượng xuất!" },
                ]}
              >
                <Select
                  placeholder="Chọn đối tượng"
                  disabled={viewMode}
                  onChange={(val) => {
                    // nếu chuyển sang nội bộ thì cho phép bỏ trống khách hàng
                    if (val === "employee") {
                      form.validateFields(["customer"]).catch(() => {});
                    }
                  }}
                >
                  <Option value="customer">Khách hàng</Option>
                  <Option value="employee">Nội bộ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Khách hàng"
                name="customer"
                dependencies={["type"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (viewMode || edit) return Promise.resolve();
                      const isCustomer = getFieldValue("type") === "customer";
                      if (isCustomer && !value) {
                        return Promise.reject(
                          new Error("Vui lòng chọn khách hàng!")
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Select
                  placeholder="Chọn khách hàng"
                  disabled={viewMode || edit}
                  showSearch
                  optionFilterProp="label"
                  allowClear
                >
                  {customerOptions.map((c) => (
                    <Option key={c.id} value={c.id} label={c.label}>
                      {c.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 4) Ngày xuất hàng, 5) Số lượng, 6) Đơn vị */}
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Ngày xuất hàng"
                name="export_date"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày xuất hàng!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} disabled={viewMode} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Số lượng"
                name="quantity"
                rules={[{ required: true, message: "Vui lòng nhập số lượng!" }]}
              >
                <Input
                  type="number"
                  disabled={viewMode}
                  onChange={handlePriceOrQuantityChange}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Đơn vị"
                name="unit"
                rules={[
                  { required: true, message: "Đơn vị không được để trống!" },
                ]}
              >
                <Input disabled placeholder="Đơn vị tự động hiển thị" />
              </Form.Item>
            </Col>
          </Row>

          {/* 7) Đơn giá xuất (thay cho Giá gốc), 8) Thành tiền (thay cho Giá xuất) */}
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Đơn giá xuất"
                name="actual_stockout_price" // giữ nguyên field, đổi nhãn
                rules={[
                  { required: true, message: "Vui lòng nhập đơn giá xuất!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (viewMode) return Promise.resolve();
                      const quantity = Number(getFieldValue("quantity") || 0);
                      const pid = Number(getFieldValue("product"));
                      const p =
                        availableProducts.find((x: any) => x.id === pid) ||
                        productIndex.get(pid);
                      const baseUnitPrice = Number(p?.sell_price || 0);
                      // Logic cũ: không cho đơn giá thực tế < đơn giá gốc
                      if (value && Number(value) < baseUnitPrice) {
                        return Promise.reject(
                          new Error(
                            `Đơn giá xuất không được nhỏ hơn đơn giá gốc (${baseUnitPrice}).`
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input
                  type="number"
                  disabled={viewMode}
                  onChange={handlePriceOrQuantityChange}
                  placeholder="Nhập đơn giá xuất"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Thành tiền"
                name="original_stockout_price" // giữ nguyên field, đổi nhãn
                rules={[
                  { required: true, message: "Thành tiền được tính tự động!" },
                ]}
              >
                <Input
                  type="number"
                  disabled
                  placeholder="Tự động tính = Số lượng × Đơn giá"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ViewMode đặc biệt */}
          {viewMode &&
            form.getFieldValue("status") === "stocked_out_missing" && (
              <>
                <div className="text-lg font-bold">Thông tin xuất thiếu</div>
                <Form.Item
                  label="Lý do xuất thiếu"
                  name="missing_reason"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập lý do xuất thiếu!",
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập lý do xuất thiếu"
                    disabled
                  />
                </Form.Item>
                <Form.Item
                  label="Số lượng thực tế đã xuất"
                  name="actual_quantity"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập số lượng thực tế đã xuất!",
                    },
                  ]}
                >
                  <Input
                    type="number"
                    placeholder="Nhập số lượng thực tế đã xuất"
                    disabled
                  />
                </Form.Item>
              </>
            )}
        </Form>
      </Modal>
    </>
  );
}
