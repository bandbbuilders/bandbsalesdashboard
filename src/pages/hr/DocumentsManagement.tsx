import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Download, Trash2, Search, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  created_at: string;
  employee_name?: string;
}

const DOCUMENT_TYPES = [
  { value: "cnic", label: "CNIC" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "nda", label: "NDA" },
  { value: "experience_letter", label: "Experience Letter" },
  { value: "education", label: "Educational Documents" },
  { value: "other", label: "Other" },
];

const DocumentsManagement = () => {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadData, setUploadData] = useState({
    employee_id: "",
    document_type: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch documents
      const { data: docs, error } = await supabase
        .from("employee_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch employees
      const { data: empDetails } = await supabase
        .from("employee_details")
        .select("*");

      if (empDetails && empDetails.length > 0) {
        const profileIds = empDetails.map(e => e.profile_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds);

        const enrichedEmployees = empDetails.map(emp => ({
          ...emp,
          profile: profiles?.find(p => p.id === emp.profile_id)
        }));

        setEmployees(enrichedEmployees);

        // Enrich documents with employee names
        if (docs) {
          const enrichedDocs = docs.map(doc => {
            const emp = enrichedEmployees.find(e => e.id === doc.employee_id);
            return {
              ...doc,
              employee_name: emp?.profile?.full_name || "Unknown"
            };
          });
          setDocuments(enrichedDocs as EmployeeDocument[]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.employee_id || !uploadData.document_type || !uploadData.file) {
      toast.error("Please fill all fields");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upload file to storage
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${uploadData.employee_id}/${uploadData.document_type}_${Date.now()}.${fileExt}`;

      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from("hr-documents")
        .upload(fileName, uploadData.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("hr-documents")
        .getPublicUrl(fileName);

      // Save document record
      const { error: insertError } = await supabase
        .from("employee_documents")
        .insert({
          employee_id: uploadData.employee_id,
          document_type: uploadData.document_type,
          document_name: uploadData.file.name,
          document_url: publicUrl,
          uploaded_by: user?.id,
        });

      if (insertError) throw insertError;

      toast.success("Document uploaded successfully");
      setShowUploadDialog(false);
      setUploadData({ employee_id: "", document_type: "", file: null });
      fetchData();
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, docUrl: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Extract file path from URL
      const urlParts = docUrl.split("/hr-documents/");
      if (urlParts.length > 1) {
        await supabase.storage
          .from("hr-documents")
          .remove([urlParts[1]]);
      }

      // Delete record
      await supabase
        .from("employee_documents")
        .delete()
        .eq("id", docId);

      toast.success("Document deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      cnic: "bg-blue-500",
      offer_letter: "bg-green-500",
      nda: "bg-purple-500",
      experience_letter: "bg-orange-500",
      education: "bg-cyan-500",
      other: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  // Group documents by employee
  const documentsByEmployee = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.employee_id]) {
      acc[doc.employee_id] = {
        employee_name: doc.employee_name || "Unknown",
        documents: []
      };
    }
    acc[doc.employee_id].documents.push(doc);
    return acc;
  }, {} as Record<string, { employee_name: string; documents: EmployeeDocument[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={uploadData.employee_id}
                  onValueChange={(v) => setUploadData({ ...uploadData, employee_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.profile?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={uploadData.document_type}
                  onValueChange={(v) => setUploadData({ ...uploadData, document_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                />
                <p className="text-xs text-muted-foreground">
                  Accepted: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold">{documents.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <FolderOpen className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold">{Object.keys(documentsByEmployee).length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Employees with Docs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Upload className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold">
                {documents.filter(d => d.document_type === "cnic").length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">CNICs Uploaded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold">
                {documents.filter(d => d.document_type === "offer_letter").length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Offer Letters</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found. Upload documents to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Uploaded On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.employee_name}</TableCell>
                      <TableCell>
                        <Badge className={getDocumentTypeColor(doc.document_type)}>
                          {getDocumentTypeLabel(doc.document_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{doc.document_name}</TableCell>
                      <TableCell>{format(new Date(doc.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(doc.id, doc.document_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsManagement;
