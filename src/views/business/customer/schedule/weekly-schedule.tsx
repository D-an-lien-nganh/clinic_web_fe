"use client";

import React, { useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import localizedFormat from "dayjs/plugin/localizedFormat";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilter3Line,
} from "react-icons/ri";
import { Select, Button, Dropdown } from "antd";
import AppointmentModal from "../modal/AppointmentModal";
import type { MenuProps } from "antd/lib";

dayjs.extend(isoWeek);
dayjs.extend(localizedFormat);

// Booking types (backend)
export type BookingType = "examination" | "treatment_cure" | "treatment_relax" | "re_examination";

export type ScheduleEvent = {
  id: string | number;
  datetime: string;           // "YYYY-MM-DDTHH:mm:ss"
  customer: number;         // ⬅️ thêm để set vào modal edit
  customerName: string;
  type: BookingType;
  note?: string;              // ⬅️ nếu có ghi chú
  status?: "normal" | "conflict";
};

type Props = {
  events: ScheduleEvent[];
  onCreateNew?: () => void;
  onEventClick?: (evt: ScheduleEvent) => void;

  // Handlers ngoài (nếu cần dùng ở parent)
  onViewEvent?: (evt: ScheduleEvent) => void;
  onEditEvent?: (evt: ScheduleEvent) => void;
  onCancelEvent?: (evt: ScheduleEvent) => void;

  // Week navigation props
  weekStart: Dayjs;
  onWeekStartChange: (weekStart: Dayjs) => void;

  // Filter props
  search: string;
  onSearchChange: (search: string) => void;
  typeFilter: "all" | BookingType;
  onTypeFilterChange: (type: "all" | BookingType) => void;
};

// Nhãn hiển thị theo yêu cầu
const TYPE_LABELS: Record<BookingType, string> = {
  examination: "Khám và tư vấn",
  treatment_cure: "Trị liệu chữa bệnh",
  treatment_relax: "Trị liệu dưỡng sinh",
  re_examination: "Tái khám",
};

const WEEKDAY_LABELS = ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","Chủ nhật"];

// Kiểu dữ liệu truyền vào AppointmentModal khi edit
type EditingForModal = {
  id: number;
  customer: number;
  type: BookingType;
  receiving_day: string; // YYYY-MM-DD
  set_date: string;      // HH:mm:ss
  note?: string;
};

