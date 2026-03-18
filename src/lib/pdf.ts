import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  title: string;
  type: string;
  generatedAt: string;
  summary?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
}

export function generateReportPDF(data: ReportData) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(10, 15, 20);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(0, 210, 178);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("NAZAR", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(150, 160, 170);
  doc.text("Email Security Monitoring Dashboard", 14, 26);
  doc.setFontSize(8);
  doc.text(`Generated: ${data.generatedAt}`, 14, 34);

  // Title
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, 14, 55);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Type: ${data.type}`, 14, 63);

  if (data.summary) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(data.summary, 180);
    doc.text(lines, 14, 75);
  }

  if (data.tableHeaders && data.tableRows) {
    autoTable(doc, {
      startY: data.summary ? 90 : 75,
      head: [data.tableHeaders],
      body: data.tableRows,
      theme: "grid",
      headStyles: { fillColor: [0, 170, 140], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`NAZAR - Confidential | Page ${i} of ${pageCount}`, 14, 287);
  }

  doc.save(`${data.title.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}
