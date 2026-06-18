import { jsPDF } from 'jspdf';

/**
 * Clean helper to instantly format and download Patient + Assessment data as a CSV Excel file
 */
export function exportPatientToExcel(patient: any, matchedAssessment: any | null) {
  const rows: string[][] = [];

  // Add BOM for Microsoft Excel UTF-8 display of Urdu characters
  rows.push(["OVERPLAST CLINICAL SYSTEM - PATIENT GENERAL FILE & MEASUREMENTS"]);
  rows.push(["Generated At / ڈاؤن لوڈ کی تاریخ:", new Date().toLocaleString()]);
  rows.push([]);

  rows.push(["1. GENERAL PATIENT PROFILE / مریض کی عمومی معلومات"]);
  rows.push(["Field Parameter / فیلڈ", "Clinical Value / تفصیل"]);
  rows.push(["Patient Name / نام", patient.full_name || '']);
  rows.push(["Mobile Number / موبائل نمبر", patient.phone || '']);
  rows.push(["Age / عمر", `${patient.age || '—'} Yrs`]);
  rows.push(["Gender / جنس", patient.gender || '']);
  rows.push(["Referral Doctor / ڈاکٹر کا نام", patient.doctor_name || 'No referral']);
  rows.push(["Hospital name / ہسپتال", patient.hospital || 'Not declared']);
  rows.push(["Registration Date / تاریخ", patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '']);
  rows.push(["Physical Address / پتہ", patient.address || '']);
  rows.push(["Affected Area / متاثرہ جگہ", patient.medical_condition || 'General']);
  rows.push(["Doctor Clinical Notes / نوٹس", patient.notes || 'No additional notes added']);
  rows.push([]);

  if (matchedAssessment) {
    const subOptions = matchedAssessment.sub_options || matchedAssessment.measurements || {};
    rows.push(["2. GARMENT CLINICAL SPECIFICATION / گارمنٹ کا طبی جائزہ"]);
    rows.push(["Specification Parameter / فیلڈ", "Selected Value / تفصیل"]);
    rows.push(["Garment Type / گارمنٹ کی قسم", matchedAssessment.garment_type || '']);
    rows.push(["Compression Class / دباؤ کا درجہ", matchedAssessment.compression || '']);
    rows.push(["Silicone Pasting / سلیکون پیسٹنگ", matchedAssessment.silicone_pasting || '']);
    rows.push(["Assessment Date / تاریخ", matchedAssessment.created_at ? new Date(matchedAssessment.created_at).toLocaleDateString() : '']);
    rows.push(["Clinical Remarks / نوٹس", matchedAssessment.notes || 'No notes added']);
    if (subOptions['Custom Design Notes']) {
      rows.push(["Custom Design Notes / اضافی ڈیزائن نوٹس", subOptions['Custom Design Notes']]);
    }
    rows.push([]);

    rows.push(["3. ANATOMICAL POINT MEASUREMENTS / جسمانی پیمائش"]);
    rows.push(["Anatomical Point / پوانٹ", "Value Measured / پیمائش (cm)"]);
    
    Object.entries(subOptions).forEach(([key, val]) => {
      if (key !== 'Hand Selection' && key !== 'Custom Design Notes' && typeof val !== 'object' && val !== '') {
        rows.push([key, `${val} cm`]);
      }
    });
  } else {
    rows.push(["2. GARMENT ASSESSMENT STATUS / جائزہ کی معلومات"]);
    rows.push(["Status", "No Compression Garment Assessment Recorded Yet"]);
  }

  // Convert to CSV string where cells are properly encoded and commas are escaped
  const csvContent = "\ufeff" + rows.map(r => 
    r.map(val => {
      let cell = val === null || val === undefined ? "" : String(val);
      cell = cell.replace(/"/g, '""');
      if (cell.includes(",") || cell.includes('"') || cell.includes("\n") || cell.includes("\r")) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(",")
  ).join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  
  const sanitizedName = (patient.full_name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute("download", `Overplast_Excel_${sanitizedName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Clean helper to programmatically draw and compile an elegant high-contrast PDF Clinical Dossier
 */
export function exportPatientToPDF(patient: any, matchedAssessment: any | null) {
  // Create jsPDF portrait with mm spacing on A4 template
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 Dimension bounds: Width 210mm, Height 297mm
  
  // Outer Border Box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.rect(8, 8, 194, 281);
  
  // 1. Top Royal Navy Header Banner
  doc.setFillColor(15, 23, 42); // slate-900 (Deep High Contrast Slate)
  doc.rect(8, 8, 194, 38, 'F');
  
  // Accent Left Stripe
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(8, 8, 4, 38, 'F');
  
  // Overplast brand logo alternative text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('OVERPLAST', 18, 23);
  
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253); // blue-300
  doc.text('MEDICAL COMPRESSION SOLUTIONS', 18, 28.5);
  doc.text('Custom Garment Fabrication & Assessment Directory', 18, 33.5);
  
  // Right side header attributes
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINICAL PATIENT DATA', 132, 22);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text(`File Generated: ${new Date().toLocaleDateString()}`, 132, 27);
  doc.text(`Reference ID: OP-${patient.id ? patient.id.substring(0, 6).toUpperCase() : 'NEW'}`, 132, 32);

  let currentY = 54;
  
  // Section Title 1: General Info
  doc.setFillColor(241, 245, 249); // slate-100 background
  doc.rect(12, currentY, 186, 8, 'F');
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. PATIENT DEMOGRAPHICS & CLINICAL DATA', 16, currentY + 5.5);
  
  currentY += 14;
  
  // Left and Right Columns Coordinates
  const colLKey = 16;
  const colLVal = 48;
  const colRKey = 110;
  const colRVal = 142;
  const stepY = 7.5;
  
  const patientFieldsL = [
    { label: 'Patient Name:', val: patient.full_name || 'N/A', isBold: true },
    { label: 'Mobile No / Ph:', val: patient.phone || 'N/A' },
    { label: 'Age / Age Group:', val: `${patient.age || 'N/A'} Years` },
    { label: 'Gender / Sex:', val: (patient.gender || 'N/A').toUpperCase() }
  ];
  
  const patientFieldsR = [
    { label: 'Ref Doctor:', val: patient.doctor_name || 'Self / Direct Referral' },
    { label: 'Hospital:', val: patient.hospital || 'Not declared' },
    { label: 'Registered On:', val: patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A' },
    { label: 'Clinical Condition:', val: patient.medical_condition || 'General Compression' }
  ];
  
  patientFieldsL.forEach((f, idx) => {
    const py = currentY + (idx * stepY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(f.label, colLKey, py);
    doc.setFont('helvetica', f.isBold ? 'bold' : 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(f.val), colLVal, py);
  });

  patientFieldsR.forEach((f, idx) => {
    const py = currentY + (idx * stepY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(f.label, colRKey, py);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(f.val), colRVal, py);
  });
  
  currentY += (patientFieldsL.length * stepY) + 2;

  // Render Address
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Physical Address:', colLKey, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const fullAddress = patient.address || 'No local street address declared';
  if (fullAddress.length > 75) {
    doc.text(fullAddress.substring(0, 75) + '...', colLVal, currentY);
  } else {
    doc.text(fullAddress, colLVal, currentY);
  }
  
  currentY += 10;
  
  // Patient Notes
  if (patient.notes) {
    doc.setFillColor(254, 252, 232); // amber-50 background for highlight
    doc.setDrawColor(253, 224, 71); // amber-300
    doc.setLineWidth(0.3);
    doc.rect(12, currentY - 4, 186, 15, 'DF');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // amber-800
    doc.text('Notes / Clinical History:', 16, currentY + 0.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(patient.notes.substring(0, 105), 16, currentY + 6);
    currentY += 18;
  } else {
    currentY += 4;
  }
  
  // Section Title 2: Garment & Assessment Info
  doc.setFillColor(241, 245, 249);
  doc.rect(12, currentY, 186, 8, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('2. COMPRESSION APPAREL & CLINICAL SPECIFICATION', 16, currentY + 5.5);
  
  currentY += 14;

  if (matchedAssessment) {
    const garmentFieldsL = [
      { label: 'Garment Type:', val: matchedAssessment.garment_type || 'N/A', isBlue: true },
      { label: 'Silicone Lining:', val: matchedAssessment.silicone_pasting || 'None' }
    ];
    const garmentFieldsR = [
      { label: 'Compression:', val: matchedAssessment.compression || 'N/A', isBlue: true },
      { label: 'Assessment date:', val: matchedAssessment.created_at ? new Date(matchedAssessment.created_at).toLocaleDateString() : 'N/A' }
    ];

    garmentFieldsL.forEach((f, idx) => {
      const py = currentY + (idx * stepY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(f.label, colLKey, py);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(f.isBlue ? 37 : 15, f.isBlue ? 99 : 23, f.isBlue ? 235 : 42);
      doc.text(String(f.val), colLVal, py);
    });

    garmentFieldsR.forEach((f, idx) => {
      const py = currentY + (idx * stepY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(f.label, colRKey, py);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(f.isBlue ? 37 : 15, f.isBlue ? 99 : 23, f.isBlue ? 235 : 42);
      doc.text(String(f.val), colRVal, py);
    });

    const subOptions = matchedAssessment.sub_options || matchedAssessment.measurements || {};
    const designNotes = subOptions['Custom Design Notes'];
    if (designNotes) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Design Options:', colLKey, currentY + (garmentFieldsL.length * stepY));
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      
      const wrappedNotes = doc.splitTextToSize(String(designNotes), 140);
      doc.text(wrappedNotes, colLVal, currentY + (garmentFieldsL.length * stepY));
      currentY += (garmentFieldsL.length * stepY) + (wrappedNotes.length * 5) + 4;
    } else {
      currentY += (garmentFieldsL.length * stepY) + 6;
    }

    // Measurement anatomical list!
    doc.setFillColor(241, 245, 249);
    doc.rect(12, currentY, 186, 8, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('3. DETAILED ANATOMICAL MEASUREMENT METRICS', 16, currentY + 5.5);

    currentY += 14;

    const clinicalPoints = Object.entries(subOptions).filter(
      ([k, v]) => k !== 'Hand Selection' && k !== 'Custom Design Notes' && typeof v !== 'object' && v !== ''
    );

    if (clinicalPoints.length > 0) {
      // Titles
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Measurement Parameter', 16, currentY);
      doc.text('Clinical Value', 78, currentY);
      doc.text('Measurement Parameter', 110, currentY);
      doc.text('Clinical Value', 172, currentY);

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(12, currentY + 2, 198, currentY + 2);

      currentY += 7;
      doc.setFontSize(9);

      const splitLength = Math.ceil(clinicalPoints.length / 2);
      for (let i = 0; i < splitLength; i++) {
        const itemL = clinicalPoints[i];
        const itemR = clinicalPoints[i + splitLength];

        // Light background tint alternate row zebra effect
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(12, currentY - 4.2, 186, 5.8, 'F');
        }

        if (itemL) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 65, 85);
          doc.text(itemL[0], 16, currentY);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(37, 99, 235); // Blue
          doc.text(`${itemL[1]} cm`, 78, currentY);
        }

        if (itemR) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 65, 85);
          doc.text(itemR[0], 110, currentY);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(37, 99, 235); // Blue
          doc.text(`${itemR[1]} cm`, 172, currentY);
        }

        currentY += 5.5;
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('No specialized point measurements registered on this garment.', 16, currentY);
    }

  } else {
    // Missing clinical data report card
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(252, 165, 165); // red-300
    doc.setLineWidth(0.3);
    doc.rect(12, currentY, 186, 20, 'DF');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27);
    doc.text('PENDING CLINICAL MEASUREMENT INSTRUCTIONS:', 16, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 29, 29);
    doc.text('A compression garment clinical assessment is not completed for this patient record yet.', 16, currentY + 13);
  }

  // Draw Bottom signature block at the end of A4 template (y near 275)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(12, 272, 198, 272);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('OVERPLAST COMPRESSION FABRICATION LAB | CLINICAL DOSSIER REPRINT', 12, 278);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIDENTIAL INTENDED DESIGN DIRECTIVE ONLY', 122, 278);
  
  const ptName = (patient.full_name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Overplast_Dossier_${ptName}.pdf`);
}
