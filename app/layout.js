cat > app/layout.js <<'EOF'
import "./globals.css";

export const metadata = {
  title: "OpenAcre",
  description: "Hunt & Fish Everywhere."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-green-900">{children}</body>
    </html>
  );
}
EOF
