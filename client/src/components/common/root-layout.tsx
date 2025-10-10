"use client";

import React from "react";
import Navbar from "./navbar";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-full">
      <Navbar />
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-6xl pb-6">{children}</div>
      </div>
    </div>
  );
};

export default RootLayout;
