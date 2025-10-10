"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, StopCircle } from "lucide-react";
import Link from "next/link";

interface Website {
  id: string;
  url: string;
  disabled: boolean;
  checkIntervalMinutes: number;
  currentStatus: "Good" | "Bad" | "Unknown";
  lastChecked: string | null;
  uptimePercentage: number;
}

interface WebsitesTableProps {
  websites: Website[];
}

export function WebsitesTable({ websites }: WebsitesTableProps) {
  const formatTimeSince = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const cleanUrl = (url: string) => {
    return url
      .replace(/^https?:\/\//, "") // Remove http:// or https://
      .replace(/^www\./, ""); // Remove www.
  };

  return (
    <div className="w-full col-span-4">
      <div className="border bg-card rounded-4xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary">
              <TableHead className="w-[300px] p-4">Websites</TableHead>
              <TableHead className="text-right pr-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {websites.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-32 text-center text-muted-foreground"
                >
                  No monitors yet. Create your first monitor to get started!
                </TableCell>
              </TableRow>
            ) : (
              websites.map((website) => (
                <TableRow key={website.id}>
                  <>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 pl-2">
                        <span className="relative flex size-3">
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                              website.currentStatus === "Good"
                                ? "bg-green-600 dark:bg-green-400"
                                : website.currentStatus === "Bad"
                                  ? "bg-red-600 dark:bg-red-400"
                                  : "bg-gray-400 dark:bg-gray-500"
                            }`}
                          />
                          <span
                            className={`relative inline-flex size-3 rounded-full ${
                              website.currentStatus === "Good"
                                ? "bg-green-600 dark:bg-green-400"
                                : website.currentStatus === "Bad"
                                  ? "bg-red-600 dark:bg-red-400"
                                  : "bg-gray-400 dark:bg-gray-500"
                            }`}
                          />
                        </span>
                        <span className="text-sm">{cleanUrl(website.url)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {formatTimeSince(website.lastChecked)}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-accent"
                          asChild
                        >
                          <Link href={`/${website.id}`}>
                            <Eye className="h-4 text-muted-foreground w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-accent"
                          onClick={() => {
                            // Handle stop action
                            console.log("Stop website:", website.id);
                          }}
                        >
                          <StopCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
