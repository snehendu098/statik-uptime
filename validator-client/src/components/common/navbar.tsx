"use client";

import { client } from "@/lib/thirdweb-client";
import Image from "next/image";
import Link from "next/link";
import { defineChain } from "thirdweb";
import { ConnectButton } from "thirdweb/react";

const Navbar = () => {
  return (
    <div className="w-full p-4 flex items-center justify-center">
      <div className="flex items-center justify-between w-full max-w-6xl">
        <div className="flex space-x-6 items-center">
          <Link href={"/"}>
            <div className="flex items-center space-x-2">
              <Image src={"/logo.png"} height={15} width={20} alt="logo" />
              <p className="text-lg uppercase font-semibold">Statik</p>
            </div>
          </Link>
        </div>
        <ConnectButton
          client={client}
          chain={defineChain(2484)}
          connectButton={{
            className:
              "!bg-primary !rounded-2xl !hover:bg-primary/40 !text-white",
          }}
        />
      </div>
    </div>
  );
};

export default Navbar;
