
import StoryViewerClient from "./StoryViewerClient";

export async function generateStaticParams() {
    return [{ id: '1' }];
}

export default function StoryPage() {
    return <StoryViewerClient />;
}
