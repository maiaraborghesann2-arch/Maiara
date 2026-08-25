/**
 * Standalone entry for the shareable preview build.
 *
 * Deliberately nothing but a mount. It used to mirror `app/page.tsx` by hand,
 * and the two drifted — the shared link ran two acts short of the dev server
 * because this file still listed two scroll tracks. Both entry points now
 * render the same component, so there is nothing left here to fall behind.
 */
import { createRoot } from "react-dom/client";

import { Experience } from "@/components/stage/Experience";

createRoot(document.getElementById("root")!).render(<Experience />);
