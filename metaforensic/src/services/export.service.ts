import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExtractedMetadata, PrivacyReport, VerificationReport } from '../types/metadata.types';

export class ExportService {
  static exportJSON(file: File, metadata: ExtractedMetadata, privacy: PrivacyReport, verification?: VerificationReport) {
    const exportData = {
      file: metadata.fileInfo,
      privacyExposureScore: privacy.exposureScore,
      privacyFindings: privacy.findings,
      gps: metadata.gps,
      categories: metadata.categorized,
      verification: verification || null
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    this.downloadFile(dataStr, `metadata_${file.name}.json`);
  }

  static exportCSV(file: File, metadata: ExtractedMetadata) {
    const rows: string[] = [];
    rows.push('"Category","Tag","Value"'); // Header

    for (const [category, tags] of Object.entries(metadata.categorized)) {
      for (const [tag, value] of Object.entries(tags)) {
        const cleanValue = String(value).replace(/"/g, '""');
        rows.push(`"${category}","${tag}","${cleanValue}"`);
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.join('\n');
    this.downloadFile(csvContent, `metadata_${file.name}.csv`);
  }

  static async exportPDF(file: File, objectUrl: string, metadata: ExtractedMetadata, privacy: PrivacyReport, verification?: VerificationReport) {
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 14;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(33, 37, 41);
    doc.text('METAFORENSIC ANALYSIS REPORT', margin, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 15;

    // --- Image Preview ---
    try {
      const imgProps = await this.getImageFromUrl(objectUrl);
      const maxWidth = 100;
      const maxHeight = 100;
      let imgWidth = imgProps.width;
      let imgHeight = imgProps.height;

      if (imgWidth > maxWidth || imgHeight > maxHeight) {
        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        imgWidth *= ratio;
        imgHeight *= ratio;
      }

      doc.addImage(imgProps.dataUrl, imgProps.format, margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 15;
    } catch (e) {
      console.warn('Could not embed image preview in PDF', e);
      doc.text('Image preview unavailable.', margin, yPos);
      yPos += 10;
    }

    // --- File Summary ---
    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('File Summary', margin, yPos);
    yPos += 2;
    
    const fileSizeMB = (metadata.fileInfo.size / (1024 * 1024)).toFixed(2);
    autoTable(doc, {
      startY: yPos,
      body: [
        ['Filename', metadata.fileInfo.name],
        ['MIME Type', metadata.fileInfo.type],
        ['File Size', `${fileSizeMB} MB`],
        ['Total Metadata Tags', String(metadata.totalCount)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- Verification (If available) ---
    if (verification) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.text('Sanitization Verification', margin, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text(`Status: ${verification.status}`, margin, yPos);
      yPos += 6;
      doc.text(`Original Hash (SHA-256): ${verification.originalHash}`, margin, yPos);
      yPos += 6;
      doc.text(`Cleaned Hash (SHA-256): ${verification.cleanedHash}`, margin, yPos);
      yPos += 6;

      if (verification.limitations.length > 0) {
        doc.setTextColor(200, 100, 0);
        doc.text('Limitations:', margin, yPos);
        yPos += 6;
        verification.limitations.forEach(l => {
          doc.text(`- ${l}`, margin, yPos);
          yPos += 6;
        });
        doc.setTextColor(33, 37, 41);
      }

      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Before', 'After', 'Status']],
        body: verification.targets.map(t => [t.category, t.before, t.after, t.status]),
        theme: 'grid',
        headStyles: { fillColor: [40, 100, 40] },
        styles: { fontSize: 9, cellPadding: 3 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Privacy Analysis ---
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    
    doc.setFontSize(14);
    doc.text('Privacy & Security Findings', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(11);
    doc.text(`Privacy Exposure Score: ${privacy.exposureScore} / 100 (0 = Best)`, margin, yPos);
    yPos += 4;

    if (privacy.findings.length === 0) {
      autoTable(doc, {
        startY: yPos,
        body: [['No supported sensitive metadata detected.']],
        theme: 'plain',
        styles: { textColor: [0, 128, 0] }
      });
    } else {
      const privacyBody = privacy.findings.map(f => [
        f.severity,
        f.type,
        f.explanation,
        f.recommendation
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Severity', 'Finding', 'Explanation', 'Recommendation']],
        body: privacyBody,
        theme: 'grid',
        headStyles: { fillColor: [180, 50, 50] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 40, fontStyle: 'bold' },
          2: { cellWidth: 60 },
          3: { cellWidth: 'auto' }
        },
      });
    }
    
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- GPS Highlights (If present) ---
    if (metadata.gps) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.text('Location Data Extracted', margin, yPos);
      yPos += 2;
      
      autoTable(doc, {
        startY: yPos,
        body: [
          ['Latitude', String(metadata.gps.latitude)],
          ['Longitude', String(metadata.gps.longitude)],
          ['Map Link', `https://www.google.com/maps/search/?api=1&query=${metadata.gps.latitude},${metadata.gps.longitude}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Raw Metadata Dump ---
    doc.addPage();
    yPos = 20;
    doc.setFontSize(14);
    doc.text('Detailed Metadata Extracts', margin, yPos);
    yPos += 2;

    const rawBody: string[][] = [];
    for (const [category, tags] of Object.entries(metadata.categorized)) {
      for (const [tag, value] of Object.entries(tags)) {
        rawBody.push([category, tag, String(value)]);
      }
    }

    if (rawBody.length === 0) {
      doc.setFontSize(10);
      doc.text('No metadata extracted from this file.', margin, yPos + 10);
    } else {
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Tag', 'Value']],
        body: rawBody,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 50 },
          2: { cellWidth: 'auto', font: 'courier' }
        },
      });
    }

    // Save
    doc.save(`report_${file.name}.pdf`);
  }

  private static downloadFile(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static getImageFromUrl(url: string): Promise<{ dataUrl: string, format: string, width: number, height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0);
        
        // Always extract as JPEG for jsPDF compatibility
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ dataUrl, format: 'JPEG', width: img.width, height: img.height });
      };
      img.onerror = () => reject('Image load failed');
      img.src = url;
    });
  }
}
