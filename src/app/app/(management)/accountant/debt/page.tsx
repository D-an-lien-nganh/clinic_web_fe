import React from 'react'
import BreadcrumbFunction from '@/components/Breadcrumb/BreadcrumbFunction'
import DebtAndSurplusViews from '@/views/business/accountant/DebtAndSurplusViews'

export default function page() {
  return (
    <>
      <BreadcrumbFunction functionName="Kế toán" title="Quản lý công nợ" />
      <DebtAndSurplusViews type="debt" />
    </>
  )
}
