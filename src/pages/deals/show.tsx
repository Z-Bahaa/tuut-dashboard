import { Show } from "@refinedev/antd";
import { Typography, Button, Tag, Card, Space, Divider, Statistic, Row, Col } from "antd";
import { EditOutlined, ArrowLeftOutlined, GlobalOutlined, DollarOutlined, CalendarOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useOne, useMany } from "@refinedev/core";

const { Title, Text, Paragraph } = Typography;

export const DealShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);

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

  const store = storeData?.data?.[0];

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
              <Title level={2} style={{ margin: "0 0 8px 0" }}>
                {deal.title}
              </Title>
              
              {deal.description && (
                <Paragraph style={{ margin: "0 0 16px 0", color: mode === "dark" ? "#d9d9d9" : "#666666" }}>
                  {deal.description}
                </Paragraph>
              )}
            </div>

            {/* Status Tags */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
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
                {deal.discount_percentage}% OFF
              </Tag>
            </div>
          </div>

          {/* Store Information */}
          {store && (
            <Card 
              size="small" 
              style={{ 
                marginBottom: "16px",
                backgroundColor: mode === "dark" ? "#1f1f1f" : "#fafafa"
              }}
            >
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
                  <Text strong style={{ fontSize: "16px" }}>
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

        {/* Deal Details */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card title="Pricing Information" size="small">
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Original Price:</Text>
                  <Text delete style={{ fontSize: "18px", fontWeight: "500" }}>
                    ${deal.original_price}
                  </Text>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Discounted Price:</Text>
                  <Text style={{ fontSize: "18px", fontWeight: "500", color: "#52c41a" }}>
                    ${deal.discounted_price}
                  </Text>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>You Save:</Text>
                  <Text style={{ fontSize: "16px", fontWeight: "500", color: "#ff4d4f" }}>
                    ${(deal.original_price - deal.discounted_price).toFixed(2)}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card title="Deal Information" size="small">
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Discount:</Text>
                  <Tag color="red" style={{ fontSize: "14px", fontWeight: "500" }}>
                    {deal.discount_percentage}% OFF
                  </Tag>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Expiry Date:</Text>
                  <Text style={{ fontSize: "14px" }}>
                    {new Date(deal.expiry_date).toLocaleString()}
                  </Text>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>Created:</Text>
                  <Text style={{ fontSize: "14px" }}>
                    {new Date(deal.created_at).toLocaleDateString()}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

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

        {/* Additional Information */}
        <Card title="Additional Information" size="small" style={{ marginTop: "16px" }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Original Price"
                value={deal.original_price}
                prefix="$"
                valueStyle={{ color: "#999" }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Discounted Price"
                value={deal.discounted_price}
                prefix="$"
                valueStyle={{ color: "#52c41a" }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Savings"
                value={(deal.original_price - deal.discounted_price).toFixed(2)}
                prefix="$"
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Col>
          </Row>
        </Card>
      </div>
    </Show>
  );
}; 