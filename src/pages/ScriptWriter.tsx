import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Baseline {
  id: string;
  title: string;
  description: string | null;
  baseline_content: string;
}

interface GeneratedScript {
  id: string;
  script_content: string;
  prompt: string;
  created_at: string;
  baseline_id: string | null;
}

const ScriptWriter = () => {
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [selectedBaseline, setSelectedBaseline] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [generatedScripts, setGeneratedScripts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewBaselineDialog, setShowNewBaselineDialog] = useState(false);
  const [newBaseline, setNewBaseline] = useState({
    title: "",
    description: "",
    baseline_content: ""
  });
  const [userRole, setUserRole] = useState<string>("");
  const [savedScripts, setSavedScripts] = useState<GeneratedScript[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBaselines();
    fetchUserRole();
    fetchSavedScripts();
  }, []);

  const fetchUserRole = async () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  };

  const fetchBaselines = async () => {
    const { data, error } = await supabase
      .from('script_baselines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching baselines:', error);
      toast({
        title: "Error",
        description: "Failed to load baselines",
        variant: "destructive",
      });
    } else {
      setBaselines(data || []);
    }
  };

  const fetchSavedScripts = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const { data, error } = await supabase
      .from('generated_scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching scripts:', error);
    } else {
      setSavedScripts(data || []);
    }
  };

  const handleGenerateScript = async () => {
    if (!selectedBaseline) {
      toast({
        title: "Error",
        description: "Please select a baseline first",
        variant: "destructive",
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a generation prompt (e.g., 'Generate 5 scripts')",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const baseline = baselines.find(b => b.id === selectedBaseline);
      
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: {
          prompt,
          baseline: baseline?.baseline_content
        }
      });

      if (error) throw error;

      const scripts = data.scripts || [data.script];
      setGeneratedScripts(scripts);
      
      // Save to database
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const insertPromises = scripts.map((script: string) => 
          supabase.from('generated_scripts').insert({
            user_id: user.id,
            baseline_id: selectedBaseline || null,
            prompt,
            script_content: script
          })
        );
        await Promise.all(insertPromises);
        fetchSavedScripts();
      }

      toast({
        title: "Success",
        description: `Generated ${scripts.length} script(s) successfully!`,
      });
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        title: "Error",
        description: "Failed to generate scripts",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateBaseline = async () => {
    if (!newBaseline.title || !newBaseline.baseline_content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('No user found in localStorage');
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    const user = JSON.parse(userStr);
    console.log('Creating baseline for user:', user.id);

    const { data, error } = await supabase.from('script_baselines').insert({
      title: newBaseline.title,
      description: newBaseline.description,
      baseline_content: newBaseline.baseline_content,
      created_by: user.id
    }).select();

    if (error) {
      console.error('Error creating baseline:', error);
      toast({
        title: "Error",
        description: `Failed to create baseline: ${error.message}`,
        variant: "destructive",
      });
    } else {
      console.log('Baseline created successfully:', data);
      toast({
        title: "Success",
        description: "Baseline created successfully",
      });
      setShowNewBaselineDialog(false);
      setNewBaseline({ title: "", description: "", baseline_content: "" });
      fetchBaselines();
    }
  };

  const handleDeleteBaseline = async (id: string) => {
    const { error } = await supabase
      .from('script_baselines')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete baseline",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Baseline deleted successfully",
      });
      fetchBaselines();
      if (selectedBaseline === id) {
        setSelectedBaseline("");
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Script Writer</h1>
        <p className="text-muted-foreground">Generate marketing scripts with AI</p>
      </div>
      <Button onClick={() => setShowNewBaselineDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create New Baseline
      </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Script</CardTitle>
            <CardDescription>Select a baseline and enter your requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Baseline *</Label>
              <Select value={selectedBaseline} onValueChange={setSelectedBaseline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a baseline" />
                </SelectTrigger>
                <SelectContent>
                  {baselines.map((baseline) => (
                    <SelectItem key={baseline.id} value={baseline.id}>
                      {baseline.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBaseline && (
                <p className="text-sm text-muted-foreground mt-2">
                  {baselines.find(b => b.id === selectedBaseline)?.description}
                </p>
              )}
            </div>

            <div>
              <Label>Generation Prompt *</Label>
              <Textarea
                placeholder="e.g., 'Generate 5 scripts for social media promotion'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Specify how many scripts you want and any additional requirements
              </p>
            </div>

            <Button 
              onClick={handleGenerateScript} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Script
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Scripts</CardTitle>
            {generatedScripts.length > 0 && (
              <CardDescription>{generatedScripts.length} script(s) generated</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {generatedScripts.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {generatedScripts.map((script, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Script {index + 1}</h3>
                    <Textarea
                      value={script}
                      readOnly
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Your generated scripts will appear here
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {baselines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Baselines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {baselines.map((baseline) => (
                <div key={baseline.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{baseline.title}</h3>
                    {baseline.description && (
                      <p className="text-sm text-muted-foreground">{baseline.description}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBaseline(baseline.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showNewBaselineDialog} onOpenChange={setShowNewBaselineDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Baseline</DialogTitle>
            <DialogDescription>
              Create a template that AI will use to generate scripts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Product Launch Script"
                value={newBaseline.title}
                onChange={(e) => setNewBaseline({ ...newBaseline, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Brief description of this baseline"
                value={newBaseline.description}
                onChange={(e) => setNewBaseline({ ...newBaseline, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Baseline Prompt *</Label>
              <Textarea
                placeholder="Enter the baseline prompt that defines how scripts should be generated (e.g., 'Generate professional marketing scripts that focus on benefits and include a strong call-to-action')"
                value={newBaseline.baseline_content}
                onChange={(e) => setNewBaseline({ ...newBaseline, baseline_content: e.target.value })}
                rows={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This prompt will guide the AI when generating scripts
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBaselineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBaseline}>Create Baseline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptWriter;
