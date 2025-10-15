import React, { useEffect, useState } from "react";
import { Input, Button, message, Spin, Alert } from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import {
  useGetCustomerProblemsQuery,
  useCreateCustomerProblemMutation,
  useEditCustomerProblemMutation,
  useDeleteCustomerProblemMutation,
} from "@/api/app_customer/apiMarketing";
import { skipToken } from "@reduxjs/toolkit/query";

type Props = {
  customerId: number | null;
  pageSize?: number; // optional
  onProblemChange?: (problemConcat: string) => void;
};

type Row = {
  id_backend?: number;
  problem: string;
  encounter_pain?: string;
  desire?: string;
};

export default function MedicalHistoryForm({
  customerId,
  pageSize = 50,
  onProblemChange,
}: Props) {
  const [page] = useState<number>(1);

  // Chỉ gọi API khi có customerId
  const {
    data: problems,
    isLoading,
    isError,
    refetch,
  } = useGetCustomerProblemsQuery(
    customerId ? { customerId, page, pageSize } : (skipToken as any)
  );

  const [createCustomerProblem, { isLoading: creating }] =
    useCreateCustomerProblemMutation();
  const [editCustomerProblem, { isLoading: updating }] =
    useEditCustomerProblemMutation();
  const [deleteCustomerProblem, { isLoading: deleting }] =
    useDeleteCustomerProblemMutation();

  const [medicalHistory, setMedicalHistory] = useState<Row[]>([]);

  useEffect(() => {
    if (Array.isArray(problems)) {
      const rows: Row[] = problems.map((p: any) => ({
        id_backend: p.id,
        problem: p.problem ?? "",
        encounter_pain: p.encounter_pain ?? "",
        desire: p.desire ?? "",
      }));
      setMedicalHistory(rows);

      // Nối chuỗi tất cả problem
      const problemConcat = rows
        .map((r) => r.problem)
        .filter(Boolean)
        .join(", ");
      onProblemChange?.(problemConcat);
    } else if (!customerId) {
      setMedicalHistory([]);
      onProblemChange?.("");
    }
  }, [problems, customerId, onProblemChange]);

  const addProblem = () => {
    const next = [...medicalHistory, { problem: "" }];
    setMedicalHistory(next);
    const problemConcat = next
      .map((r) => r.problem)
      .filter(Boolean)
      .join(", ");
    onProblemChange?.(problemConcat);
  };

  const handleDeleteProblem = async (index: number) => {
    const item = medicalHistory[index];
    try {
      if (item?.id_backend) {
        await deleteCustomerProblem(item.id_backend).unwrap();
      }
      setMedicalHistory((prev) => prev.filter((_, i) => i !== index));
      message.success("Xóa vấn đề thành công");
      refetch();
    } catch (e) {
      message.error("Xóa vấn đề thất bại");
    }
  };

  const handleSaveProblem = async (index: number) => {
    if (!customerId) {
      message.error("Thiếu thông tin khách hàng");
      return;
    }
    const item = medicalHistory[index];
    if (!item.problem) {
      message.error("Cần nhập đầy đủ thông tin.");
      return;
    }

    const payload = {
      customer: customerId,
      problem: item.problem,
      encounter_pain: item.encounter_pain || "",
      desire: item.desire || "",
    };

    try {
      if (item.id_backend) {
        await editCustomerProblem({ id: item.id_backend, ...payload }).unwrap();
        message.success("Cập nhật vấn đề thành công");
      } else {
        const res = await createCustomerProblem(payload).unwrap();
        const updated = [...medicalHistory];
        updated[index].id_backend = res.id;
        setMedicalHistory(updated);
        message.success("Tạo mới vấn đề thành công");
      }
      refetch();
    } catch (e) {
      message.error("Lưu vấn đề thất bại");
    }
  };

  if (!customerId) {
    return <Alert type="warning" message="Chưa chọn khách hàng." />;
  }

  if (isLoading) return <Spin className="w-full" />;

  if (isError) {
    return <Alert type="error" message="Không thể tải dữ liệu vấn đề." />;
  }

  const busy = creating || updating || deleting;

  return (
    <div className="mt-2">
      <div className="mb-2 font-medium">Tiền sử bệnh</div>
      <div className="border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 bg-gray-50 py-3 px-4 text-sm font-medium">
          <div className="col-span-1 text-center">STT</div>
          <div className="col-span-10 text-center">Vấn đề</div>
          <div className="col-span-1 text-center">Thao tác</div>
        </div>

        {/* Rows */}
        {medicalHistory.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 items-start border-t px-4 py-3 gap-2"
          >
            <div className="col-span-1 text-center pt-2">{idx + 1}</div>

            <div className="col-span-10">
              <Input
                value={row.problem}
                onChange={(e) => {
                  const updated = [...medicalHistory];
                  updated[idx].problem = e.target.value;
                  setMedicalHistory(updated);
                }}
                placeholder="Nhập vấn đề"
              />
            </div>

            <div className="col-span-1 flex gap-2 justify-center">
              <Button
                type="text"
                icon={<SaveOutlined />}
                loading={busy}
                onClick={() => handleSaveProblem(idx)}
                title={row.id_backend ? "Cập nhật" : "Lưu mới"}
              />
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                loading={busy}
                onClick={() => handleDeleteProblem(idx)}
                title="Xóa dòng"
              />
            </div>
          </div>
        ))}

        {/* Add row */}
        <div className="border-t px-4 py-4">
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addProblem}
            className="w-full"
          >
            Thêm
          </Button>
        </div>
      </div>
    </div>
  );
}
