import React from 'react'
import BreadcrumbFunction from '@/components/Breadcrumb/BreadcrumbFunction'
import Revenue from '@/views/business/accountant/Revenue'
import Revenue2 from '@/views/business/accountant/Revenue2'

export default function page() {
  return (
    <>
      <BreadcrumbFunction functionName="Kế toán" title="Quản lý doanh thu" />
      {/* <Revenue /> */}
      <Revenue2 />
    </>
  )
}
