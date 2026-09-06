import { useListDocuments } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, UploadCloud } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Documents() {
  const { data: documents, isLoading } = useListDocuments();

  if (isLoading) {
    return <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-muted rounded-2xl" />
      <div className="h-24 bg-muted rounded-2xl" />
    </div>;
  }

  // Group by category
  const categorized = documents?.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  return (
    <div className="space-y-6">
      <div className="py-2 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Documents</h1>
          <p className="text-muted-foreground text-lg">Important files shared with the circle.</p>
        </div>
        <Button variant="secondary" className="rounded-full shadow">
          <UploadCloud className="w-5 h-5 me-2" /> Upload
        </Button>
      </div>

      <div className="space-y-8">
        {Object.entries(categorized || {}).map(([category, docs]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-bold capitalize text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" /> 
              {category}
            </h2>
            <div className="grid gap-4">
              {docs.map(doc => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{doc.fileName}</h3>
                        <p className="text-sm text-muted-foreground">Uploaded by {doc.uploaderName} • {formatDate(doc.uploadedAt)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full shrink-0 text-muted-foreground hover:text-primary">
                      <Download className="w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {(!documents || documents.length === 0) && (
          <div className="text-center p-12 bg-muted rounded-3xl">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No documents yet</h3>
            <p className="text-muted-foreground">Upload important files to share with the circle.</p>
          </div>
        )}
      </div>
    </div>
  );
}
