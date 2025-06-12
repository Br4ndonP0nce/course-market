// src/app/test-upload/layout.tsx
export default function TestUploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-8">{children}</div>
    </div>
  );
}
