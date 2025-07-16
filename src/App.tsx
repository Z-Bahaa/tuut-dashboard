import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  AuthPage,
  ErrorComponent,
  ThemedLayoutV2,
  ThemedSiderV2,
  useNotificationProvider,
  ImageField,
  TextField,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import authProvider from "./authProvider";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { supabaseClient } from "./utility";
import { StoreList } from "./pages/stores/list";
import { StoreCreate } from "./pages/stores/create";
import { StoreEdit } from "./pages/stores/edit";
import { StoreShow } from "./pages/stores/show";
import { DealList } from "./pages/deals/list";
import { DealCreate } from "./pages/deals/create";
import { DealEdit } from "./pages/deals/edit";
import { DealShow } from "./pages/deals/show";
import { CategoryList } from "./pages/categories/list";
import { CategoryCreate } from "./pages/categories/create";
import { CategoryEdit } from "./pages/categories/edit";
import { CategoryShow } from "./pages/categories/show";

        
import { ShoppingOutlined, GiftOutlined, TagsOutlined } from '@ant-design/icons';
import { useContext } from 'react';
import { ColorModeContext } from './contexts/color-mode';

// Separate component for the title that will re-render when theme changes
const TitleComponent = () => {
  const { mode } = useContext(ColorModeContext);
  
  return (
    <div style={{
      display: "flex", 
      alignItems: "center", 
      justifyItems: "center", 
      marginInlineStart: "-32px",
      position: "relative",
      width: "100px",
      height: "40px"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        opacity: mode === "light" ? 1 : 0,
        transition: "opacity 0.4s ease-in-out",
        pointerEvents: mode === "light" ? "auto" : "none"
      }}>
        <ImageField 
          value="/full-reverse-trans.png" 
          width={100} 
          style={{}} 
          preview={false}
        />
      </div>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        opacity: mode === "dark" ? 1 : 0,
        transition: "opacity 0.4s ease-in-out",
        pointerEvents: mode === "dark" ? "auto" : "none"
      }}>
        <ImageField 
          value="/full-trans.png" 
          width={100} 
          style={{}} 
          preview={false}
        />
      </div>
    </div>
  );
};

function App() {
  const { primaryColor, mode } = useContext(ColorModeContext);
  
  const customTitleHandler = ({ resource, action, params }: any) => {
    let title = "Tuut Dashboard"; // Default title
    
    if(resource.label !== "") title = resource.label + " | " + title;
    if(action && action !== 'list') title = action + " " + title;
    if(params.id) title = "#" + params.id + " " + title;   
    
    return title;
  };
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider(supabaseClient)}
                liveProvider={liveProvider(supabaseClient)}
                authProvider={authProvider}
                routerProvider={routerBindings}
                notificationProvider={useNotificationProvider}
                resources={[
                  {
                    name: "stores",
                    list: "/stores",
                    create: "/stores/create",
                    edit: "/stores/edit/:id",
                    show: "/stores/show/:id",
                    meta: {
                      canDelete: true,
                      label: "Stores",
                      icon: <ShoppingOutlined style={{color: primaryColor}}/>,
                    },
                  },
                  {
                    name: "deals",
                    list: "/deals",
                    create: "/deals/create",
                    edit: "/deals/edit/:id",
                    show: "/deals/show/:id",
                    meta: {
                      canDelete: true,
                      label: "Deals",
                      icon: <GiftOutlined style={{color: primaryColor}}/>,
                    },
                  },
                  {
                    name: "categories",
                    list: "/categories",
                    create: "/categories/create",
                    edit: "/categories/edit/:id",
                    show: "/categories/show/:id",
                    meta: {
                      canDelete: true,
                      label: "Categories",
                      icon: <TagsOutlined style={{color: primaryColor}}/>,
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  useNewQueryKeys: true,
                  projectId: "mvE57r-rKkUAo-dre7F2",
                  title: {
                    icon: <div style={{backgroundColor: "red",}}></div>,
                    text: <TitleComponent />,
                  },
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayoutV2
                          Header={Header}
                          Sider={(props) => <ThemedSiderV2 {...props} fixed />}
                        >
                          <Outlet />
                        </ThemedLayoutV2>
                      </Authenticated>
                    }
                  >
                    <Route
                      path="/"
                      index
                      element={<NavigateToResource resource="stores" />}
                    />
                    <Route path="/stores" element={<StoreList />} />
                    <Route path="/stores/create" element={<StoreCreate />} />
                    <Route path="/stores/edit/:id" element={<StoreEdit />} />
                    <Route path="/stores/show/:id" element={<StoreShow />} />
                    <Route path="/deals" element={<DealList />} />
                    <Route path="/deals/create" element={<DealCreate />} />
                    <Route path="/deals/edit/:id" element={<DealEdit />} />
                    <Route path="/deals/show/:id" element={<DealShow />} />
                    <Route path="/categories" element={<CategoryList />} />
                    <Route path="/categories/create" element={<CategoryCreate />} />
                    <Route path="/categories/edit/:id" element={<CategoryEdit />} />
                    <Route path="/categories/show/:id" element={<CategoryShow />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route
                      path="/login"
                      element={
                        <AuthPage
                          type="login"
                          formProps={{
                            initialValues: {
                              email: "zizobahaapersonal@gmail.com",
                              password: "zizo2636046",
                            },
                          }}
                        />
                      }
                    />
                    <Route
                      path="/register"
                      element={<AuthPage type="register" />}
                    />
                    <Route
                      path="/forgot-password"
                      element={<AuthPage type="forgotPassword" />}
                    />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler handler={customTitleHandler} />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
