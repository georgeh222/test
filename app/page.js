cat > app/page.js <<'EOF'
"use client";
import dynamic from "next/dynamic";

// Client-only because MapLibre needs window
const OpenAcreApp = dynamic(() => import("@/components/OpenAcreApp"), { ssr: false });

export default function Page() {
  return <OpenAcreApp />;
}
EOF
