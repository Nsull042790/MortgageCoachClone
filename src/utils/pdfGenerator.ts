import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { LoanScenario, LoanType } from '../types';
import { LOAN_TYPE_INFO } from '../types';

// Color definitions matching the app
const COLORS = {
  conventional: { r: 59, g: 130, b: 246 },  // blue-500
  fha: { r: 34, g: 197, b: 94 },            // green-500
  va: { r: 239, g: 68, b: 68 },             // red-500
  usda: { r: 107, g: 114, b: 128 },         // gray-500
  text: { r: 31, g: 41, b: 55 },            // gray-800
  textLight: { r: 107, g: 114, b: 128 },    // gray-500
  border: { r: 229, g: 231, b: 235 },       // gray-200
  background: { r: 249, g: 250, b: 251 },   // gray-50
  white: { r: 255, g: 255, b: 255 },
  lowest: { r: 34, g: 197, b: 94 },         // green-500
};

function getColorForLoanType(loanType: LoanType): { r: number; g: number; b: number } {
  if (loanType.startsWith('conventional')) return COLORS.conventional;
  if (loanType === 'fha30') return COLORS.fha;
  if (loanType === 'va30') return COLORS.va;
  if (loanType === 'usda30') return COLORS.usda;
  return COLORS.conventional;
}

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatCurrencyDecimal(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generate a styled PDF that matches the page layout
 */
export function generatePDF(
  _elementId: string,
  scenario: LoanScenario,
  filename?: string
): Promise<void> {
  return new Promise((resolve) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const { inputs, calculations } = scenario;

    // Find lowest monthly payment
    const lowestCalc = calculations.reduce((min, calc) =>
      calc.totalMonthly < min.totalMonthly ? calc : min, calculations[0]);

    // ===== HEADER =====
    pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Title
    pdf.setFontSize(22);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text('Loan Scenario Comparison', pageWidth / 2, 18, { align: 'center' });

    // Subtitle
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('Compare loan products side-by-side', pageWidth / 2, 26, { align: 'center' });

    // Scenario name and date
    pdf.setFontSize(9);
    pdf.text(`${scenario.name} • Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });

    // ===== LOAN INPUTS BOX =====
    let yPos = 45;

    // Background box
    pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 3, 3, 'FD');

    // Input values in a row
    const loanAmount = inputs.homePrice - inputs.downPayment;
    const ltv = ((loanAmount / inputs.homePrice) * 100).toFixed(1);
    const downPercent = ((inputs.downPayment / inputs.homePrice) * 100).toFixed(1);

    const colWidth = (pageWidth - margin * 2) / 5;
    const inputY = yPos + 10;
    const valueY = yPos + 19;

    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);

    // Home Price
    pdf.text('Home Price', margin + colWidth * 0.5, inputY, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(formatCurrency(inputs.homePrice), margin + colWidth * 0.5, valueY, { align: 'center' });

    // Down Payment
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('Down Payment', margin + colWidth * 1.5, inputY, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(`${formatCurrency(inputs.downPayment)} (${downPercent}%)`, margin + colWidth * 1.5, valueY, { align: 'center' });

    // Loan Amount
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('Loan Amount', margin + colWidth * 2.5, inputY, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(formatCurrency(loanAmount), margin + colWidth * 2.5, valueY, { align: 'center' });

    // LTV
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('LTV', margin + colWidth * 3.5, inputY, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(`${ltv}%`, margin + colWidth * 3.5, valueY, { align: 'center' });

    // Credit Score
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('Credit Score', margin + colWidth * 4.5, inputY, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(inputs.creditScore, margin + colWidth * 4.5, valueY, { align: 'center' });

    // ===== COMPARISON CARDS =====
    yPos = 80;

    // Calculate card dimensions based on number of calculations
    const numCards = calculations.length;
    const cardGap = 4;
    const totalGap = (numCards - 1) * cardGap;
    const cardWidth = (pageWidth - margin * 2 - totalGap) / numCards;
    const cardHeight = 140;

    calculations.forEach((calc, index) => {
      const cardX = margin + index * (cardWidth + cardGap);
      const color = getColorForLoanType(calc.loanType);
      const isLowest = calc.loanType === lowestCalc.loanType;
      const info = LOAN_TYPE_INFO[calc.loanType];

      // Card background
      pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
      pdf.roundedRect(cardX, yPos, cardWidth, cardHeight, 2, 2, 'FD');

      // Colored header
      pdf.setFillColor(color.r, color.g, color.b);
      pdf.roundedRect(cardX, yPos, cardWidth, 16, 2, 2, 'F');
      pdf.rect(cardX, yPos + 10, cardWidth, 6, 'F'); // Cover bottom corners

      // Loan type name
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(info.shortName, cardX + cardWidth / 2, yPos + 10, { align: 'center' });

      // Interest rate
      let cardY = yPos + 24;
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text('Interest Rate', cardX + cardWidth / 2, cardY, { align: 'center' });
      cardY += 6;
      pdf.setFontSize(12);
      pdf.setTextColor(color.r, color.g, color.b);
      pdf.text(`${calc.interestRate.toFixed(3)}%`, cardX + cardWidth / 2, cardY, { align: 'center' });

      // Total Monthly (highlighted)
      cardY += 10;
      if (isLowest) {
        pdf.setFillColor(220, 252, 231); // green-100
        pdf.roundedRect(cardX + 2, cardY - 4, cardWidth - 4, 16, 1, 1, 'F');
      }
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text('Total Monthly', cardX + cardWidth / 2, cardY, { align: 'center' });
      cardY += 6;
      pdf.setFontSize(14);
      if (isLowest) {
        pdf.setTextColor(COLORS.lowest.r, COLORS.lowest.g, COLORS.lowest.b);
      } else {
        pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      }
      pdf.text(formatCurrencyDecimal(calc.totalMonthly), cardX + cardWidth / 2, cardY, { align: 'center' });

      // Divider
      cardY += 8;
      pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
      pdf.line(cardX + 4, cardY, cardX + cardWidth - 4, cardY);

      // Breakdown items
      cardY += 6;
      const items = [
        { label: 'Principal & Interest', value: calc.monthlyPI },
        { label: 'Mortgage Insurance', value: calc.monthlyMI },
        { label: 'Property Taxes', value: calc.monthlyTaxes },
        { label: 'Home Insurance', value: calc.monthlyInsurance },
      ];

      pdf.setFontSize(7);
      items.forEach((item) => {
        pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
        pdf.text(item.label, cardX + 4, cardY);
        pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        pdf.text(formatCurrencyDecimal(item.value), cardX + cardWidth - 4, cardY, { align: 'right' });
        cardY += 5;
      });

      // Divider
      cardY += 2;
      pdf.line(cardX + 4, cardY, cardX + cardWidth - 4, cardY);
      cardY += 6;

      // Cash to Close
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text('Cash to Close', cardX + 4, cardY);
      pdf.setFontSize(9);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(formatCurrency(calc.cashToClose), cardX + cardWidth - 4, cardY, { align: 'right' });

      // Total Cost
      cardY += 7;
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text('Total Cost (Life of Loan)', cardX + 4, cardY);
      pdf.setFontSize(9);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(formatCurrency(calc.totalCost), cardX + cardWidth - 4, cardY, { align: 'right' });

      // Lowest badge
      if (isLowest) {
        cardY += 8;
        pdf.setFillColor(COLORS.lowest.r, COLORS.lowest.g, COLORS.lowest.b);
        const badgeWidth = 32;
        pdf.roundedRect(cardX + (cardWidth - badgeWidth) / 2, cardY - 3, badgeWidth, 8, 2, 2, 'F');
        pdf.setFontSize(6);
        pdf.setTextColor(255, 255, 255);
        pdf.text('LOWEST', cardX + cardWidth / 2, cardY + 2, { align: 'center' });
      }
    });

    // ===== FOOTER =====
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text(
      'This calculator provides estimates only. Actual rates, terms, and costs may vary.',
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    );
    pdf.text(
      'Contact your loan officer for accurate quotes and eligibility requirements.',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Save the PDF
    const pdfFilename = filename || `loan-comparison-${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    pdf.save(pdfFilename);
    resolve();
  });
}

/**
 * Generate PDF using html2canvas as fallback
 */
export async function generateSimplePDF(scenario: LoanScenario): Promise<void> {
  const element = document.getElementById('pdf-content');
  if (!element) {
    // Fall back to styled PDF if element not found
    return generatePDF('', scenario);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f3f4f6',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    let position = 0;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = `loan-comparison-${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Canvas PDF failed:', error);
    // Fall back to styled PDF
    return generatePDF('', scenario);
  }
}
