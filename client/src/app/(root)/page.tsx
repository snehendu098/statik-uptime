import { WebsitesTable } from "@/components/home/websites-table";
import { RemainingCreditsCard } from "@/components/home/remaining-credits-card";
import { CreateMonitorCard } from "@/components/home/create-monitor-card";

interface Website {
  id: string;
  url: string;
  disabled: boolean;
  checkIntervalMinutes: number;
  currentStatus: "Good" | "Bad" | "Unknown";
  lastChecked: string | null;
  uptimePercentage: number;
}

// Mock data for demonstration (matching the API response)
const mockWebsites: Website[] = [
  {
    id: "1",
    url: "https://example.com",
    disabled: false,
    checkIntervalMinutes: 5,
    currentStatus: "Good",
    lastChecked: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    uptimePercentage: 98.96,
  },
  {
    id: "2",
    url: "https://mywebsite.io",
    disabled: false,
    checkIntervalMinutes: 10,
    currentStatus: "Good",
    lastChecked: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    uptimePercentage: 100,
  },
  {
    id: "3",
    url: "https://testsite.dev",
    disabled: false,
    checkIntervalMinutes: 5,
    currentStatus: "Bad",
    lastChecked: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    uptimePercentage: 90.28,
  },
  {
    id: "4",
    url: "https://api.service.com",
    disabled: false,
    checkIntervalMinutes: 1,
    currentStatus: "Good",
    lastChecked: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    uptimePercentage: 99.86,
  },
];

export default function Home() {
  const websites: Website[] = mockWebsites;

  return (
    <div className="w-full">
      <div className="flex mb-6 items-center justify-between">
        <p className="text-3xl font-semibold mb-8">Monitors</p>
      </div>
      <div className="w-full grid grid-cols-6 gap-6">
        <WebsitesTable websites={websites} />
        <div className="col-span-2 space-y-6">
          <RemainingCreditsCard />
          <CreateMonitorCard />
        </div>
      </div>
    </div>
  );
}
