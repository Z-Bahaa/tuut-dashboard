import { List, useTable, ImageField, useNotificationProvider } from "@refinedev/antd";
import { useMany, useList, useDelete } from "@refinedev/core";
import { Table, Space, Button, Input, Tag, Popconfirm, message } from "antd";
import { EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

export const DealList = () => {
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  
  const { mutate: deleteDeal } = useDelete();
  const { open } = useNotificationProvider();

  // Custom delete function
  const handleDeleteDeal = async (deal: any) => {
    try {
      // Delete the deal record
      await deleteDeal({ resource: "deals", id: deal.id });

      open({
        type: "success",
        message: "Deal deleted successfully",
        description: "Deal has been removed",
      });
    } catch (error) {
      open({
        type: "error",
        message: "Failed to delete deal",
        description: String(error),
      });
    }
  };

  // CSS for table scrolling
  const tableScrollStyles = `
    .hide-scrollbar .ant-table-body::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar .ant-table-body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .ant-table-wrapper::-webkit-scrollbar {
      display: none;
    }
    .ant-table-wrapper {
      scrollbar-width: none;
      -ms-overflow-style: none;
      overflow: auto;
    }
    
    .ant-table::-webkit-scrollbar {
      display: none;
    }
    .ant-table {
      scrollbar-width: none;
      -ms-overflow-style: none;
      min-width: 800px;
    }
    
    .ant-table-body::-webkit-scrollbar {
      display: none;
    }
    .ant-table-body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .ant-table-header::-webkit-scrollbar {
      display: none;
    }
    .ant-table-header {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .ant-table th:last-child,
    .ant-table td:last-child {
      max-width: fit-content !important;
    }
    
    .ant-pagination {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      margin-top: 16px !important;
    }
    
    @media (max-width: 850px) {
      .action-button {
        min-width: 32px !important;
        padding: 4px 8px !important;
      }
    }
    
    @media (max-width: 768px) {
      .ant-table {
        min-width: 600px;
      }
      
      .ant-table-scroll {
        max-width: calc(100vw - 80px) !important;
      }
    }
    
    @media (max-width: 480px) {
      .ant-table-scroll {
        max-width: calc(100vw - 60px) !important;
      }
    }
    
    @media (max-width: 320px) {
      .ant-table-scroll {
        max-width: calc(100vw - 40px) !important;
      }
    }
  `;
  
  const { tableProps, searchFormProps } = useTable({
    resource: "deals",
    filters: {
      permanent: [
        {
          field: "title",
          operator: "contains",
          value: searchText,
        },
      ],
    },
    onSearch: (values: any) => {
      setSearchText((values as any).title || "");
      return [];
    },
  });

  // Get all store IDs from the deals data
  const storeIds = tableProps.dataSource?.map((deal: any) => deal.store_id).filter(Boolean) || [];
  
  // Fetch stores data for deals
  const { data: storesData } = useMany({
    resource: "stores",
    ids: storeIds,
  });

  // Create a map of store data for quick lookup
  const storesMap = storesData?.data?.reduce((acc: any, store: any) => {
    acc[store.id] = store;
    return acc;
  }, {}) || {};

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => {
            confirm();
            setSearchedColumn(dataIndex);
          }}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              setSearchedColumn(dataIndex);
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              setSearchedColumn("");
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value: string, record: any) =>
      record[dataIndex]
        ?.toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownVisibleChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => searchInput?.select(), 100);
      }
    },
  });

  const searchInput = useState<Input | null>(null)[0];

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 200,
      ...getColumnSearchProps("title"),
      render: (text: string) => (
        <div style={{ 
          fontWeight: "500", 
          color: mode === "dark" ? "#ffffff" : "#000000",
          maxWidth: "180px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {text}
        </div>
      ),
    },
    {
      title: "Store",
      dataIndex: "store_id",
      key: "store_id",
      width: 150,
      render: (storeId: number) => {
        const store = storesMap[storeId];
        return store ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {store.profile_picture_url && (
              <img 
                src={store.profile_picture_url} 
                alt={store.title}
                style={{ 
                  width: "24px", 
                  height: "24px", 
                  borderRadius: "50%",
                  objectFit: "cover"
                }} 
              />
            )}
            <span style={{ 
              maxWidth: "100px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {store.title}
            </span>
          </div>
        ) : (
          <span style={{ color: "#999" }}>Unknown Store</span>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (text: string) => (
        <div style={{ 
          maxWidth: "230px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: mode === "dark" ? "#d9d9d9" : "#666666"
        }}>
          {text || "No description"}
        </div>
      ),
    },
    {
      title: "Discount",
      dataIndex: "discount_percentage",
      key: "discount_percentage",
      width: 120,
      render: (percentage: number) => (
        <Tag color="red" style={{ fontSize: "12px", fontWeight: "500" }}>
          {percentage}% OFF
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      render: (isActive: boolean) => (
        <Tag 
          color={isActive ? "green" : "default"}
          style={{ 
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: mode === "light" ? "#e8e8e8" : undefined,
            borderColor: mode === "light" ? "#bfbfbf" : undefined,
            color: mode === "light" ? "#434343" : undefined,
          }}
        >
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date: string) => (
        <span style={{ fontSize: "12px", color: "#999" }}>
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (record: any) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/deals/show/${record.id}`)}
            className="action-button"
            style={{ 
              color: mode === "dark" ? "#ffffff" : "#000000",
              border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/deals/edit/${record.id}`)}
            className="action-button"
            style={{ 
              color: mode === "dark" ? "#ffffff" : "#000000",
              border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this deal?"
            onConfirm={() => handleDeleteDeal(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              className="action-button"
              style={{ 
                color: "#ff4d4f",
                border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`
              }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <List
      headerButtons={[
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/deals/create")}
          style={{
            color: mode === "dark" ? "#000000" : "#ffffff"
          }}
        >
          Create Deal
        </Button>,
      ]}
    >
      <style>{tableScrollStyles}</style>
      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1000 }}
        className="hide-scrollbar"
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />
    </List>
  );
}; 