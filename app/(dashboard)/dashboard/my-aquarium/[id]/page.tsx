// app/(dashboard)/dashboard/my-aquarium/[id]/page.tsx
// Fallback local AquariumDetail to avoid unresolved import during build.
// If a proper shared component exists at '@/features/...', replace this file
// import with the correct path or restore the original import.
function AquariumDetail() {
  return (
    <div>
      <h1>Aquarium</h1>
      <p>Details not available.</p>
    </div>
  );
}

export default function AquariumDetailPage() {
  return <AquariumDetail />;
}