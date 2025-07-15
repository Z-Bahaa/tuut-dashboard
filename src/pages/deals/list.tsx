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
  const [titleSearchText, setTitleSearchText] = useState("");
  const [codeSearchText, setCodeSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  
  const { mutate: deleteDeal } = useDelete();
  const { open } = useNotificationProvider();

  // Custom delete function
  const handleDeleteDeal = async (deal: any) => {
    try {
      // If deal deletion was successful, update store data
      if (deal.store_id) {
        try {
          // Get current store data
          const currentStore = allStoresData?.data?.find((store: any) => store.id === deal.store_id);
          if (currentStore) {
            const currentTotalOffers = currentStore.total_offers || 0;
            const newTotalOffers = Math.max(0, currentTotalOffers - 1); // Ensure it doesn't go below 0
            
            // Prepare store update data
            const storeUpdateData: any = { total_offers: newTotalOffers };
            
            // Check if the deleted deal was the store's top deal
            if (currentStore.discount_id === deal.id) {
              // Need to recalculate the top deal
              // Get all deals for this store except the deleted one
              const { data: remainingDeals, error: dealsError } = await supabase
                .from('deals')
                .select('*')
                .eq('store_id', deal.store_id)
                .neq('id', deal.id);
              
              if (dealsError) {
                console.error('Failed to fetch remaining deals:', dealsError);
              } else {
                if (!remainingDeals || remainingDeals.length === 0) {
                  // No deals left, clear all discount fields to null
                  storeUpdateData.discount = null;
                  storeUpdateData.discount_unit = null;
                  storeUpdateData.discount_type = null;
                  storeUpdateData.discount_id = null;
                } else {
                  // Find the new top deal
                  let topDeal = null;
                  let highestDiscount = -1;
                  let bogoDeal = null; // Store BOGO/Free Shipping deal as fallback
                  
                  for (const remainingDeal of remainingDeals) {
                    if (remainingDeal.type === 'discount' || remainingDeal.type === 'amountOff') {
                      const dealDiscount = remainingDeal.discount || 0;
                      if (dealDiscount > highestDiscount) {
                        highestDiscount = dealDiscount;
                        topDeal = remainingDeal;
                      }
                    } else if (remainingDeal.type === 'bogo' || remainingDeal.type === 'freeShipping') {
                      // Store BOGO/Free Shipping deal as fallback, but don't break
                      if (!bogoDeal) {
                        bogoDeal = remainingDeal;
                      }
                    }
                  }
                  
                  // If no discount/amountOff deals found, use BOGO/Free Shipping as fallback
                  if (!topDeal && bogoDeal) {
                    topDeal = bogoDeal;
                  }
                  
                  if (topDeal) {
                    if (topDeal.type === 'discount' || topDeal.type === 'amountOff') {
                      // Handle discount_unit - replace "$" with currency code from country
                      let discountUnit = topDeal.discount_unit;
                      if (discountUnit === '$' && topDeal.country_id) {
                        // Get country data for currency code
                        const { data: countryData } = await supabase
                          .from('countries')
                          .select('currency_code')
                          .eq('id', topDeal.country_id)
                          .single();
                        
                        if (countryData?.currency_code?.en) {
                          discountUnit = countryData.currency_code.en;
                        }
                      }
                      
                      storeUpdateData.discount = topDeal.discount;
                      storeUpdateData.discount_unit = discountUnit;
                    } else {
                      // For BOGO and Free Shipping deals, set default values
                      storeUpdateData.discount = 0;
                      storeUpdateData.discount_unit = '';
                    }
                    storeUpdateData.discount_type = topDeal.type;
                    storeUpdateData.discount_id = topDeal.id;
                  }
                }
              }
              
              // Update the store BEFORE deleting the deal to avoid foreign key constraint
              const { error: updateError } = await supabase
                .from('stores')
                .update(storeUpdateData)
                .eq('id', deal.store_id);
              
              if (updateError) {
                console.error('Failed to update store:', updateError);
                open({
                  type: "error",
                  message: "Failed to update store data",
                  description: "The store data could not be updated.",
                });
                return; // Don't delete the deal if store update fails
              }
            }
          }
        } catch (error) {
          console.error('Error updating store:', error);
          open({
            type: "error",
            message: "Failed to update store data",
            description: "The store data could not be updated.",
          });
          return; // Don't delete the deal if store update fails
        }
      }
      
      // Now delete the deal record
      await deleteDeal({ resource: "deals", id: deal.id });
      
      open({
        type: "success",
        message: "Deal deleted successfully",
        description: "Deal has been removed and store data updated.",
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
          value: titleSearchText,
        },
        {
          field: "code",
          operator: "contains",
          value: codeSearchText,
        },
      ],
    },
    onSearch: (values: any) => {
      setTitleSearchText((values as any).title || "");
      setCodeSearchText((values as any).code || "");
      return [];
    },
    sorters: {
      initial: [],
    },
  });

  // Fetch all stores for filter options and display
  const { data: allStoresData } = useList({
    resource: "stores",
    pagination: {
      mode: "off", // Disable pagination to get all stores
    },
  });

  // Create a map of store data for quick lookup
  const storesMap = allStoresData?.data?.reduce((acc: any, store: any) => {
    acc[store.id] = store;
    return acc;
  }, {}) || {};



  // Fetch all countries for filter options and display
  const { data: allCountriesData } = useList({
    resource: "countries",
    pagination: {
      mode: "off", // Disable pagination to get all countries
    },
  });

  // Create a map of country data for quick lookup
  const countriesMap = allCountriesData?.data?.reduce((acc: any, country: any) => {
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
            // Trigger server-side search for specific column
            if (dataIndex === "title") {
              setTitleSearchText(selectedKeys[0] || "");
            } else if (dataIndex === "code") {
              setCodeSearchText(selectedKeys[0] || "");
            }
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              // Trigger server-side search for specific column
              if (dataIndex === "title") {
                setTitleSearchText(selectedKeys[0] || "");
              } else if (dataIndex === "code") {
                setCodeSearchText(selectedKeys[0] || "");
              }
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
              // Clear server-side search for specific column
              if (dataIndex === "title") {
                setTitleSearchText("");
              } else if (dataIndex === "code") {
                setCodeSearchText("");
              }
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
    onFilter: (value: any, record: any) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase())
        : false,
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => {
          const element = document.getElementById('search-input') as HTMLInputElement;
          element?.select();
        }, 100);
      }
    },
  });

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 150,
      ...getColumnSearchProps("title"),
      render: (text: string) => (
        <div style={{ 
          fontWeight: "500", 
          color: mode === "dark" ? "#ffffff" : "#000000",
          wordWrap: "break-word",
          whiteSpace: "normal",
          lineHeight: "1.4"
        }}>
          {text}
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 150,
      ...getColumnSearchProps("code"),
      render: (text: string) => (
        <div style={{ 
          backgroundColor: mode === "dark" ? "#1f1f1f" : "#f0f0f0",
          color: mode === "dark" ? "#ffffff" : "#333333",
          maxWidth: "130px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: "monospace",
          fontSize: "16px",
          fontWeight: "600",
          padding: "4px 8px",
          borderRadius: "6px",
          border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`,
          display: "inline-block"
        }}>
          {text || "No code"}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      filters: [
        { text: 'Discount', value: 'discount' },
        { text: 'Amount Off', value: 'amountOff' },
        { text: 'BOGO', value: 'bogo' },
        { text: 'Free Shipping', value: 'freeShipping' },
      ],
      onFilter: (value: any, record: any) => record.type === (value as string),
      render: (type: string) => {
        const typeConfig = {
          bogo: { label: "BOGO", color: "blue" },
          freeShipping: { label: "Free Shipping", color: "green" },
          amountOff: { label: "Amount Off", color: "orange" },
          discount: { label: "Discount", color: "purple" }
        };
        
        const config = typeConfig[type as keyof typeof typeConfig] || { label: type, color: "default" };
        
        return (
          <Tag color={config.color} style={{ fontSize: "12px", fontWeight: "500" }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      width: 150,
      sorter: true,
      render: (discount: number, record: any) => {
        // Don't show discount for bogo and freeShipping types
        if (record.type === "bogo" || record.type === "freeShipping") {
          return null;
        }
        
        // Get the country for currency code lookup
        let currencyDisplay = record.discount_unit;
        
        // For amountOff type, try to get the English currency code from the country
        if (record.type === "amountOff") {
          const country = countriesMap[record.country_id];
          if (country?.currency_code?.en) {
            currencyDisplay = country.currency_code.en;
          }
        }
        
        return (
          <Tag 
            style={{ 
              fontSize: "12px", 
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "4px 8px",
              height: "auto",
              width: "fit-content",
              color: mode === "light" ? "#722ed1" : "#faad14",
              borderColor: mode === "light" ? "#722ed1" : "#faad14",
              backgroundColor: "transparent"
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "600" }}>{discount}</span>
            {currencyDisplay && (
              <span style={{ 
                fontSize: "12px", 
                opacity: 0.9,
                textTransform: "uppercase",
                fontWeight: "500"
              }}>
                {currencyDisplay}
              </span>
            )}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 150,
      render: (isActive: boolean, record: any) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
          {record.is_featured && (
            <Tag color="gold" style={{ fontSize: "10px", padding: "2px 6px" }}>
              Featured
            </Tag>
          )}
          {record.is_trending && (
            <Tag color="volcano" style={{ fontSize: "10px", padding: "2px 6px" }}>
              Trending
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Clicks",
      dataIndex: "click_count",
      key: "click_count",
      width: 100,
      sorter: true,
      render: (clicks: number) => (
        <span style={{ 
          fontSize: "12px", 
          color: clicks > 0 ? "#52c41a" : "#999",
          fontWeight: clicks > 0 ? "500" : "normal"
        }}>
          {clicks || 0}
        </span>
      ),
    },
    {
      title: "Store",
      dataIndex: "store_id",
      key: "store_id",
      width: 150,
      filters: allStoresData?.data?.map((store: any) => ({
        text: (
          <Space>
            {store.profile_picture_url && (
              <img 
                src={store.profile_picture_url} 
                alt={store.title}
                style={{ 
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  objectFit: "cover"
                }} 
              />
            )}
            <span>{store.title}</span>
          </Space>
        ),
        value: store.id,
      })) || [],
      filterMultiple: true,
      onFilter: (value: any, record: any) => record.store_id === (value as number),
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
          <span style={{ color: "#ff4d4f", fontSize: "12px" }}>
            Store ID: {storeId} (Deleted)
          </span>
        );
      },
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
      onFilter: (value: any, record: any) => record.country_id === (value as number),
      render: (value: number, record: any) => {
        const country = countriesMap[value];
        if (!country) {
          return <span style={{ color: "#999" }}>Unknown Country</span>;
        }
        
        return (
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
        );
      },
    },
    {
      title: "Expiry Date",
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 120,
      sorter: true,
      render: (date: string) => {
        const expiryDate = new Date(date);
        const now = new Date();
        const isExpired = expiryDate < now;
        const isExpiringSoon = expiryDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        return (
          <span style={{ 
            fontSize: "12px", 
            color: isExpired ? "#ff4d4f" : isExpiringSoon ? "#faad14" : "#52c41a",
            fontWeight: isExpired || isExpiringSoon ? "500" : "normal"
          }}>
            {expiryDate.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined style={{ color: mode === "dark" ? "#000000" : "#ffffff" }} />}
            size="small"
            onClick={() => navigate(`/deals/show/${record.id}`)}
            className="action-button"
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/deals/edit/${record.id}`)}
            className="action-button"
          />
          <Popconfirm
            title="Delete Deal"
            description="Are you sure you want to delete this deal? This action cannot be undone."
            onConfirm={() => handleDeleteDeal(record)}
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
        dataSource={tableProps.dataSource}
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