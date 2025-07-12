import { RefineThemes } from "@refinedev/antd";
import { ConfigProvider, theme } from "antd";
import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";

type ColorModeContextType = {
  mode: string;
  setMode: (mode: string) => void;
  primaryColor: string;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType
);

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const colorModeFromLocalStorage = localStorage.getItem("colorMode");
  const isSystemPreferenceDark = window?.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const systemPreference = isSystemPreferenceDark ? "dark" : "light";
  const [mode, setMode] = useState(
    colorModeFromLocalStorage || systemPreference
  );

  useEffect(() => {
    window.localStorage.setItem("colorMode", mode);
  }, [mode]);

  const setColorMode = () => {
    if (mode === "light") {
      setMode("dark");
    } else {
      setMode("light");
    }
  };

  const { darkAlgorithm, defaultAlgorithm } = theme;

  const primaryColor = mode === "light" ? '#a134f6' : '#faff00';

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
        primaryColor,
      }}
    >
      <ConfigProvider
        // you can change the theme colors here. example: ...RefineThemes.Magenta,
        theme={{
          token: {
            colorPrimary: mode === "light" ? '#a134f6' : '#faff00',
            colorPrimaryHover: mode === "light" ? '#8a2be2' : '#e6e600',
            colorPrimaryActive: mode === "light" ? '#7b68ee' : '#cccc00',
            motionDurationFast: "400ms",
            motionDurationMid: "400ms",
            motionDurationSlow: "400ms",
            motionEaseInOut: "cubic-bezier(0.645, 0.045, 0.355, 1)",
          },
          algorithm: mode === "light" ? defaultAlgorithm : darkAlgorithm,
          components: {
            Layout: {
              bodyBg: mode === "light" ? "#ffffff" : "#141414",
              headerBg: mode === "light" ? "#ffffff" : "#141414",
              siderBg: mode === "light" ? "#ffffff" : "#141414",
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};
