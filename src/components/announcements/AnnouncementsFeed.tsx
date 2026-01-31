import { useAnnouncements } from "@/hooks/useAnnouncements";
import { CreateAnnouncementForm } from "./CreateAnnouncementForm";
import { AnnouncementCard } from "./AnnouncementCard";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, ChevronDown } from "lucide-react";

export function AnnouncementsFeed() {
  const { 
    announcements, 
    isLoading, 
    hasMore, 
    isLoadingMore, 
    loadMore, 
    createAnnouncement, 
    deleteAnnouncement 
  } = useAnnouncements();

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
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)]">
      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto pb-4">
        {announcements.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Megaphone className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">No announcements yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onDelete={(id) => deleteAnnouncement.mutate(id)}
                isDeleting={deleteAnnouncement.isPending}
              />
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="w-full max-w-xs"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  Load older announcements
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Post Form - Fixed at bottom */}
      <div className="border-t pt-3 sm:pt-4 bg-background">
        <CreateAnnouncementForm onSubmit={handleCreate} isPending={createAnnouncement.isPending} />
      </div>
    </div>
  );
}
