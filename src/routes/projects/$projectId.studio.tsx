import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Video, User, Music, Trash2, Wand2, Upload } from "lucide-react";
import { toast } from "sonner";
import { getProject, type ProjectRow } from "@/lib/projectsApi";
import {
  listVideoAssets,
  createVideoAsset,
  deleteVideoAsset,
  type VideoAsset,
  type VideoAssetType,
} from "@/lib/videoAssetsApi";
import { UserMenu } from "@/components/UserMenu";
import { VideoGenerateDialog } from "@/components/VideoGenerateDialog";

export const Route = createFileRoute("/projects/$projectId/studio")({
  ssr: false,
  component: StudioPage,
});

function StudioPage() {
  const { projectId } = useParams({ from: "/projects/$projectId/studio" });
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<VideoAssetType>("video");

  useEffect(() => {
    void load();
  }, [projectId]);

  async function load() {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([getProject(projectId), listVideoAssets(projectId)]);
      setProject(p);
      setAssets(a);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = assets.filter((a) => a.type === tab);

  async function onVideoGenerated(url: string) {
    try {
      const asset = await createVideoAsset({
        projectId,
        type: "video",
        name: `Video ${new Date().toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
        url,
        meta: { source: "ai" },
      });
      setAssets((p) => [asset, ...p]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onUploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo immagini (PNG con sfondo trasparente consigliato)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const asset = await createVideoAsset({
          projectId,
          type: "avatar",
          name: file.name.replace(/\.[^.]+$/, ""),
          url: reader.result as string,
          meta: { source: "upload" },
        });
        setAssets((p) => [asset, ...p]);
        toast.success("Avatar caricato");
      } catch (e) {
        toast.error((e as Error).message);
      }
    };
    reader.readAsDataURL(file);
  }

  async function onDelete(id: string) {
    if (!confirm("Eliminare questa risorsa? Non reversibile.")) return;
    try {
      await deleteVideoAsset(id);
      setAssets((p) => p.filter((a) => a.id !== id));
      toast.success("Eliminato");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/projects/$projectId"
              params={{ projectId }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">🎬 Studio video</h1>
              <p className="text-xs text-muted-foreground">
                {project?.name ?? "…"} — risorse video, avatar, audio
              </p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Caricamento…
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as VideoAssetType)}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="video" className="gap-1.5">
                  <Video className="h-3.5 w-3.5" /> Video
                  <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                    {assets.filter((a) => a.type === "video").length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="avatar" className="gap-1.5">
                  <User className="h-3.5 w-3.5" /> Avatar
                  <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                    {assets.filter((a) => a.type === "avatar").length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="audio" className="gap-1.5">
                  <Music className="h-3.5 w-3.5" /> Audio
                  <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                    {assets.filter((a) => a.type === "audio").length}
                  </span>
                </TabsTrigger>
              </TabsList>

              {tab === "video" && (
                <VideoGenerateDialog
                  trigger={
                    <Button size="sm">
                      <Wand2 className="mr-1 h-4 w-4" /> Genera video AI
                    </Button>
                  }
                  onGenerated={onVideoGenerated}
                />
              )}
              {tab === "avatar" && (
                <div className="flex gap-2">
                  <Label
                    htmlFor="avatar-upload"
                    className="inline-flex cursor-pointer items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Upload className="mr-1 h-3.5 w-3.5" /> Carica PNG
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onUploadAvatar(f);
                        e.target.value = "";
                      }}
                    />
                  </Label>
                </div>
              )}
            </div>

            <TabsContent value="video" className="mt-0">
              <AssetGrid
                items={filtered}
                emptyMessage="Nessun video. Genera il primo b-roll AI ↑"
                onDelete={onDelete}
                renderPreview={(a) => (
                  <video
                    src={a.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    onMouseEnter={(e) => void (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => {
                      const v = e.target as HTMLVideoElement;
                      v.pause();
                      v.currentTime = 0;
                    }}
                  />
                )}
              />
            </TabsContent>

            <TabsContent value="avatar" className="mt-0">
              <AssetGrid
                items={filtered}
                emptyMessage="Nessun avatar caricato. Carica un PNG con sfondo trasparente ↑"
                onDelete={onDelete}
                renderPreview={(a) => (
                  <img
                    src={a.url}
                    alt={a.name}
                    className="h-full w-full object-contain"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                      backgroundSize: "12px 12px",
                      backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                    }}
                  />
                )}
              />
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <AssetGrid
                items={filtered}
                emptyMessage="Audio coming soon (TTS via ElevenLabs + upload MP3)"
                onDelete={onDelete}
                renderPreview={(a) => (
                  <div className="flex h-full items-center justify-center bg-muted/30">
                    <audio src={a.url} controls className="max-w-full" />
                  </div>
                )}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function AssetGrid({
  items,
  emptyMessage,
  onDelete,
  renderPreview,
}: {
  items: VideoAsset[];
  emptyMessage: string;
  onDelete: (id: string) => void;
  renderPreview: (a: VideoAsset) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <Card className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        {emptyMessage}
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((a) => (
        <Card key={a.id} className="group relative overflow-hidden p-2">
          <div className="aspect-[9/16] w-full overflow-hidden rounded-md bg-muted">
            {renderPreview(a)}
          </div>
          <div className="mt-2 truncate text-xs font-medium">{a.name}</div>
          <div className="text-[10px] text-muted-foreground">
            {new Date(a.created_at).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "short",
            })}
            {a.meta.source === "ai" ? " · AI" : ""}
          </div>
          <button
            onClick={() => onDelete(a.id)}
            className="absolute right-1.5 top-1.5 rounded-md bg-card/80 p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            title="Elimina"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </Card>
      ))}
    </div>
  );
}
