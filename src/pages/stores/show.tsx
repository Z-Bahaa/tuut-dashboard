import { Show } from "@refinedev/antd";
import { Typography, Button, Image, Tag, Card, Space, Avatar, Divider, Table, Popconfirm, message } from "antd";
import { EditOutlined, ArrowLeftOutlined, GlobalOutlined, EyeOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useOne, useMany, useList, useDelete } from "@refinedev/core";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

const { Title, Text, Paragraph } = Typography;

export const StoreShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);

  // Fetch store data
  const { data: storeData, isLoading: storeLoading } = useOne({
    resource: "stores",
    id: id || "",
  });

  const store = storeData?.data;

  // Update document title when store data is loaded
  useEffect(() => {
    if (store?.title) {
      document.title = `${store.title} - Store Details`;
    }
  }, [store?.title]);

  // Fetch country data if store has country_id
  const { data: countryData } = useMany({
    resource: "countries",
    ids: store?.country_id ? [store.country_id] : [],
  });

  const country = countryData?.data?.[0];

  // Fetch store categories
  const [storeCategories, setStoreCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchStoreCategories = async () => {
      if (store?.id) {
        try {
          const { data, error } = await supabase
            .from('store_categories')
            .select(`
              category_id,
              categories (
                id,
                title,
                image_url
              )
            `)
            .eq('store_id', store.id);

          if (error) {
            console.error('Error fetching store categories:', error);
            setCategoriesLoading(false);
            return;
          }

          setStoreCategories(data || []);
          setCategoriesLoading(false);
        } catch (error) {
          console.error('Error fetching store categories:', error);
          setCategoriesLoading(false);
        }
      }
    };

    fetchStoreCategories();
  }, [store?.id]);

  // Fetch store's deals
  const { data: dealsData, isLoading: dealsLoading } = useList({
    resource: "deals",
    filters: [
      {
        field: "store_id",
        operator: "eq",
        value: id,
      },
    ],
    pagination: {
      mode: "off", // Get all deals for this store
    },
  });

  // Fetch all countries for deal display
  const { data: allCountriesData } = useList({
    resource: "countries",
    pagination: {
      mode: "off",
    },
  });

  // Create a map of country data for quick lookup
  const countriesMap = allCountriesData?.data?.reduce((acc: any, country: any) => {
    acc[country.id] = country;
    return acc;
  }, {}) || {};

  // Delete functionality
  const { mutate: deleteDeal } = useDelete();

  // Custom delete function
  const handleDeleteDeal = async (deal: any) => {
    try {
      // Delete the deal record
      await deleteDeal({ resource: "deals", id: deal.id });

      // If deal deletion was successful, decrement the store's total_offers
      if (deal.store_id) {
        try {
          // Get current store data
          const currentStore = store;
          if (currentStore) {
            const currentTotalOffers = currentStore.total_offers || 0;
            const newTotalOffers = Math.max(0, currentTotalOffers - 1); // Ensure it doesn't go below 0
            
            // Update the store's total_offers in the database
            const { error: updateError } = await supabase
              .from('stores')
              .update({ total_offers: newTotalOffers })
              .eq('id', deal.store_id);
            
            if (updateError) {
              console.error('Failed to update store total_offers:', updateError);
              message.error("Deal deleted but failed to update store offer count");
            } else {
              // Update the local store data to reflect the change immediately
              if (store) {
                store.total_offers = newTotalOffers;
              }
              message.success("Deal deleted successfully and store offer count updated");
            }
          }
        } catch (error) {
          console.error('Error updating store total_offers:', error);
          message.error("Deal deleted but failed to update store offer count");
        }
      } else {
        message.success("Deal deleted successfully");
      }
    } catch (error) {
      message.error("Failed to delete deal");
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

  // Deals table columns
  const dealsColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 150,
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
      title: "Country",
      dataIndex: "country_id",
      key: "country_id",
      width: 150,
      render: (value: number) => {
        const country = countriesMap[value];
        if (!country) {
          return <span style={{ color: "#999" }}>Unknown Country</span>;
        }
        
        return (
          <Space>
            <Image
              src={country.image_url}
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

  if (storeLoading) {
    return <div>Loading...</div>;
  }

  if (!store) {
    return <div>Store not found</div>;
  }

  return (
    <Show
      headerButtons={[
        <Button
          key="back"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/stores")}
        >
          Back to List
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/stores/edit/${id}`)}
          style={{
            color: mode === "dark" ? "#000000" : "#ffffff"
          }}
        >
          Edit
        </Button>,
      ]}
    >
      <div style={{ width: "100%" }}>
        {/* Store Header Card with Cover Image */}
        <Card 
          style={{ marginBottom: "16px", padding: 0, overflow: "hidden" }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Cover Image as Background */}
          {store.cover_picture_url && (
            <div 
              style={{
                width: "100%",
                height: "180px",
                backgroundImage: `url(${store.cover_picture_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                margin: 0,
                padding: 0,
                position: "relative",
              }}
            >
              {/* Gradient Overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "100%",
                  background: `linear-gradient(to bottom, transparent, ${mode === "dark" ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)"})`,
                }}
              />
            </div>
          )}

          {/* Store Info */}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", }}>
              {/* Profile Picture */}
              {store.profile_picture_url && (
                <Avatar
                  size={100}
                  src={store.profile_picture_url}
                  style={{ flexShrink: 0 }}
                />
              )}
              
              {/* Title and Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <div>
                    <Title level={2} style={{ margin: "0 0 0px 0" }}>
                  {store.title}
                </Title>
                
                {store.slug && (
                      <Text type="secondary" style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>
                        @{store.slug}
                  </Text>
                )}
                  </div>

                                  {/* Status Tags */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Tag 
                      color={store.is_active ? "green" : "default"}
                      style={{ 
                        fontSize: "14px",
                        padding: "4px 8px",
                        height: "auto",
                        minWidth: "80px",
                        justifyContent: "center",
                        alignItems: "center",
                        display: "flex",
                        textAlign: "center",
                        backgroundColor: mode === "light" ? "#e8e8e8" : undefined,
                        borderColor: mode === "light" ? "#bfbfbf" : undefined,
                        color: mode === "light" ? "#434343" : undefined,
                      }}
                    >
                      {store.is_active ? "Active" : "Inactive"}
                    </Tag>
                    
                    {store.total_offers !== undefined && (
                      <Tag 
                        color="blue"
                        style={{ 
                          fontSize: "14px",
                          padding: "4px 8px",
                          height: "auto",
                          minWidth: "80px",
                          justifyContent: "center",
                          alignItems: "center",
                          display: "flex",
                          textAlign: "center",
                        }}
                      >
                        {store.total_offers} Offers
                      </Tag>
                    )}
                  </div>
                </div>

                {/* Country */}
                {country && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Image
                      src={country.image_url}
                      width={24}
                      height={24}
                      style={{ borderRadius: "4px" }}
                      preview={false}
                    />
                    <Text strong style={{ textAlign: "center", marginTop: "2px", fontSize: "16px" }} >{country.value.toUpperCase()}</Text>
                  </div>
                )}

                {/* Categories */}
                {storeCategories.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {storeCategories.map((item: any) => (
                        <Tag
                          key={item.category_id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "4px 8px",
                            fontSize: "14px",
                            height: "auto",
                            margin: "2px 0",
                            color: mode === "light" ? "#722ed1" : "#faad14",
                            borderColor: mode === "light" ? "#722ed1" : "#faad14"
                          }}
                        >
                          {item.categories?.image_url && (
                            <Image
                              src={item.categories.image_url}
                              width={16}
                              height={16}
                              style={{ 
                                marginBottom: "7px",
                                filter: mode === "light" 
                                  ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(246deg) brightness(104%) contrast(97%)"
                                  : "brightness(0) saturate(100%) invert(84%) sepia(31%) saturate(6382%) hue-rotate(359deg) brightness(103%) contrast(107%)"
                              }}
                              preview={false}
                            />
                          )}
                          <span >{item.categories?.title}</span>
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        {store.description && (
          <Card style={{ marginBottom: "16px" }}>
            <Title level={4} style={{ margin: "0 0 12px 0" }}>
              About
            </Title>
            <Paragraph style={{ margin: 0, fontSize: "16px", lineHeight: "1.6" }}>
              {store.description}
            </Paragraph>
          </Card>
        )}

        {/* Visit Website Button */}
        {store.redirect_url && (
          <Card style={{ marginBottom: "16px" }}>
            <Button
              type="primary"
              size="large"
              icon={<GlobalOutlined />}
              onClick={() => window.open(store.redirect_url, "_blank")}
              style={{
                width: "100%",
                height: "48px",
                fontSize: "16px",
                color: mode === "dark" ? "#000000" : "#ffffff"
              }}
            >
              Visit Website
            </Button>
          </Card>
        )}

        {/* Store's Deals Section */}
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <Title level={4} style={{ margin: 0 }}>
              Store Deals ({dealsData?.data?.length || 0})
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/deals/create")}
              style={{
                color: mode === "dark" ? "#000000" : "#ffffff"
              }}
            >
              Create Deal
            </Button>
          </div>
          
          {dealsLoading ? (
            <div>Loading deals...</div>
          ) : dealsData?.data?.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "40px 20px",
              color: mode === "dark" ? "#999" : "#666"
            }}>
              No deals found for this store.
            </div>
          ) : (
            <>
              <style>{tableScrollStyles}</style>
              <Table
                columns={dealsColumns}
                dataSource={dealsData?.data || []}
                rowKey="id"
                scroll={{ x: 1000 }}
                className="hide-scrollbar"
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                }}
              />
            </>
          )}
        </Card>
      </div>
    </Show>
  );
}; 