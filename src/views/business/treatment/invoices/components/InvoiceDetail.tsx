"use client"
import React, { useState, useEffect } from "react"
import { Modal, Form, Row, Col, Input, Radio, DatePicker, Typography, Table, Button } from "antd"
import dayjs from "dayjs"
import { useGetBillsByIdQuery } from "@/api/app_treatment/apiTreatment"

// Định nghĩa kiểu dữ liệu cho InvoiceData
export interface InvoiceData {
  id?: number
  orderId?: string
  fullName?: string
  gender?: "Nam" | "Nữ" | "Khác"
  dob?: string // dd/MM/YYYY
  source?: string
  serviceRequest?: string
  code1?: string
  code2?: string
  phoneNumber?: string
  email?: string
  social?: string
  socialLink?: string
  province?: string
  district?: string
  ward?: string
  address?: string
  appointmentDate?: string // dd/MM/YYYY
  paymentStatus?: string
}

interface InvoiceDetailProps {
  visible: boolean
  onCancel: () => void
  data: InvoiceData | null
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ visible, onCancel, data }) => {
  const [treatmentData, setTreatmentData] = useState<any[]>([])
  const [medicationData, setMedicationData] = useState<any[]>([]) // Cập nhật state để thay đổi dữ liệu

  // Gọi API để lấy chi tiết hóa đơn dựa trên ID
  const { data: billDetail, isLoading: isBillLoading } = useGetBillsByIdQuery(data?.id?.toString()!, {
    skip: !data?.id
  })

  // Cập nhật dữ liệu chi tiết điều trị và thuốc từ useGetBillByIdQuery
  useEffect(() => {
    if (billDetail) {
      // Cập nhật dữ liệu điều trị
      if (billDetail.treatment_request) {
        const mappedTreatmentData = billDetail.treatment_request.map((treatment: any, index: number) => ({
          key: (index + 1).toString(),
          stt: index + 1,
          content: treatment.service_details?.service_name || "N/A",
          quantity: treatment.service_details?.service_number || 0,
          unit: treatment.service_details?.service_unit || "N/A",
          price: treatment.service_details?.service_number
            ? (billDetail.total_service_amount / treatment.service_details.service_number).toLocaleString("vi-VN")
            : "0"
        }))
        setTreatmentData(mappedTreatmentData)
      }

      // Cập nhật dữ liệu thuốc từ doctor_process_details
      if (billDetail.doctor_process_details?.diagnosis_medicines) {
        const mappedMedicationData = billDetail.doctor_process_details.diagnosis_medicines.map(
          (medicine: any, index: number) => ({
            key: (index + 1).toString(),
            stt: index + 1,
            name: medicine.product_name || "N/A",
            quantity: medicine.quantity || 0,
            unit: medicine.unit_str || "N/A",
            dosage: medicine.dose || "N/A",
            price: Number(medicine.price).toLocaleString("vi-VN") || "0"
          })
        )
        setMedicationData(mappedMedicationData)
      }
    }
  }, [billDetail])

  if (!data) return null

  // Dữ liệu từ API hoặc props
  const orderId = data.orderId ?? "N/A"
  const fullName = billDetail?.customer_details?.name ?? data.fullName ?? "Không xác định"

  // Ánh xạ giới tính từ "MA", "FE", "OT" sang "Nam", "Nữ", "Khác"
  const genderMap: { [key: string]: string } = {
    MA: "Nam",
    FE: "Nữ",
    OT: "Khác"
  }
  const rawGender = billDetail?.customer_details?.gender ?? data?.gender ?? "MA"
  const genderValue = genderMap[rawGender] || "Nam"

  const dateOfBirth = billDetail?.customer_details?.dob
    ? dayjs(billDetail.customer_details.dob, "DD/MM/YYYY")
    : dayjs("01/01/1990", "DD/MM/YYYY")
  const source = billDetail?.customer_details?.source_details?.source_name ?? "N/A"
  const serviceRequest = billDetail?.treatment_request[0]?.service_details?.service_name ?? "N/A"
  const code1 = billDetail?.code ?? "N/A"
  const code2 = billDetail?.booking ? `Booking ID: ${billDetail.booking}` : "N/A"

  const phoneNumber = billDetail?.customer_details?.mobile ?? "N/A"
  const email = billDetail?.customer_details?.email ?? "N/A"
  const social = billDetail?.customer_details?.source_details?.source_name ?? "N/A"
  const socialLink = billDetail?.customer_details?.source_details?.source_link ?? "N/A"

  const province = billDetail?.customer_details?.city ?? "N/A"
  const district = billDetail?.customer_details?.ward ?? "N/A"
  const ward = billDetail?.customer_details?.district ?? "N/A"
  const address = billDetail?.customer_details?.address ?? "N/A"

  let appointmentDateValue = dayjs("01/01/1990", "DD/MM/YYYY")
  if (data.appointmentDate) {
    appointmentDateValue = dayjs(data.appointmentDate, "DD/MM/YYYY")
    if (!appointmentDateValue.isValid()) {
      console.error("Invalid appointmentDate from data:", data.appointmentDate)
      appointmentDateValue = dayjs(new Date())
    }
  } else if (billDetail?.created) {
    appointmentDateValue = dayjs(billDetail.created)
    if (!appointmentDateValue.isValid()) {
      console.error("Invalid created date from billDetail:", billDetail.created)
      appointmentDateValue = dayjs(new Date())
    }
  } else {
    appointmentDateValue = dayjs(new Date())
  }

  const paymentStatus = billDetail?.fully_paid ? "Đã thanh toán" : "Còn nợ"

  // Bảng "Hóa đơn thuốc"
  const medicationColumns = [
    { title: "STT", dataIndex: "stt", key: "stt", width: 60 },
    { title: "Tên thuốc", dataIndex: "name", key: "name" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity", width: 90 },
    { title: "Đơn vị", dataIndex: "unit", key: "unit", width: 80 },
    { title: "Liều lượng", dataIndex: "dosage", key: "dosage" },
    { title: "Số tiền (VNĐ)", dataIndex: "price", key: "price", width: 130 }
  ]

  // Bảng "Hóa đơn điều trị"
  const treatmentColumns = [
    { title: "STT", dataIndex: "stt", key: "stt", width: 60 },
    { title: "Nội dung", dataIndex: "content", key: "content" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity", width: 80 },
    { title: "Đơn vị", dataIndex: "unit", key: "unit", width: 80 },
    { title: "Số tiền (VNĐ)", dataIndex: "price", key: "price", width: 130 }
  ]

  // Tính toán tổng tiền cho hóa đơn thuốc
  const totalMedicationAmount = billDetail?.total_product_amount?.toLocaleString("vi-VN") ?? "0"
  const discountMedicationAmount = billDetail?.doctor_process_details?.medicine_discount?.toLocaleString("vi-VN") ?? "0"
  const finalMedicationAmount = (
    (billDetail?.total_product_amount || 0) - (billDetail?.doctor_process_details?.medicine_discount || 0)
  ).toLocaleString("vi-VN")

  // Tính toán tổng tiền cho hóa đơn điều trị
  const totalTreatmentAmount = billDetail?.total_service_amount?.toLocaleString("vi-VN") ?? "0"
  const discountTreatmentAmount = "0" // Giả sử không có giảm giá cho dịch vụ trong dữ liệu
  const finalTreatmentAmount = billDetail?.total_service_amount?.toLocaleString("vi-VN") ?? "0"

  const totalInvoiceAmount = billDetail?.total_amount?.toLocaleString("vi-VN") ?? "0"
  const paidAmount = billDetail?.paid_ammount?.toLocaleString("vi-VN") ?? "0"
  const remainingAmount = billDetail?.amount_remaining?.toLocaleString("vi-VN") ?? "0"

  return (
    <Modal title={`Đơn khám: ${orderId}`} open={visible} onCancel={onCancel} footer={null} width={"60vw"}>
      <Form layout='vertical'>
        {/* Hàng 1: Họ tên, Giới tính, Ngày sinh */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label='Họ tên khách hàng'>
              <Input value={fullName} disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label='Giới tính'>
              <Radio.Group value={genderValue} disabled>
                <Radio value='Nam'>Nam</Radio>
                <Radio value='Nữ'>Nữ</Radio>
                <Radio value='Khác'>Khác</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label='Ngày sinh'>
              <DatePicker format='DD/MM/YYYY' value={dateOfBirth} disabled style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 2: Nguồn KH, Yêu cầu dịch vụ, Mã đơn 1, Mã đơn 2 */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label='Nguồn khách hàng'>
              <Input value={source} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Yêu cầu dịch vụ'>
              <Input value={serviceRequest} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Mã đơn 1'>
              <Input value={code1} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Mã đơn 2'>
              <Input value={code2} disabled />
            </Form.Item>
          </Col>
        </Row>

        {/* Tiêu đề Thông tin liên hệ */}
        <Row style={{ marginTop: 8 }}>
          <Col span={24}>
            <Typography.Title level={5}>Thông tin liên hệ</Typography.Title>
          </Col>
        </Row>

        {/* Hàng 3: SĐT, Email, Mạng xã hội, Link */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label='SĐT'>
              <Input value={phoneNumber} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Email'>
              <Input value={email} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Mạng xã hội'>
              <Input value={social} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Link'>
              <Input value={socialLink} disabled />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 4: Địa chỉ */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label='Tỉnh/Thành phố'>
              <Input value={province} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Quận/Huyện'>
              <Input value={district} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Phường/Xã'>
              <Input value={ward} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Số nhà, địa chỉ'>
              <Input value={address} disabled />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 5: Ngày hẹn, Thanh toán hóa đơn */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label='Ngày hẹn'>
              <DatePicker format='DD/MM/YYYY' value={appointmentDateValue} disabled style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={18}>
            <Form.Item label='Thanh toán hóa đơn'>
              <Input value={paymentStatus} disabled />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* Hóa đơn thuốc */}
      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Hóa đơn thuốc
      </Typography.Title>
      <Table
        columns={medicationColumns}
        dataSource={medicationData}
        pagination={false}
        bordered
        style={{ marginBottom: 16 }}
        summary={() => (
          <>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align='right'>
                Tổng tiền
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{totalMedicationAmount}</Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align='right'>
                Số tiền được giảm
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{discountMedicationAmount}</Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align='right'>
                Thành tiền
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{finalMedicationAmount}</Table.Summary.Cell>
            </Table.Summary.Row>
          </>
        )}
        loading={isBillLoading}
      />

      {/* Hóa đơn điều trị */}
      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Hóa đơn điều trị
      </Typography.Title>
      <Table
        columns={treatmentColumns}
        dataSource={treatmentData}
        pagination={false}
        bordered
        style={{ marginBottom: 16 }}
        summary={() => (
          <>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4} align='right'>
                Tổng tiền
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{totalTreatmentAmount}</Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4} align='right'>
                Số tiền được giảm
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{discountTreatmentAmount}</Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4} align='right'>
                Thành tiền
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{finalTreatmentAmount}</Table.Summary.Cell>
            </Table.Summary.Row>
          </>
        )}
        loading={isBillLoading}
      />

      {/* Thông tin thanh toán tổng */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <div>
            <strong>Tổng hóa đơn:</strong> {totalInvoiceAmount}
          </div>
        </Col>
        <Col span={8}>
          <div>
            <strong>Đã thanh toán:</strong> {paidAmount}
          </div>
        </Col>
        <Col span={8}>
          <div>
            <strong>Số tiền còn lại:</strong> {remainingAmount}
          </div>
        </Col>
      </Row>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Button style={{ marginRight: 8 }}>In</Button>
        <Button type='primary'>Gửi chuyên gia</Button>
      </div>
    </Modal>
  )
}

export default InvoiceDetail
