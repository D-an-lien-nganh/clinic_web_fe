import React, { useState } from "react";
import { Table } from "antd";
import { getColumnsTherapy } from "./ColumnsConfig";
import AddTherapy from "./AddTherapy";
import AddTherapyDisease from "./AddTherapyDisease";
import AddTherapyWellness from "./AddTherapyWellness";

const Therapy = ({ data }: { data: any[] }) => {
  const [selectedTab, setSelectedTab] = useState("Trị liệu");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
    setSelectedRecord(null); // Reset record khi đổi tab
  };

  const handleRowClick = (record: any) => setSelectedRecord(record);

  return (
    <div>
      {/* Tab selector */}
      <div className="flex justify-center p-4">
        <div className="flex items-center gap-4">
          <div
            className={`cursor-pointer px-6 py-2 rounded-full text-center ${
              selectedTab === "Trị liệu"
                ? "bg-[#BD8306] text-white"
                : "bg-white text-black border border-gray-300"
            } hover:bg-[#BD8306] hover:text-white transition-all`}
            onClick={() => setSelectedTab("Trị liệu")}
          >
            Trị liệu
          </div>

          <span className="text-gray-400 font-semibold">»</span>

          <div
            className={`cursor-pointer px-6 py-2 rounded-full text-center ${
              selectedTab === "Trị liệu chữa bệnh"
                ? "bg-[#BD8306] text-white"
                : "bg-white text-black border border-gray-300"
            } hover:bg-[#BD8306] hover:text-white transition-all`}
            onClick={() => setSelectedTab("Trị liệu chữa bệnh")}
          >
            Trị liệu chữa bệnh
          </div>

          <span className="text-gray-400 font-semibold">»</span>

          <div
            className={`cursor-pointer px-6 py-2 rounded-full text-center ${
              selectedTab === "Trị liệu dưỡng sinh"
                ? "bg-[#BD8306] text-white"
                : "bg-white text-black border border-gray-300"
            } hover:bg-[#BD8306] hover:text-white transition-all`}
            onClick={() => setSelectedTab("Trị liệu dưỡng sinh")}
          >
            Trị liệu dưỡng sinh
          </div>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={getColumnsTherapy(selectedTab)}
        dataSource={data}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
        rowClassName="cursor-pointer"
        bordered
      />

      {/* Modals */}
      {selectedTab === "Trị liệu" && (
        <AddTherapy
          open={!!selectedRecord}
          onCancel={() => setSelectedRecord(null)}
          selectedRecord={selectedRecord}
          onFinish={(values) => console.log("Updated Therapy:", values)}
        />
      )}
      {selectedTab === "Trị liệu chữa bệnh" && (
        <AddTherapyDisease
          open={!!selectedRecord}
          onCancel={() => setSelectedRecord(null)}
          selectedRecord={selectedRecord}
          onFinish={(values) => console.log("Updated Therapy Disease:", values)}
        />
      )}
      {selectedTab === "Trị liệu dưỡng sinh" && (
        <AddTherapyWellness
          open={!!selectedRecord}
          onCancel={() => setSelectedRecord(null)}
          selectedRecord={selectedRecord}
          onFinish={(values) =>
            console.log("Updated Therapy Wellness:", values)
          }
        />
      )}
    </div>
  );
};

export default Therapy;
