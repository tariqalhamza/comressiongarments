import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Patient, BodyMeasurement } from '../types';

export const generatePDFReport = (patient: Patient, records: BodyMeasurement[]) => {
  const doc = new jsPDF() as any;

  // Header - Medical Style
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('OVERPLAST Compression Garments Measurements System', 15, 22);
  
  doc.setFontSize(10);
  doc.text('Clinical Measurement & Garment Specification Report', 15, 30);

  // Patient Info Section
  doc.setTextColor(30, 41, 59); // Slate-900
  doc.setFontSize(14);
  doc.text('Patient Identification', 15, 55);
  
  doc.autoTable({
    startY: 60,
    head: [['Field', 'Information']],
    body: [
      ['Full Name', patient.full_name],
      ['Age / Gender', `${patient.age} / ${patient.gender}`],
      ['Diagnosis', patient.diagnosis],
      ['Medical Condition', patient.medical_condition],
      ['Referring Doctor', patient.doctor_name],
    ],
    theme: 'striped',
    headStyles: { fillStyle: '#f1f5f9', textColor: '#64748b', fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  // Measurements Section
  doc.setFontSize(14);
  doc.text('Anatomical Measurements (cm)', 15, doc.lastAutoTable.finalY + 15);

  const measurementBody = records.flatMap(rec => 
    rec.points.map(p => [rec.body_area, rec.side, p.label, `${p.value} cm`])
  );

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Area', 'Side', 'Point', 'Circumference']],
    body: measurementBody.length > 0 ? measurementBody : [['N/A', 'N/A', 'No records found', '-']],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 }
  });

  // Footer & Signatures
  const finalY = doc.lastAutoTable.finalY + 30;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, finalY, 80, finalY);
  doc.line(130, finalY, 195, finalY);
  
  doc.setFontSize(8);
  doc.text('Lead Therapist Signature', 15, finalY + 5);
  doc.text('Patient/Guardian Signature', 130, finalY + 5);

  doc.setTextColor(148, 163, 184);
  doc.text('Generated via OVERPLAST Measurements System | Professional Edition', 105, 285, { align: 'center' });

  doc.save(`Medical_Report_${patient.full_name.replace(' ', '_')}.pdf`);
};
