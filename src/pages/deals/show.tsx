import { Show, useNotificationProvider } from "@refinedev/antd";
import { Typography, Button, Tag, Card, Space, Divider, Statistic, Row, Col, message, Image } from "antd";
import { EditOutlined, ArrowLeftOutlined, GlobalOutlined, DollarOutlined, CalendarOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useOne, useMany } from "@refinedev/core";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

const { Title, Text, Paragraph } = Typography;

export const DealShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);
  const { open } = useNotificationProvider();

  // Fetch deal data
  const { data: dealData, isLoading: dealLoading } = useOne({
    resource: "deals",
    id: id || "",
  });

  const deal = dealData?.data;

  // Update document title when deal data is loaded
  useEffect(() => {
    if (deal?.title) {
      document.title = `${deal.title} - Deal Details`;
    }
  }, [deal?.title]);

  // Fetch store data if deal has store_id
  const { data: storeData } = useMany({
    resource: "stores",
    ids: deal?.store_id ? [deal.store_id] : [],
  });

  // Fetch country data if deal has country_id
  const { data: countryData } = useMany({
    resource: "countries",
    ids: deal?.country_id ? [deal.country_id] : [],
  });

  const store = storeData?.data?.[0];
  const country = countryData?.data?.[0];

  // Fetch deal categories
  const [dealCategories, setDealCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchDealCategories = async () => {
      if (deal?.id) {
        try {
          const { data, error } = await supabase
            .from('deal_categories')
            .select(`
              category_id,
              categories (
                id,
                title,
                image_url
              )
            `)
            .eq('deal_id', deal.id);

          if (error) {
            console.error('Error fetching deal categories:', error);
            setCategoriesLoading(false);
            return;
          }

          setDealCategories(data || []);
          setCategoriesLoading(false);
        } catch (error) {
          console.error('Error fetching deal categories:', error);
          setCategoriesLoading(false);
        }
      }
    };

    fetchDealCategories();
  }, [deal?.id]);

  if (dealLoading) {
    return <div>Loading...</div>;
  }

  if (!deal) {
    return <div>Deal not found</div>;
  }

  return (
    <Show
      headerButtons={[
        <Button
          key="back"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/deals")}
        >
          Back to List
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/deals/edit/${id}`)}
          style={{
            color: mode === "dark" ? "#000000" : "#ffffff"
          }}
        >
          Edit
        </Button>,
      ]}
    >
      <div style={{ width: "100%" }}>
        {/* Deal Header Card */}
        <Card 
          style={{ marginBottom: "16px" }}
          bodyStyle={{ padding: "24px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                <Title level={2} style={{ margin: "0" }}>
                {deal.title}
              </Title>
                
                {deal.code && (
                  <Tag 
                    style={{ 
                      fontSize: "12px", 
                      fontWeight: "600",
                      fontFamily: "monospace",
                      backgroundColor: mode === "dark" ? "#1f1f1f" : "#f0f0f0",
                      color: mode === "dark" ? "#ffffff" : "#333333",
                      border: `1px solid ${mode === "dark" ? "#434343" : "#d9d9d9"}`,
                      borderRadius: "6px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(deal.code).then(() => {
                        open({
                          type: "success",
                          message: "Code copied to clipboard",
                          description: `"${deal.code}" has been copied to your clipboard`,
                        });
                      }).catch(() => {
                        open({
                          type: "error",
                          message: "Failed to copy code",
                          description: "Could not copy code to clipboard",
                        });
                      });
                    }}
                  >
                    {deal.code}
                  </Tag>
                )}
              </div>
              
              {deal.slug && (
                <Text type="secondary" style={{ fontSize: "14px", marginBottom: "8px", display: "block" }}>
                  @{deal.slug}
                </Text>
              )}
              
              {deal.description && (
                <Paragraph style={{ 
                  margin: "0 0 16px 0", 
                  color: mode === "dark" ? "#d9d9d9" : "#666666",
                  maxWidth: "700px"
                }}>
                  {deal.description}
                </Paragraph>
              )}

              {/* Deal Categories */}
              {dealCategories.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {dealCategories.map((item: any) => (
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
                          borderColor: mode === "light" ? "#722ed1" : "#faad14",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        onClick={() => navigate(`/categories/show/${item.category_id}`)}
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
                        <span>{item.categories?.title}</span>
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Tags */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
              {new Date(deal.expiry_date) < new Date() ? (
                <Tag 
                  color="red"
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
                  Expired
                </Tag>
              ) : (
                <>
              <Tag 
                color={deal.is_active ? "green" : "default"}
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
                {deal.is_active ? "Active" : "Inactive"}
              </Tag>
              
                  {deal.is_featured && (
                    <Tag 
                      color="gold"
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
                      Featured
                    </Tag>
                  )}
                  
                  {deal.is_trending && (
                    <Tag 
                      color="volcano"
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
                      Trending
              </Tag>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Store Information */}
          {store && (
            <Card 
              size="small" 
              className="store-card"
              style={{ 
                marginBottom: "16px",
                backgroundColor: mode === "dark" ? "#1f1f1f" : "#fafafa",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              hoverable
              onClick={() => navigate(`/stores/show/${store.id}`)}
            >
              <style>
                {`
                  .store-card:hover {
                    background-color: ${mode === "dark" ? "#2a2a2a" : "#e8e8e8"} !important;
                    color: ${mode === "dark" ? "#d9d9d9" : "#333333"} !important;
                    border-color: ${mode === "dark" ? "#faad14" : "#722ed1"} !important;
                    box-shadow: 0 0 8px ${mode === "dark" ? "#faad14" : "#722ed1"} !important;
                  }
                  .store-card:hover .store-title {
                    color: ${mode === "dark" ? "#d9d9d9" : "#333333"} !important;
                  }
                `}
              </style>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {store.profile_picture_url && (
                  <img 
                    src={store.profile_picture_url} 
                    alt={store.title}
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "50%",
                      objectFit: "cover"
                    }} 
                  />
                )}
                <div>
                  <Text strong className="store-title" style={{ fontSize: "16px" }}>
                    {store.title}
                  </Text>
                  {store.slug && (
                    <div>
                      <Text type="secondary" style={{ fontSize: "14px" }}>
                        @{store.slug}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </Card>

        {/* Deal URL */}
        {deal.deal_url && (
          <Card title="Deal Link" size="small" style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <GlobalOutlined style={{ fontSize: "16px" }} />
              <a 
                href={deal.deal_url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: "#1890ff",
                  textDecoration: "none",
                  fontSize: "16px"
                }}
              >
                {deal.deal_url}
              </a>
            </div>
          </Card>
        )}

        {/* Deal Details */}
        <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
          <Col xs={24} sm={12}>
            <Card title="Additional Information" size="small">
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Country:</Text>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {country?.image_url && (
                      <img 
                        src={country.image_url} 
                        alt={country.value}
                        style={{ width: "16px", height: "12px", objectFit: "cover" }}
                      />
                    )}
                    <Text style={{ fontSize: "14px" }}>
                      {country?.value || "Unknown"}
                    </Text>
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Click Count:</Text>
                  <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1890ff" }}>
                    {deal.click_count || 0}
                  </Text>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Created At:</Text>
                  <Text style={{ fontSize: "14px" }}>
                    {new Date(deal.created_at).toLocaleString()}
                  </Text>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Updated At:</Text>
                  <Text style={{ fontSize: "14px" }}>
                    {new Date(deal.updated_at).toLocaleString()}
                  </Text>
                </div>
              </Space>
            </Card>
            </Col>

          <Col xs={24} sm={12}>
            <Card title="Discount Information" size="small">
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Type:</Text>
                  <Tag color={
                    deal.type === 'discount' ? 'purple' : 
                    deal.type === 'amountOff' ? 'orange' : 
                    deal.type === 'bogo' ? 'blue' : 
                    deal.type === 'freeShipping' ? 'green' : 'default'
                  } style={{ fontSize: "12px", fontWeight: "500" }}>
                    {deal.type === 'discount' ? 'Discount' : 
                     deal.type === 'amountOff' ? 'Amount Off' : 
                     deal.type === 'bogo' ? 'BOGO' : 
                     deal.type === 'freeShipping' ? 'Free Shipping' : deal.type}
                  </Tag>
                </div>
                
                {(deal.type === 'discount' || deal.type === 'amountOff') && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text>Amount:</Text>
                      <Text style={{ fontSize: "16px", fontWeight: "500", color: "#1890ff" }}>
                        {deal.discount}
                      </Text>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text>Unit:</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "500", color: "#666666" }}>
                        {country?.currency?.en || deal.discount_unit}
                      </Text>
                    </div>
                  </>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Expires At:</Text>
                  <Text style={{ fontSize: "14px", fontWeight: "500", color: "#ff4d4f" }}>
                    {new Date(deal.expiry_date).toLocaleString()}
                  </Text>
                </div>
              </Space>
            </Card>
            </Col>
          </Row>


      </div>
    </Show>
  );
}; 