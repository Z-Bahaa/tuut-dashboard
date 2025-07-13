import { Show } from "@refinedev/antd";
import { Typography, Button, Image, Tag, Card, Space, Avatar, Divider } from "antd";
import { EditOutlined, ArrowLeftOutlined, GlobalOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useOne, useMany } from "@refinedev/core";

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
                height: "200px",
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

                {/* Status Tag */}
                  <Tag 
                    color={store.is_active ? "green" : "default"}
                    style={{ 
                      marginTop: "6px",
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
                    {store.is_active ? "Active" : "Inactive"}
                  </Tag>
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

                {/* Total Offers */}
                {store.total_offers !== undefined && (
                  <div style={{ marginBottom: "12px" }}>
                    <Tag color="blue" style={{ fontSize: "14px" }}>
                      {store.total_offers} Offers
                    </Tag>
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
      </div>
    </Show>
  );
}; 