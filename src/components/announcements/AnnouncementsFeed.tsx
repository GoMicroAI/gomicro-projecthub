import { useAnnouncements } from "@/hooks/useAnnouncements";
import { CreateAnnouncementForm } from "./CreateAnnouncementForm";
import { AnnouncementCard } from "./AnnouncementCard";
import { Loader2, Megaphone } from "lucide-react";

export function AnnouncementsFeed() {
  const { announcements, isLoading, createAnnouncement, deleteAnnouncement } = useAnnouncements();

  const handleCreate = async (data: { content: string; imageFile?: File }) => {
    await createAnnouncement.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Form */}
      <CreateAnnouncementForm onSubmit={handleCreate} isPending={createAnnouncement.isPending} />

      {/* Feed */}
      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No announcements yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onDelete={(id) => deleteAnnouncement.mutate(id)}
              isDeleting={deleteAnnouncement.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
