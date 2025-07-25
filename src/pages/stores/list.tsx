import { List, useTable, ImageField, useNotificationProvider } from "@refinedev/antd";
import { useMany, useList, useDelete } from "@refinedev/core";
import { Table, Space, Button, Input, Tag, Popconfirm, message, Select } from "antd";
import { EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { supabaseClient as supabase } from "../../utility/supabaseClient";
import { extractFileNameFromUrl } from "../../utility/functions";

export const StoreList = () => {
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [storeIdsForCategory, setStoreIdsForCategory] = useState<number[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  const { mutate: deleteStore } = useDelete();
  const { open } = useNotificationProvider();

  // Fetch store IDs for selected category
  useEffect(() => {
    const fetchStoreIdsForCategory = async () => {
      if (selectedCategoryId) {
        setCategoryLoading(true);
        try {
          const { data, error } = await supabase
            .from('store_categories')
            .select('store_id')
            .eq('category_id', selectedCategoryId);

          if (error) {
            console.error('Error fetching store IDs for category:', error);
            setCategoryLoading(false);
            return;
          }

          const ids = data?.map((item: any) => item.store_id) || [];
          setStoreIdsForCategory(ids);
          setCategoryLoading(false);
        } catch (error) {
          console.error('Error fetching store IDs for category:', error);
          setCategoryLoading(false);
        }
      } else {
        setStoreIdsForCategory([]);
      }
    };

    fetchStoreIdsForCategory();
  }, [selectedCategoryId]);

  // Custom delete function that removes associated files before deleting the store
  const handleDeleteStore = async (store: any) => {
    try {
      // Remove profile picture if it exists
      if (store.profile_picture_url) {
        const profileFileName = extractFileNameFromUrl(store.profile_picture_url);
        if (profileFileName) {
          const { error: profileError } = await supabase.storage
            .from('store-assets')
            .remove([`profile-pictures/${profileFileName}`]);
          
          if (profileError) {
            console.warn('Failed to delete profile picture:', profileError.message);
          }
        }
      }

      // Remove cover picture if it exists
      if (store.cover_picture_url) {
        const coverFileName = extractFileNameFromUrl(store.cover_picture_url);
        if (coverFileName) {
          const { error: coverError } = await supabase.storage
            .from('store-assets')
            .remove([`covers/${coverFileName}`]);
          
          if (coverError) {
            console.warn('Failed to delete cover picture:', coverError.message);
          }
        }
      }

      // Delete the store record
      await deleteStore({ resource: "stores", id: store.id });

      open({
        type: "success",
        message: "Store deleted successfully",
        description: "Store and associated files have been removed",
      });
    } catch (error) {
      open({
        type: "error",
        message: "Failed to delete store",
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
    resource: "stores",
    filters: {
      permanent: [
        {
          field: "title",
          operator: "contains",
          value: searchText,
        },
        ...(selectedCategoryId && storeIdsForCategory.length > 0 ? [{
          field: "id",
          operator: "in" as const,
          value: storeIdsForCategory,
        }] : []),
      ],
    },
    onSearch: (values: any) => {
      setSearchText((values as any).title || "");
      return [];
    },
    queryOptions: {
      enabled: !selectedCategoryId || (selectedCategoryId && !categoryLoading && storeIdsForCategory.length > 0) ? true : false,
    },
  });

  // Get all country IDs from the stores data
  const countryIds = tableProps.dataSource?.map((store: any) => store.country_id).filter(Boolean) || [];
  
  // Fetch all countries for filter options
  const { data: allCountriesData } = useList({
    resource: "countries",
  });

  // Fetch all categories for filter options
  const { data: allCategoriesData } = useList({
    resource: "categories",
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
      render: (text: string, record: any) => (
        <div 
          style={{ 
            fontWeight: "500", 
            color: mode === "dark" ? "#ffffff" : "#000000",
            wordWrap: "break-word",
            whiteSpace: "normal",
            lineHeight: "1.4",
            cursor: "pointer",
            fontSize: "16px"
          }}
          onClick={() => navigate(`/stores/show/${record.id}`)}
        >
          {text}
        </div>
      ),
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
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      // width: 100,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value: boolean, record: any) => record.is_active === value,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Active' : 'Inactive'}
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
            description="Are you sure you want to delete this store? This will also remove all associated files (profile and cover pictures). This action cannot be undone."
            onConfirm={() => handleDeleteStore(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            styles={{ root: { maxWidth: 400 } }}
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
        {/* Category Filter */}
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: "500", color: mode === "dark" ? "#ffffff" : "#000000" }}>
            Filter by Category:
          </span>
          <Select
            placeholder="Select a category"
            allowClear
            style={{ width: 300 }}
            value={selectedCategoryId}
            onChange={(value) => setSelectedCategoryId(value)}
            loading={categoryLoading}
            options={allCategoriesData?.data?.map((category: any) => ({
              label: (
                <Space>
                  {category.image_url && (
                    <img 
                      src={category.image_url} 
                      alt={category.title}
                      style={{ 
                        width: 16,
                        height: 16,
                        borderRadius: "4px",
                        objectFit: "cover",
                        marginBottom: "4px"
                      }} 
                    />
                  )}
                  <span>{category.title}</span>
                </Space>
              ),
              value: category.id,
            })) || []}
          />
          {selectedCategoryId && (
            <Button
              size="small"
              onClick={() => setSelectedCategoryId(null)}
              style={{ marginLeft: "8px" }}
            >
              Clear Filter
            </Button>
          )}
        </div>
        
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
    </>
  );
}; 