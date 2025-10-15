import CreateCustomerClient from "@/views/business/customer/client/CreateCustomerClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <CreateCustomerClient />
    </Suspense>
  );
}
