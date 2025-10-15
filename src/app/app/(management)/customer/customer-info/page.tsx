import CustomerInfoClient from "@/views/business/customer/client/CustomerInfoClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <CustomerInfoClient />
    </Suspense>
  );
}
