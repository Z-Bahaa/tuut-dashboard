import { List, useTable, ImageField } from "@refinedev/antd";
import { useMany, useList, useDelete } from "@refinedev/core";
import { Table, Space, Button, Input, Tag, Popconfirm } from "antd";
import { EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";

export const StoreList = () => {
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  
  const { mutate: deleteStore } = useDelete();

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
    resource: "stores",
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

  // Get all country IDs from the stores data
  const countryIds = tableProps.dataSource?.map((store: any) => store.country_id).filter(Boolean) || [];
  
  // Fetch all countries for filter options
  const { data: allCountriesData } = useList({
    resource: "countries",
  });

  // Fetch countries data for stores
  const { data: countriesData } = useMany({
    resource: "countries",
    ids: countryIds,
  });

  // Create a map of country data for quick lookup
  const countriesMap = countriesData?.data?.reduce((acc: any, country: any) => {
    acc[country.id] = country;
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
            // Trigger server-side search
            setSearchText(selectedKeys[0] || "");
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              // Trigger server-side search
              setSearchText(selectedKeys[0] || "");
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ 
              width: 90,
              color: mode === "dark" ? "#000000" : "#ffffff"
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              // Clear server-side search
              setSearchText("");
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
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string, record: any) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => {
          const element = document.getElementById('search-input') as HTMLInputElement;
          element?.select();
        }, 100);
      }
    },
  });

  const columns: any[] = [
    {
      title: "",
      dataIndex: "profile_picture_url",
      key: "profile_picture_url",
      width: 80,
      render: (value: string) => (
        <ImageField
          value={value}
          width={60}
          height={60}
          style={{ borderRadius: "8px" }}
          preview={false}
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ...getColumnSearchProps('title'),
    },
    {
      title: "Total Offers",
      dataIndex: "total_offers",
      key: "total_offers",
      width: 'fit-content',
      sorter: (a: any, b: any) => {
        const aValue = a.total_offers || 0;
        const bValue = b.total_offers || 0;
        return aValue - bValue;
      },
      render: (value: number) => (
        <span style={{ fontWeight: 'bold', color: value > 0 ? '#52c41a' : '#d9d9d9' }}>
          {value || 0}
        </span>
      ),
    },
    {
      title: "Is Active",
      dataIndex: "is_active",
      key: "is_active",
      // width: 100,
      filters: [
        { text: 'True', value: true },
        { text: 'False', value: false },
      ],
      onFilter: (value: boolean, record: any) => record.is_active === value,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'True' : 'False'}
        </Tag>
      ),
    },
    {
      title: "Country",
      dataIndex: "country_id",
      key: "country_id",
      width: 150,
      filters: allCountriesData?.data?.map((country: any) => ({
        text: (
          <Space>
            <ImageField
              value={country.image_url}
              width={16}
              height={16}
              style={{ borderRadius: "4px" }}
              preview={false}
            />
            <span>{country.value}</span>
          </Space>
        ),
        value: country.id,
      })) || [],
      onFilter: (value: number, record: any) => record.country_id === value,
      render: (value: number, record: any) => {
        const country = countriesMap[value];
        if (!country) {
          return <span style={{ color: '#999' }}>N/A</span>;
        }
        return (
          <Space>
            <ImageField
              value={country.image_url}
              width={24}
              height={24}
              style={{ borderRadius: "8px" }}
              preview={false}
            />
            <span style={{ fontWeight: 'bold' }}>
              {country.value}
            </span>
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
            render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/stores/show/${record.id}`)}
            style={{
              color: mode === "dark" ? "#000000" : "#ffffff"
            }}
            className="action-button"
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/stores/edit/${record.id}`)}
            className="action-button"
          />
          <Popconfirm
            title="Delete Store"
            description="Are you sure you want to delete this store? This action cannot be undone."
            onConfirm={() => deleteStore({ resource: "stores", id: record.id })}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              className="action-button"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{tableScrollStyles}</style>
      <List
              headerButtons={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/stores/create")}
          style={{
            color: mode === "dark" ? "#000000" : "#ffffff"
          }}
        >
          Create Store
        </Button>
      }
      >
      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        scroll={{ 
          y: 'calc(100vh - 320px)', // Viewport width minus scrollbar and padding
          x: 'calc(100vw - 320px)' // Viewport width minus scrollbar and padding
        }}
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        className="hide-scrollbar"
        style={{ 
          maxHeight: 'calc(100vh - 200px)',
          overflow: 'auto'
        }}
      />
      </List>
    </>
  );
}; 