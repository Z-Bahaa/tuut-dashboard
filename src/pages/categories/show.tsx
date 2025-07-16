import { Show, ImageField } from "@refinedev/antd";
import { Typography, Button, Image, Tag, Card, Space, Avatar } from "antd";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useOne } from "@refinedev/core";

const { Title, Text, Paragraph } = Typography;

export const CategoryShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);

  // Fetch category data
  const { data: categoryData, isLoading: categoryLoading } = useOne({
    resource: "categories",
    id: id || "",
  });

  const category = categoryData?.data;

  // Update document title when category data is loaded
  useEffect(() => {
    if (category?.title) {
      document.title = `${category.title} - Category Details`;
    }
  }, [category?.title]);

  if (categoryLoading) {
    return <div>Loading...</div>;
  }

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <Show
      headerButtons={[
        <Button
          key="back"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/categories")}
        >
          Back to List
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/categories/edit/${id}`)}
          style={{
            color: mode === "dark" ? "#000000" : "#ffffff"
          }}
        >
          Edit
        </Button>,
      ]}
    >
      <div style={{ width: "100%" }}>
        {/* Category Header Card */}
        <Card 
          style={{ marginBottom: "16px", padding: 0, overflow: "hidden" }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Category Info */}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Category Image */}
              {category.image_url && (
                <ImageField
                  value={category.image_url}
                  width={120}
                  height={120}
                  style={{ 
                    objectFit: 'cover',
                    flexShrink: 0,
                    borderRadius: '10px'
                  }}
                />
              )}
              
              {/* Title and Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <div>
                    <Title level={2} style={{ margin: "0 0 8px 0" }}>
                      {category.title}
                    </Title>
                    
                    {category.slug && (
                      <Text type="secondary" style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>
                        @{category.slug}
                      </Text>
                    )}
                  </div>

                  {/* Status Tags */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", alignItems: "flex-end" }}>
                    <Tag 
                      color={category.is_active ? "green" : "default"}
                      style={{ 
                        fontSize: "14px",
                        padding: "4px 8px",
                        height: "auto",
                        minWidth: "80px",
                        justifyContent: "center",
                        alignItems: "center",
                        display: "flex",
                        textAlign: "center",
                        backgroundColor: category.is_active && mode === "light" ? "#f6ffed" : mode === "light" ? "#e8e8e8" : undefined,
                        borderColor: category.is_active && mode === "light" ? "#b7eb8f" : mode === "light" ? "#bfbfbf" : undefined,
                        color: category.is_active && mode === "light" ? "#52c41a" : mode === "light" ? "#434343" : undefined,
                      }}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </Tag>
                    
                    {category.sort_order !== undefined && (
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
                        Sort: {category.sort_order}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>




      </div>
    </Show>
  );
};