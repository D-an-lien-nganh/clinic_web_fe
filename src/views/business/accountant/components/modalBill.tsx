// file: modalBill.tsx
"use client";
import { Table } from "antd";
import { useGetBillsByIdQuery, useGetUsedProductServiceByIdQuery } from "@/api/app_treatment/apiTreatment";

interface ContentModalProps {
  billId: number | null;
  type: string | null;
  paidProductFee: number | null;
  paidServiceFee: number | null;
  totalServiceAmount: number | null; // Nhận total_service_amount từ Revenue
  totalProductAmount: number | null; // Nhận total_product_amount từ Revenue
}

export default function ContentModal({
  billId,
  type,
  paidProductFee,
  paidServiceFee,
  totalServiceAmount: propsTotalServiceAmount,
  totalProductAmount: propsTotalProductAmount,
}: ContentModalProps) {
  const { data: billDetails, isLoading: isBillLoading, error: billError } = useGetBillsByIdQuery(
    billId?.toString() || "",
    { skip: !billId }
  );
  const { data: usedProductsServices, isLoading: isProductsLoading, error: productsError } =
    useGetUsedProductServiceByIdQuery(billId?.toString() || "", { skip: !billId });

  // Xử lý dữ liệu cho bảng "Đơn thuốc"
  const drugDataSource = type === "both" && Array.isArray(usedProductsServices?.products) && usedProductsServices.products.length > 0
    ? usedProductsServices.products.map((item: any, index: number) => ({
      key: item.id || index.toString(),
      stt: index + 1,
      drugName: item.name || "N/A",
      quantity: item.unit || 0,
      unit: item.unit_name || "N/A",
      price: parseFloat(item.sell_price) || 0,
      coin: parseFloat(item.sell_price) || 0,
    }))
    : [];

  // Xử lý dữ liệu cho bảng "Đơn dịch vụ"
  const serviceDataSource = (type === "service" || type === "both") && Array.isArray(usedProductsServices?.services) && usedProductsServices.services.length > 0
    ? usedProductsServices.services.map((item: any, index: number) => ({
      key: item.id || index.toString(),
      stt: index + 1,
      serviceName: item.name || "N/A",
      quantity: item.unit || 0,
      unit: item.unit_name || "N/A",
      price: parseFloat(item.price) || 0,
    }))
    : [];

  // Sử dụng total_service_amount và total_product_amount từ props
  const totalDrugAmount = propsTotalProductAmount !== null ? propsTotalProductAmount : 0;
  const totalServiceAmount = propsTotalServiceAmount !== null ? propsTotalServiceAmount : 0;

  // Tổng tiền thanh toán = paidProductFee + paidServiceFee
  const paidProduct = paidProductFee !== null ? paidProductFee : 0;
  const paidService = paidServiceFee !== null ? paidServiceFee : 0;
  const totalBillAmount = paidProduct + paidService;

  if (isBillLoading || isProductsLoading) {
    return <div>Đang tải...</div>;
  }

  if (billError || productsError) {
    return <div>Có lỗi xảy ra khi tải dữ liệu hóa đơn hoặc sản phẩm/dịch vụ.</div>;
  }

  if (!billId || (!usedProductsServices && !billDetails)) {
    return <div>Không có dữ liệu hóa đơn hoặc sản phẩm/dịch vụ để hiển thị.</div>;
  }

  return (
    <div>
      <h3 style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Tổng tiền thanh toán: {totalBillAmount.toLocaleString()} VND</span>
      </h3>

      {type === "both" && (
        <>
          <h4>Đơn thuốc</h4>
          <Table
            className="custom-table-bill"
            dataSource={drugDataSource}
            columns={drugColumns}
            pagination={{ pageSize: 5 }}
          />
          <div style={{ marginTop: 16 }}>
            <p><strong>Tổng tiền thuốc:</strong> {totalDrugAmount.toLocaleString()} VND</p>
            <p><strong>Đã thanh toán:</strong> {paidProduct.toLocaleString()} VND</p>
          </div>
        </>
      )}

      {(type === "service" || type === "both") && (
        <>
          <h4>Đơn dịch vụ</h4>
          <Table
            className="custom-table-bill"
            dataSource={serviceDataSource}
            columns={serviceColumns}
            pagination={{ pageSize: 5 }}
          />
          <div style={{ marginTop: 16 }}>
            <p><strong>Tổng tiền dịch vụ:</strong> {totalServiceAmount.toLocaleString()} VND</p>
            <p><strong>Đã thanh toán:</strong> {paidService.toLocaleString()} VND</p>
          </div>
        </>
      )}
    </div>
  );
}

const drugColumns = [
  { title: "STT", dataIndex: "stt", },
  { title: "Tên thuốc", dataIndex: "drugName", },
  { title: "Số lượng", dataIndex: "quantity", },
  { title: "Đơn vị", dataIndex: "unit", },
  {
    title: "Đơn giá",
    dataIndex: "price",
    render: (price: number) => price.toLocaleString() + " VND",
  },
  {
    title: "Thành tiền",
    dataIndex: "coin",
    render: (coin: number) => coin.toLocaleString() + " VND",
  },
];

const serviceColumns = [
  { title: "STT", dataIndex: "stt", },
  { title: "Tên dịch vụ", dataIndex: "serviceName", },
  { title: "Số lượng", dataIndex: "quantity", },
  { title: "Đơn vị", dataIndex: "unit", },
  {
    title: "Số tiền",
    dataIndex: "price",
    render: (price: number, record: any) =>
      (price * (record.quantity || 1)).toLocaleString() + " VND",
  },
];