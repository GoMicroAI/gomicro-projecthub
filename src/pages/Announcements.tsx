import { AppLayout } from "@/components/layout/AppLayout";
import { AnnouncementsFeed } from "@/components/announcements/AnnouncementsFeed";

export default function Announcements() {
  return (
    <AppLayout title="Announcements">
      <div className="h-full overflow-hidden">
        <AnnouncementsFeed />
      </div>
    </AppLayout>
  );
}
