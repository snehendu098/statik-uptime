"use client";

import RootLayout from "@/components/common/root-layout";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <RootLayout>{children}</RootLayout>;
};

export default Layout;
