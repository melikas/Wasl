export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <h1 className="text-4xl font-bold text-primary">Page Not Found</h1>
      <p className="text-muted-foreground">The page you are looking for doesn't exist or has been moved.</p>
    </div>
  );
}