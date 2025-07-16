import { Create, useForm, useNotificationProvider } from "@refinedev/antd";
import { Form, Input, Button, Switch, Upload, message, InputNumber } from "antd";
import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { useContext, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

export const CategoryCreate = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps } = useForm({
    resource: "categories",
  });

  // Image upload states
  const [imageURL, setImageURL] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const { open } = useNotificationProvider();

  const handleImageFileChange = (info: any) => {
    if (info.fileList.length > 0) {
      const selectedFile = info.fileList[0].originFileObj;
      setImageFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setImagePreview(previewUrl);
    }
  };

  const handleImageDelete = () => {
    setImageURL('');
    setImagePreview('');
    setImageFile(null);
  };

  const handleSave = async (values: any) => {
    let finalImageURL = imageURL;

    // Upload image if selected
    if (imageFile) {
      setImageUploadLoading(true);
      const slug = values.slug || 'category';
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${slug}_category_img.${fileExtension}`;

      // Remove any existing file with the same name
      await supabase.storage
        .from('store-assets')
        .remove([`category-images/${fileName}`]);

      const { data: uploadData, error } = await supabase.storage
        .from('store-assets')
        .upload(`category-images/${fileName}`, imageFile);

      if (error) {
        message.error(`Failed to upload image: ${error.message}`);
        setImageUploadLoading(false);
        return;
      }

      const { data: signedURLData, error: signedURLError } = await supabase.storage
        .from('store-assets')
        .createSignedUrl(`category-images/${fileName}`, 3153600000); // 1-year expiration

      if (signedURLError) {
        message.error('Failed to generate signed URL for image');
        setImageUploadLoading(false);
        return;
      }

      finalImageURL = signedURLData.signedUrl;
      setImageUploadLoading(false);
    } else {
      open({
        type: "error",
        description: "Category image is required",
        message: "Please upload a category image",
      });
      return;
    }

    // Show upload success notification
    if (imageFile) {
      open({
        type: "success",
        message: "Category image uploaded successfully",
        description: "Upload Success",
      });
    }

    if (formProps.onFinish) {
      await formProps.onFinish({ 
        ...values, 
        image_url: finalImageURL
      });
    } else {
      message.error("Form submit function not available");
    }
  };

  return (
    <Create
      saveButtonProps={{ 
        ...saveButtonProps, 
        onClick: () => formProps.form?.submit(),
        style: {
          color: mode === "dark" ? "#000000" : "#ffffff"
        }
      }}
      isLoading={imageUploadLoading}
    >
      <Form {...formProps} layout="vertical" onFinish={handleSave}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter category title" }]}
        >
          <Input placeholder="Enter category title" />
        </Form.Item>

        <Form.Item
          label="Slug"
          name="slug"
          rules={[
            { required: true, message: "Please enter category slug" },
            { 
              pattern: /^[a-z0-9-]+$/, 
              message: "Slug can only contain lowercase letters, numbers, and hyphens" 
            }
          ]}
        >
          <Input placeholder="Enter category slug (e.g., electronics)" />
        </Form.Item>

        <Form.Item
          label="Sort Order"
          name="sort_order"
          initialValue={0}
          rules={[{ required: true, message: "Please enter sort order" }]}
        >
          <InputNumber 
            placeholder="Enter sort order (0, 1, 2, ...)" 
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="Activity"
          name="is_active"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Inactive"
            style={{ 
              transform: 'scale(1.25)',
              marginLeft: '5px'
            }}
          />
        </Form.Item>
        <style>
          {`
            .ant-switch-checked .ant-switch-handle::before {
              background-color: ${mode === "dark" ? "#141414" : "#ffffff"} !important;
            }
            .ant-switch-checked .ant-switch-inner-checked {
              color: ${mode === "dark" ? "#141414" : "#ffffff"} !important;
            }
              
          `}
        </style>

        {!imagePreview ? (
          <Form.Item
            label="Category Image"
            rules={[
              {
                required: true,
                message: "Category image is required"
              },
            ]}
          >
            <Upload
              beforeUpload={() => false} // Prevent automatic upload
              onChange={handleImageFileChange}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Choose Image</Button>
            </Upload>
          </Form.Item>
        ) : (
          <>
            <Form.Item label="Category Image Preview">
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: "8px",
                  objectFit: 'cover'
                }} 
              />
            </Form.Item>

            <Form.Item>
              <Upload
                beforeUpload={() => false} // Prevent automatic upload
                onChange={handleImageFileChange}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Change Image</Button>
              </Upload>
              <Button 
                onClick={handleImageDelete}
                style={{ marginLeft: '8px' }}
              >
                Delete Image
              </Button>
            </Form.Item>
          </>
        )}
      </Form>
    </Create>
  );
}; 