"use client"
import React, { useState } from "react"
import { Table, Input, Button, Typography, Space, Tag } from "antd"
import { AiOutlineFileExcel, AiOutlineFilePdf } from "react-icons/ai"
import { FiSearch } from "react-icons/fi"
import dayjs, { Dayjs } from "dayjs"
import type { ColumnsType } from "antd/es/table"
import InvoiceDetail from "./components/InvoiceDetail"
import { useGetBillsListQuery } from "@/api/app_treatment/apiTreatment"

const { Title } = Typography

interface InvoiceData {
  key: string
  index: number
  orderId: string
  fullName: string
  phoneNumber: string
  source: string
  salesPerson: string
  referralPerson: string
  nurse: string
  doctor: string
  therapist: string
  status: string
  id?: number
  email?: string
  social?: string
  socialLink?: string
  province?: string
  district?: string
  ward?: string
  address?: string
  appointmentDate?: string
  booking?: number // Thêm trường booking
}

const Invoice: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    startDate: dayjs(currentDate).format("YYYY-MM-DD"),
    endDate: dayjs(currentDate).format("YYYY-MM-DD"),
  });
  const [searchText, setSearchText] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<InvoiceData | null>(null)

  // Sử dụng hook useGetBillsListQuery để lấy dữ liệu từ API
  const { data: apiData, isLoading, error } = useGetBillsListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    startDate: pagination.startDate,
    endDate: pagination.endDate,
  });

  // Hàm ánh xạ dữ liệu từ API sang định dạng InvoiceData
  const mapDataToInvoiceData = (data: any): InvoiceData[] => {
    if (!data || !Array.isArray(data.results)) {
      console.log("Dữ liệu không hợp lệ hoặc chưa sẵn sàng, kiểm tra results:", data)
      return []
    }

    return data.results.map((item: any, index: number) => {
      console.log("Customer Details for item:", item.customer_details) // Log để kiểm tra
      console.log("Source Name for item:", item.customer_details?.source_name) // Log để kiểm tra source_name

      return {
        key: item.id.toString(),
        index: index + 1,
        orderId: item.code || "N/A",
        fullName: item.customer_details?.name || "Không xác định",
        phoneNumber: item.customer_details?.mobile || "N/A",
        source: item.customer_details?.source_details?.source_name || "N/A",
        salesPerson: item.customer_details?.marketer_full || "N/A",
        referralPerson: item.customer_details?.introducers[0]?.introducer_name || "N/A",
        nurse: item.nurse || "N/A",
        doctor: item.doctor || "N/A",
        therapist: item.doctor || "N/A",
        status: item.fully_paid ? "Đã thanh toán" : item.amount_remaining > 0 ? "Còn nợ" : "Chưa thanh toán",
        id: item.id,
        email: item.customer_details?.email || "N/A",
        social: item.customer_details?.source_details?.source_name || "N/A",
        socialLink: item.customer_details?.source_details?.source_link || "N/A",
        province: item.customer_details?.city || "N/A",
        district: item.customer_details?.ward || "N/A",
        ward: item.customer_details?.district || "N/A",
        address: item.customer_details?.address || "N/A",
        appointmentDate: item.created ? dayjs(item.created).format("DD/MM/YYYY") : "N/A",
        booking: item.booking || undefined // Thêm ánh xạ trường booking từ API
      }
    })
  }

  // Dữ liệu đã ánh xạ
  const dataSource = mapDataToInvoiceData(apiData)

  console.log("hehehehehe:", dataSource)

  const handleExportExcel = () => {
    console.log("Exporting to Excel")
  }

  const handleExportPDF = () => {
    console.log("Exporting to PDF")
  }

  const handleOpenModal = (record: InvoiceData) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRecord(null)
  }

  const columns: ColumnsType<InvoiceData> = [
    {
      title: "#",
      dataIndex: "index",
      key: "index"
    },
    {
      title: "Mã đơn",
      dataIndex: "orderId",
      key: "orderId"
    },
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text, record) => (
        <a className='text-blue-600 hover:underline' onClick={() => handleOpenModal(record)}>
          {text}
        </a>
      )
    },
    {
      title: "SĐT",
      dataIndex: "phoneNumber",
      key: "phoneNumber"
    },
    {
      title: "Nguồn",
      dataIndex: "source",
      key: "source"
    },
    {
      title: "Người tiếp thị",
      dataIndex: "salesPerson",
      key: "salesPerson"
    },
    {
      title: "Người giới thiệu",
      dataIndex: "referralPerson",
      key: "referralPerson"
    },
    {
      title: "Y tá tiếp nhận",
      dataIndex: "nurse",
      key: "nurse"
    },
    {
      title: "Bác sĩ khám",
      dataIndex: "doctor",
      key: "doctor"
    },
    {
      title: "Chuyên gia trị liệu",
      dataIndex: "therapist",
      key: "therapist"
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "blue"
        if (status === "Đã thanh toán") color = "green"
        else if (status === "Chưa thanh toán") color = "volcano"
        else if (status === "Còn nợ") color = "orange"
        return <Tag color={color}>{status}</Tag>
      }
    }
  ]

  if (error) {
    console.error("Lỗi khi lấy dữ liệu từ API:", error)
  }

  return (
    <div className='min-h-[calc(100vh-70px)] p-6'>
      <div className='flex justify-between items-center mb-6'>
        <Title level={3} className='m-0 flex items-center gap-2'>
          🧾 Hóa đơn khách hàng
        </Title>
        <Space size='middle'>
          <Input
            type='text'
            placeholder='Nhập mã KH, tên, SĐT, email'
            className='rounded-lg w-[300px]'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<FiSearch className='text-gray-400' size={18} />}
          />
          <Button
            type='primary'
            icon={<AiOutlineFileExcel size={20} />}
            className='bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600'
            onClick={handleExportExcel}
          >
            Xuất Excel
          </Button>
          <Button type='primary' danger icon={<AiOutlineFilePdf size={20} />} onClick={handleExportPDF}>
            Xuất PDF
          </Button>
        </Space>
      </div>

      <Table
        dataSource={dataSource.filter((item) =>
          Object.values(item).some((value) => value?.toString().toLowerCase().includes(searchText.toLowerCase()))
        )}
        columns={columns}
        pagination={{ pageSize: 5 }}
        bordered
        loading={isLoading}
      />
      <InvoiceDetail visible={isModalOpen} onCancel={handleCloseModal} data={selectedRecord} />
    </div>
  )
}

export default Invoice
