import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UploadLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UploadLinkDialog({ open, onOpenChange, onSuccess }: UploadLinkDialogProps) {
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkName.trim() || !linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('content_tasks')
        .insert({
          title: linkName,
          description: linkUrl,
          status: 'published',
          priority: 'medium',
          platform: 'link',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post link uploaded successfully",
      });

      setLinkName("");
      setLinkUrl("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error uploading link:', error);
      toast({
        title: "Error",
        description: "Failed to upload post link",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Post Link</DialogTitle>
          <DialogDescription>
            Save a published post link with a custom name
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="linkName">Post Name</Label>
            <Input
              id="linkName"
              placeholder="e.g., Tower 3 Launch Post"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="linkUrl">Post URL</Label>
            <Input
              id="linkUrl"
              type="url"
              placeholder="https://instagram.com/p/..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
