import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { generateReportPDF } from "@/lib/pdf";
import type { Tables } from "@/integrations/supabase/types";

export default function Reports() {
  const [reports, setReports] = useState<Tables<"reports">[]>([]);

  useEffect(() => {
    supabase.from("reports").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setReports(data));
  }, []);

  const handleDownload = (report: Tables<"reports">) => {
    const data = (report.data || {}) as Record<string, unknown>;
    generateReportPDF({
      title: report.title,
      type: report.type,
      generatedAt: new Date(report.created_at).toLocaleString(),
      summary: (data.summary as string) || `Auto-generated ${report.type} report from Cyber Eye monitoring system.`,
      tableHeaders: (data.headers as string[]) || ["Metric", "Value"],
      tableRows: (data.rows as string[][]) || [["Total Events", "—"], ["Critical", "—"], ["Resolved", "—"]],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Reports</h1>
          <p className="text-sm text-muted-foreground">Download reports in PDF format</p>
        </div>
      </div>
      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="w-24">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No reports yet. Reports will appear here when generated.</TableCell></TableRow>
              ) : reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{r.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm capitalize">{r.type}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(r)} className="text-primary hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
