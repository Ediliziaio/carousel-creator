import { createFileRoute, useParams } from "@tanstack/react-router";
import { CarouselBuilder } from "@/components/CarouselBuilder";

export const Route = createFileRoute("/projects/$projectId/builder/$contentId")({
  ssr: false,
  component: BuilderPage,
});

function BuilderPage() {
  const { projectId, contentId } = useParams({
    from: "/projects/$projectId/builder/$contentId",
  });
  return <CarouselBuilder key={contentId} projectId={projectId} contentId={contentId} />;
}
