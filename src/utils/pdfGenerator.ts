import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { LoanScenario } from '../types';

/**
 * Generate PDF from the comparison component
 */
export async function generatePDF(
  elementId: string,
  scenario: LoanScenario,
  filename?: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF generation');
    return;
  }

  try {
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    // Add title
    pdf.setFontSize(18);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Loan Scenario Comparison', 105, 15, { align: 'center' });

    // Add scenario name and date
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Scenario: ${scenario.name}`, 14, 25);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Calculate position and handle multi-page if needed
    let position = 35;
    let heightLeft = imgHeight;

    // Add first page image
    const maxHeightFirstPage = pageHeight - position - 10;
    if (imgHeight <= maxHeightFirstPage) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    } else {
      // Multi-page handling
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= maxHeightFirstPage;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    // Add footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(
        'This is an estimate only. Actual rates and terms may vary. Contact your loan officer for details.',
        105,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text(`Page ${i} of ${pageCount}`, 195, pageHeight - 10, { align: 'right' });
    }

    // Save the PDF
    const pdfFilename = filename || `loan-comparison-${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    pdf.save(pdfFilename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate a simple text-based PDF without canvas
 */
export function generateSimplePDF(scenario: LoanScenario): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const { inputs, calculations } = scenario;

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Loan Scenario Comparison', 105, 20, { align: 'center' });

  // Scenario info
  pdf.setFontSize(12);
  pdf.setTextColor(107, 114, 128);
  pdf.text(`Scenario: ${scenario.name}`, 14, 35);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);

  // Loan details header
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Loan Details', 14, 55);

  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  const loanAmount = inputs.homePrice - inputs.downPayment;
  const ltv = ((loanAmount / inputs.homePrice) * 100).toFixed(1);

  pdf.text(`Home Price: $${inputs.homePrice.toLocaleString()}`, 14, 65);
  pdf.text(`Down Payment: $${inputs.downPayment.toLocaleString()}`, 14, 72);
  pdf.text(`Loan Amount: $${loanAmount.toLocaleString()}`, 14, 79);
  pdf.text(`LTV: ${ltv}%`, 14, 86);

  // Comparison table header
  let yPos = 100;
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Loan Comparison', 14, yPos);

  yPos += 10;

  // Table headers
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.text('Loan Type', 14, yPos);
  pdf.text('Rate', 60, yPos);
  pdf.text('Monthly P&I', 85, yPos);
  pdf.text('Total Monthly', 120, yPos);
  pdf.text('Cash to Close', 160, yPos);

  yPos += 5;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(14, yPos, 196, yPos);

  yPos += 7;

  // Table rows
  pdf.setTextColor(31, 41, 55);
  calculations.forEach((calc) => {
    const loanTypeNames: Record<string, string> = {
      conventional30: 'Conv 30yr',
      conventional15: 'Conv 15yr',
      fha30: 'FHA 30yr',
      va30: 'VA 30yr',
      usda30: 'USDA 30yr',
    };

    pdf.text(loanTypeNames[calc.loanType] || calc.loanType, 14, yPos);
    pdf.text(`${calc.interestRate.toFixed(3)}%`, 60, yPos);
    pdf.text(`$${calc.monthlyPI.toFixed(2)}`, 85, yPos);
    pdf.text(`$${calc.totalMonthly.toFixed(2)}`, 120, yPos);
    pdf.text(`$${calc.cashToClose.toLocaleString()}`, 160, yPos);

    yPos += 8;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(156, 163, 175);
  pdf.text(
    'This is an estimate only. Actual rates and terms may vary. Contact your loan officer for details.',
    105,
    285,
    { align: 'center' }
  );

  // Save
  const filename = `loan-comparison-${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  pdf.save(filename);
}
