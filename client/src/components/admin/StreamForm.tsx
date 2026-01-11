import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Stream } from "@shared/schema.ts";

const streamFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  twitchChannelName: z.string().optional(),
  iframeCode: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0, "Display order must be 0 or greater").default(0),
  isActive: z.boolean().default(true),
}).refine(
  (data) => data.twitchChannelName || data.iframeCode,
  {
    message: "Either Twitch channel name or iframe code is required",
    path: ["twitchChannelName"]
  }
);

type StreamFormValues = z.infer<typeof streamFormSchema>;

interface StreamFormProps {
  stream?: Stream;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export default function StreamForm({ stream, isEditing = false, onSuccess }: StreamFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputType, setInputType] = useState<'channel' | 'iframe'>(
    stream?.iframeCode ? 'iframe' : 'channel'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StreamFormValues>({
    resolver: zodResolver(streamFormSchema),
    defaultValues: {
      title: stream?.title || "",
      twitchChannelName: stream?.twitchChannelName || "",
      iframeCode: stream?.iframeCode || "",
      description: stream?.description || "",
      displayOrder: stream?.displayOrder || 0,
      isActive: stream?.isActive ?? true,
    },
  });

  const isActive = watch("isActive");
  const twitchChannelName = watch("twitchChannelName");
  const iframeCode = watch("iframeCode");

  // Helper function to update parent domain in iframe code
  const updateIframeDomain = (iframe: string): string => {
    if (!iframe) return iframe;
    
    const currentDomain = typeof window !== 'undefined' 
      ? window.location.hostname 
      : 'localhost';
    
    // Replace parent parameter in iframe src
    return iframe.replace(
      /parent=([^"&\s]+)/g,
      `parent=${currentDomain}`
    );
  };

  const onSubmit = async (data: StreamFormValues) => {
    // Update iframe code with current domain if provided
    if (data.iframeCode) {
      data.iframeCode = updateIframeDomain(data.iframeCode);
    }
    try {
      setIsSubmitting(true);

      const url = isEditing 
        ? `/api/admin/streams/${stream?.id}`
        : '/api/admin/streams';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: isEditing ? "Stream Updated" : "Stream Created",
          description: isEditing 
            ? "The stream has been updated successfully." 
            : "The stream has been created successfully.",
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          setLocation('/admin/streams');
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save stream",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving stream:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving the stream",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-amber-200 text-2xl">
                {isEditing ? "Edit Stream" : "Create New Stream"}
              </CardTitle>
              <CardDescription className="text-amber-200/60 mt-2">
                {isEditing 
                  ? "Update the stream information below." 
                  : "Fill in the details to add a new Twitch stream."}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/admin/streams')}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-amber-200">
                Stream Title *
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., Weekly Live Mix"
                className="bg-black/60 border-amber-500/30 text-amber-200 placeholder:text-amber-400/50 focus:border-amber-500"
              />
              {errors.title && (
                <p className="text-sm text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Stream Source - Channel or Iframe */}
            <div className="space-y-4">
              <div>
                <Label className="text-amber-200 mb-3 block">
                  Stream Source *
                </Label>
                <Tabs value={inputType} onValueChange={(value) => setInputType(value as 'channel' | 'iframe')}>
                  <TabsList className="grid w-full grid-cols-2 bg-black/40 border-amber-500/20">
                    <TabsTrigger 
                      value="channel" 
                      className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-amber-200"
                    >
                      Channel Name
                    </TabsTrigger>
                    <TabsTrigger 
                      value="iframe" 
                      className="data-[state=active]:bg-amber-600 data-[state=active]:text-black text-amber-200"
                    >
                      <Code className="w-4 h-4 mr-2" />
                      Iframe Code
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="channel" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitchChannelName" className="text-amber-200">
                        Twitch Channel Name
                      </Label>
                      <Input
                        id="twitchChannelName"
                        {...register("twitchChannelName")}
                        placeholder="e.g., izuranmusic"
                        className="bg-black/60 border-amber-500/30 text-amber-200 placeholder:text-amber-400/50 focus:border-amber-500"
                        onChange={(e) => {
                          register("twitchChannelName").onChange(e);
                          if (e.target.value) {
                            setValue("iframeCode", "");
                          }
                        }}
                      />
                      <p className="text-sm text-amber-200/60">
                        Enter the Twitch channel name (without @ or URL) for live streams
                      </p>
                      {errors.twitchChannelName && (
                        <p className="text-sm text-red-400">{errors.twitchChannelName.message}</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="iframe" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="iframeCode" className="text-amber-200">
                        Iframe Embed Code
                      </Label>
                      <Textarea
                        id="iframeCode"
                        {...register("iframeCode")}
                        placeholder='<iframe src="https://player.twitch.tv/?video=2629478709&parent=www.example.com" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>'
                        rows={6}
                        className="bg-black/60 border-amber-500/30 text-amber-200 placeholder:text-amber-400/50 focus:border-amber-500 resize-none font-mono text-sm"
                        onChange={(e) => {
                          register("iframeCode").onChange(e);
                          if (e.target.value) {
                            setValue("twitchChannelName", "");
                          }
                        }}
                      />
                      <p className="text-sm text-amber-200/60">
                        Paste the complete iframe code from Twitch. The <code className="text-amber-400">parent</code> parameter will be automatically updated to your current domain when you save.
                      </p>
                      <p className="text-xs text-amber-300/50 mt-1">
                        💡 Tip: You can paste the iframe code as-is from Twitch, and we'll handle the domain configuration automatically.
                      </p>
                      {errors.iframeCode && (
                        <p className="text-sm text-red-400">{errors.iframeCode.message}</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-amber-200">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Add a description for this stream..."
                rows={4}
                className="bg-black/60 border-amber-500/30 text-amber-200 placeholder:text-amber-400/50 focus:border-amber-500 resize-none"
              />
              {errors.description && (
                <p className="text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="displayOrder" className="text-amber-200">
                Display Order
              </Label>
              <Input
                id="displayOrder"
                type="number"
                {...register("displayOrder", { valueAsNumber: true })}
                placeholder="0"
                className="bg-black/60 border-amber-500/30 text-amber-200 placeholder:text-amber-400/50 focus:border-amber-500"
              />
              <p className="text-sm text-amber-200/60">
                Lower numbers appear first. Use this to control the order of streams on the page.
              </p>
              {errors.displayOrder && (
                <p className="text-sm text-red-400">{errors.displayOrder.message}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-amber-500/20">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-amber-200">
                  Active Status
                </Label>
                <p className="text-sm text-amber-200/60">
                  Only active streams will be displayed on the public streams page.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                className="data-[state=checked]:bg-amber-600"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/admin/streams')}
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-500 text-black"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-black mr-2"></div>
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Update Stream" : "Create Stream"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

