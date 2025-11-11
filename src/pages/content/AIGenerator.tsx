import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Copy, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const TONE_PRESETS = [
  { value: 'formal', label: 'Formal', description: 'Professional and business-like' },
  { value: 'conversational', label: 'Conversational', description: 'Friendly and casual' },
  { value: 'humorous', label: 'Humorous', description: 'Fun and entertaining' },
  { value: 'value', label: 'Value Series', description: 'Educational and informative' }
];

export default function AIGenerator() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("conversational");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for the script",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const toneInstruction = TONE_PRESETS.find(t => t.value === tone)?.description || '';
      const fullPrompt = `Generate a social media script with a ${toneInstruction} tone. ${prompt}`;

      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: { 
          prompt: fullPrompt,
          baseline: "Create engaging social media content"
        }
      });

      if (error) throw error;

      const script = data.scripts?.[0] || data.script || "";
      setGeneratedScript(script);

      toast({
        title: "Success",
        description: "Script generated successfully!",
      });
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        title: "Error",
        description: "Failed to generate script",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard",
    });
  };

  const handleSaveToTask = async () => {
    if (!generatedScript) return;

    try {
      const { error } = await supabase
        .from('content_tasks')
        .insert({
          title: `AI Generated Script - ${format(new Date(), 'MMM dd, yyyy')}`,
          description: generatedScript,
          status: 'script',
          priority: 'medium',
          platform: 'instagram',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Script saved as a new task",
      });
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Error",
        description: "Failed to save script as task",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Script Generator</h1>
        <p className="text-muted-foreground">Generate engaging scripts for your social media content</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Script</CardTitle>
            <CardDescription>Describe what you want to create</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Content Description</Label>
              <Textarea
                placeholder="e.g., Generate a 45-sec Roman Urdu ad script for Tower 3 targeting investors"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
              />
            </div>

            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <div>
                        <div>{preset.label}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerate} 
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
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Script
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Tone Presets</h4>
              <div className="flex flex-wrap gap-2">
                {TONE_PRESETS.map((preset) => (
                  <Badge
                    key={preset.value}
                    variant={tone === preset.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setTone(preset.value)}
                  >
                    {preset.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Script</CardTitle>
            <CardDescription>Your AI-generated content will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedScript ? (
              <div className="space-y-4">
                <Textarea
                  value={generatedScript}
                  readOnly
                  rows={12}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button onClick={handleSaveToTask} className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Save to Task
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Your generated script will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
