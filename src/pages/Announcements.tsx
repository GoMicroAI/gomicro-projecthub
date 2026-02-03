import { AppLayout } from "@/components/layout/AppLayout";
import { AnnouncementsFeed } from "@/components/announcements/AnnouncementsFeed";
import { useAnnouncements } from "@/hooks/useAnnouncements";

export default function Announcements() {
  const { refetch } = useAnnouncements();

  return (
    <AppLayout title="Announcements" onRefresh={() => refetch()}>
      <div className="h-full overflow-hidden">
        <AnnouncementsFeed />
      </div>
    </AppLayout>
  );
}