export default function WeeklySchedule({
  events,
  onCreateNew,
  onViewEvent,
  onEditEvent,
  onCancelEvent,
  onEventClick,
  weekStart,
  onWeekStartChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}: Props) {
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day")),
    [weekStart]
  );
  const weekEnd = useMemo(() => weekStart.add(6, "day"), [weekStart]);

  // ⬇️ State điều khiển modal tạo/sửa
  const [openAppointment, setOpenAppointment] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [editing, setEditing] = React.useState<EditingForModal | null>(null);
  const [defaultCustomerId, setDefaultCustomerId] = React.useState<number | null>(null);

  const headerRange = useMemo(() => {
    const left = weekStart.format("MMM D");
    const right = weekEnd.format("D, YYYY");
    return `${left} – ${right}`;
  }, [weekStart, weekEnd]);

  // Filter events theo tuần hiện tại
  const weekEvents = useMemo(() => {
    return events.filter((e) => dayjs(e.datetime).isSame(weekStart, "week"));
  }, [events, weekStart]);

  const eventsByDay = useMemo(() => {
    return weekDays.map((d) =>
      weekEvents
        .filter((e) => dayjs(e.datetime).isSame(d, "day"))
        .sort((a, b) => dayjs(a.datetime).valueOf() - dayjs(b.datetime).valueOf())
    );
  }, [weekEvents, weekDays]);

  // ⬇️ Handlers mở modal
  const openCreateModal = () => {
    setModalMode("create");
    setEditing(null);
    setOpenAppointment(true);
  };

  const openEditModalFromEvent = (evt: ScheduleEvent) => {
    const d = dayjs(evt.datetime);

    console.log("[EDIT] evt.customer =", evt.customer, "typeof:", typeof evt.customer);

    const data: EditingForModal = {
      id: Number(evt.id),
      customer: evt.customer,
      type: evt.type,
      receiving_day: d.format("YYYY-MM-DD"),
      set_date: d.format("HH:mm:ss"),
      note: evt.note ?? "",
    };
    setModalMode("edit");
    setEditing(data);
    setDefaultCustomerId(evt.customer);
    setOpenAppointment(true);
  };

  return (
    <div className="w-full">
      {/* Row 1: Title + CTA */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Lịch hẹn</h2>

        <Button
          type="primary"
          className="rounded-xl bg-amber-500 hover:bg-amber-600 border-amber-500 hover:border-amber-600"
          onClick={openCreateModal}
        >
          Tạo lịch hẹn mới
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Left: filters */}
        <div className="flex items-center gap-3">
          <Select
            value={typeFilter}
            onChange={(v) => onTypeFilterChange(v as any)}
            options={[
              { value: "all", label: "Tất cả loại lịch hẹn" },
              { value: "examination", label: "Khám và tư vấn" },
              { value: "in_treatment", label: "Trị liệu" },
              { value: "re_examination", label: "Tái khám" },
            ]}
            style={{ width: 240 }}
            className="h-10"
          />
          <Button
            icon={<RiFilter3Line />}
            onClick={() => alert("Mở bộ lọc nâng cao (tùy biến)")}
            className="h-10"
          >
            Lọc
          </Button>
        </div>

        {/* Center: week navigation */}
        <div className="flex items-center justify-center gap-2">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50"
            onClick={() => onWeekStartChange(weekStart.subtract(1, "week"))}
            aria-label="Tuần trước"
          >
            <RiArrowLeftSLine className="h-5 w-5" />
          </button>
          <div className="min-w-[160px] text-center text-sm font-medium text-gray-700">
            {headerRange}
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50"
            onClick={() => onWeekStartChange(weekStart.add(1, "week"))}
            aria-label="Tuần sau"
          >
            <RiArrowRightSLine className="h-5 w-5" />
          </button>
        </div>

        {/* Right spacer */}
        <div />
      </div>

      {/* Calendar grid */}
      <div
        className="
          rounded-2xl border border-gray-200 bg-white
          h-[500px]
          grid grid-rows-[auto,1fr]
          overflow-hidden
        "
      >
        {/* header weekdays */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={label} className="px-4 py-3 text-center text-sm font-medium text-gray-700">
              <div>{label}</div>
              <div className="text-xs text-gray-500 mt-1">{weekDays[i].format("DD/MM")}</div>
            </div>
          ))}
        </div>

        {/* columns per day */}
        <div className="grid grid-cols-7 overflow-hidden">
          {weekDays.map((dayDate, i) => {
            const isToday = dayDate.isSame(dayjs(), "day");
            return (
              <div
                key={i}
                className={`h-full overflow-y-auto border-r border-gray-100 p-3 pr-2 last:border-r-0 ${
                  isToday ? "bg-amber-50/40" : ""
                }`}
              >
                <div className="flex flex-col gap-3">
                  {eventsByDay[i].length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                      Không có lịch
                    </div>
                  )}

                  {eventsByDay[i].map((evt) => {
                    const time = dayjs(evt.datetime).format("HH:mm");
                    const base =
                      "rounded-lg border px-3 py-3 text-sm shadow-sm transition text-left cursor-pointer";
                    const color =
                      evt.status === "conflict"
                        ? "border-red-300 bg-red-400/90 text-white hover:bg-red-500"
                        : "border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200";

                    const items: MenuProps["items"] = [
                      {
                        key: "view",
                        label: "Xem chi tiết",
                        onClick: () => onViewEvent?.(evt),
                      },
                      {
                        key: "edit",
                        label: "Sửa lịch hẹn",
                        onClick: () => {
                          onEditEvent?.(evt);
                          openEditModalFromEvent(evt); // ⬅️ mở modal edit + set data
                        },
                      },
                      { type: "divider" },
                      {
                        key: "cancel",
                        danger: true,
                        label: "Hủy lịch hẹn",
                        onClick: () => onCancelEvent?.(evt),
                      },
                    ];

                    return (
                      <Dropdown key={evt.id} menu={{ items }} trigger={["click"]}>
                        <button
                          className={`${base} ${color}`}
                          title={`${time} · ${evt.customerName} · ${TYPE_LABELS[evt.type]}`}
                          onClick={(e) => {
                            e.preventDefault(); // mở menu
                            onEventClick?.(evt);
                          }}
                        >
                          <div className="font-medium text-left">
                            <div>{time}</div>
                            <div className="truncate">{evt.customerName}</div>
                          </div>
                          <div className="text-xs opacity-70 mt-1 text-left">
                            {TYPE_LABELS[evt.type]}
                          </div>
                        </button>
                      </Dropdown>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: tổng số lịch */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Hiển thị {weekEvents.length} lịch hẹn trong tuần này
      </div>

      {/* Modal tạo/sửa lịch (dùng chung) */}
      <AppointmentModal
        open={openAppointment}
        onClose={() => setOpenAppointment(false)}
        onSuccess={() => {}}
        customerOptions={[]}
        defaultCustomerId={defaultCustomerId || undefined}
        mode={modalMode}
        editing={editing}
      />
    </div>
  );
}
