import jsPDF from 'jspdf';
import type { LoanScenario, LoanType } from '../types';
import { LOAN_TYPE_INFO } from '../types';
import type { PDFOptions } from '../components/PDFOptionsModal';

// Logo URL
const LOGO_URL = 'https://lirp.cdn-website.com/e49062f7/dms3rep/multi/opt/Luminatebank_PrimaryLogo_Color-1920w.jpg';

/**
 * Load an image from URL and convert to base64
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

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
  blue: { r: 59, g: 130, b: 246 },          // blue-500
  // Pie chart colors
  pi: { r: 59, g: 130, b: 246 },            // blue-500 - Principal & Interest
  mi: { r: 245, g: 158, b: 11 },            // amber-500 - Mortgage Insurance
  taxes: { r: 16, g: 185, b: 129 },         // emerald-500 - Property Taxes
  insurance: { r: 139, g: 92, b: 246 },     // violet-500 - Home Insurance
  hoa: { r: 236, g: 72, b: 153 },           // pink-500 - HOA
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

function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(2) + 'M';
  }
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Draw a pie chart segment
 */
function drawPieSegment(
  pdf: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: { r: number; g: number; b: number }
): void {
  pdf.setFillColor(color.r, color.g, color.b);

  // Draw pie segment using lines (jsPDF doesn't have native arc fill)
  const steps = 30;
  const angleStep = (endAngle - startAngle) / steps;

  // Create path points
  const points: { x: number; y: number }[] = [{ x: cx, y: cy }];

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * angleStep;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  // Draw filled polygon
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);

  // Use triangle fan approach
  for (let i = 1; i < points.length - 1; i++) {
    pdf.triangle(
      points[0].x, points[0].y,
      points[i].x, points[i].y,
      points[i + 1].x, points[i + 1].y,
      'F'
    );
  }
}

/**
 * Generate a styled PDF that matches the page layout
 */
export async function generatePDF(
  _elementId: string,
  scenario: LoanScenario,
  filename?: string,
  options?: PDFOptions
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const { inputs, calculations } = scenario;

  // Load logo image
  const logoBase64 = await loadImageAsBase64(LOGO_URL);

  // Find lowest monthly payment
  const lowestCalc = calculations.reduce((min, calc) =>
    calc.totalMonthly < min.totalMonthly ? calc : min, calculations[0]);

  // ===== HEADER WITH LOGO AND CLIENT/LO INFO =====
  let yPos = 12;

  // Add logo if loaded
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'JPEG', margin, yPos - 4, 40, 12);
    } catch {
      // Logo failed to load, continue without it
    }
  }

    // If we have LO info, show it in top right
    if (options?.loName || options?.loCompany) {
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);

      let loY = 12;
      if (options.loCompany) {
        pdf.setFontSize(9);
        pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        pdf.text(options.loCompany, pageWidth - margin, loY, { align: 'right' });
        loY += 4;
      }
      if (options.loName) {
        pdf.setFontSize(8);
        pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
        pdf.text(`${options.loName}${options.loTitle ? ', ' + options.loTitle : ''}`, pageWidth - margin, loY, { align: 'right' });
        loY += 4;
      }
      if (options.loPhone) {
        pdf.text(options.loPhone, pageWidth - margin, loY, { align: 'right' });
        loY += 4;
      }
      if (options.loEmail) {
        pdf.text(options.loEmail, pageWidth - margin, loY, { align: 'right' });
        loY += 4;
      }
      if (options.loNMLS) {
        pdf.text(`NMLS# ${options.loNMLS}`, pageWidth - margin, loY, { align: 'right' });
      }
    }

    // Title (left aligned if we have LO info)
    pdf.setFontSize(20);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text('Loan Scenario Comparison', margin, yPos + 6);

    // Client name
    yPos += 14;
    if (options?.clientName) {
      pdf.setFontSize(12);
      pdf.setTextColor(COLORS.blue.r, COLORS.blue.g, COLORS.blue.b);
      pdf.text(`Prepared for: ${options.clientName}`, margin, yPos);
      yPos += 6;
    }

    // Date
    pdf.setFontSize(9);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text(`Generated ${new Date().toLocaleDateString()}`, margin, yPos);

    // ===== LOAN INPUTS BOX =====
    yPos += 8;

    // Background box
    pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 24, 3, 3, 'FD');

    // Input values in a row
    const loanAmount = inputs.homePrice - inputs.downPayment;
    const ltv = ((loanAmount / inputs.homePrice) * 100).toFixed(1);
    const downPercent = ((inputs.downPayment / inputs.homePrice) * 100).toFixed(1);

    const colWidth = (pageWidth - margin * 2) / 5;
    const inputY = yPos + 8;
    const valueY = yPos + 16;

    const inputLabels = [
      { label: 'Home Price', value: formatCurrency(inputs.homePrice) },
      { label: 'Down Payment', value: `${formatCurrency(inputs.downPayment)} (${downPercent}%)` },
      { label: 'Loan Amount', value: formatCurrency(loanAmount) },
      { label: 'LTV', value: `${ltv}%` },
      { label: 'Credit Score', value: inputs.creditScore },
    ];

    inputLabels.forEach((item, i) => {
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text(item.label, margin + colWidth * (i + 0.5), inputY, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(item.value, margin + colWidth * (i + 0.5), valueY, { align: 'center' });
    });

    // ===== COMPARISON CARDS =====
    yPos += 32;

    // Calculate card dimensions based on number of calculations
    const numCards = calculations.length;
    const cardGap = 4;
    const totalGap = (numCards - 1) * cardGap;
    const cardWidth = (pageWidth - margin * 2 - totalGap) / numCards;
    const cardHeight = 155; // Increased height

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
      pdf.roundedRect(cardX, yPos, cardWidth, 14, 2, 2, 'F');
      pdf.rect(cardX, yPos + 8, cardWidth, 6, 'F'); // Cover bottom corners

      // Loan type name
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(info.shortName, cardX + cardWidth / 2, yPos + 9, { align: 'center' });

      // Interest rate
      let cardY = yPos + 22;
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text('Interest Rate', cardX + cardWidth / 2, cardY, { align: 'center' });
      cardY += 5;
      pdf.setFontSize(12);
      pdf.setTextColor(color.r, color.g, color.b);
      pdf.text(`${calc.interestRate.toFixed(3)}%`, cardX + cardWidth / 2, cardY, { align: 'center' });

      // Total Monthly (highlighted)
      cardY += 9;
      if (isLowest) {
        pdf.setFillColor(220, 252, 231); // green-100
        pdf.roundedRect(cardX + 2, cardY - 4, cardWidth - 4, 14, 1, 1, 'F');
      }
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text('Total Monthly', cardX + cardWidth / 2, cardY, { align: 'center' });
      cardY += 5;
      pdf.setFontSize(13);
      if (isLowest) {
        pdf.setTextColor(COLORS.lowest.r, COLORS.lowest.g, COLORS.lowest.b);
      } else {
        pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      }
      pdf.text(formatCurrencyDecimal(calc.totalMonthly), cardX + cardWidth / 2, cardY, { align: 'center' });

      // Divider
      cardY += 7;
      pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
      pdf.line(cardX + 3, cardY, cardX + cardWidth - 3, cardY);

      // Breakdown items
      cardY += 5;
      const items = [
        { label: 'Principal & Interest', value: calc.monthlyPI },
        { label: 'Mortgage Insurance', value: calc.monthlyMI },
        { label: 'Property Taxes', value: calc.monthlyTaxes },
        { label: 'Home Insurance', value: calc.monthlyInsurance },
      ];

      pdf.setFontSize(6.5);
      items.forEach((item) => {
        pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
        pdf.text(item.label, cardX + 3, cardY);
        pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        pdf.text(formatCurrencyDecimal(item.value), cardX + cardWidth - 3, cardY, { align: 'right' });
        cardY += 5;
      });

      // Divider
      cardY += 2;
      pdf.line(cardX + 3, cardY, cardX + cardWidth - 3, cardY);
      cardY += 5;

      // Cash to Close
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text('Cash to Close', cardX + 3, cardY);
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(formatCurrency(calc.cashToClose), cardX + cardWidth - 3, cardY, { align: 'right' });

      // Total Cost
      cardY += 6;
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text('Total Cost', cardX + 3, cardY);
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(formatCurrencyCompact(calc.totalCost), cardX + cardWidth - 3, cardY, { align: 'right' });

      // Lowest badge
      if (isLowest) {
        cardY += 10;
        pdf.setFillColor(COLORS.lowest.r, COLORS.lowest.g, COLORS.lowest.b);
        const badgeWidth = Math.min(32, cardWidth - 8);
        pdf.roundedRect(cardX + (cardWidth - badgeWidth) / 2, cardY - 3, badgeWidth, 8, 2, 2, 'F');
        pdf.setFontSize(6);
        pdf.setTextColor(255, 255, 255);
        pdf.text('LOWEST', cardX + cardWidth / 2, cardY + 2, { align: 'center' });
      }
    });

    // ===== PAGE 2: PAYMENT ANALYSIS CHARTS =====
    pdf.addPage();
    yPos = 20;

    // Section title
    pdf.setFontSize(16);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text('Payment Analysis', margin, yPos);
    yPos += 12;

    // ===== BAR CHART - Monthly Payment Comparison =====
    const barChartX = margin;
    const barChartY = yPos;
    const barChartWidth = (pageWidth - margin * 3) / 2;
    const barChartHeight = 80;

    // Chart background
    pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.roundedRect(barChartX, barChartY, barChartWidth, barChartHeight + 20, 3, 3, 'FD');

    // Chart title
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text('Monthly Payment Comparison', barChartX + barChartWidth / 2, barChartY + 8, { align: 'center' });

    // Find max payment for scale
    const maxPayment = Math.max(...calculations.map(c => c.totalMonthly));
    const minPayment = Math.min(...calculations.map(c => c.totalMonthly));

    // Draw bars
    const barAreaX = barChartX + 15;
    const barAreaY = barChartY + 18;
    const barAreaWidth = barChartWidth - 30;
    const barAreaHeight = barChartHeight - 10;
    const barWidth = barAreaWidth / calculations.length - 8;

    // Y-axis labels
    pdf.setFontSize(6);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text(formatCurrency(maxPayment), barChartX + 12, barAreaY + 2, { align: 'right' });
    pdf.text(formatCurrency(Math.round(maxPayment / 2)), barChartX + 12, barAreaY + barAreaHeight / 2, { align: 'right' });
    pdf.text('$0', barChartX + 12, barAreaY + barAreaHeight, { align: 'right' });

    // Grid lines
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.setLineWidth(0.2);
    pdf.line(barAreaX, barAreaY, barAreaX + barAreaWidth, barAreaY);
    pdf.line(barAreaX, barAreaY + barAreaHeight / 2, barAreaX + barAreaWidth, barAreaY + barAreaHeight / 2);
    pdf.line(barAreaX, barAreaY + barAreaHeight, barAreaX + barAreaWidth, barAreaY + barAreaHeight);

    calculations.forEach((calc, index) => {
      const barX = barAreaX + index * (barWidth + 8) + 4;
      const barHeight = (calc.totalMonthly / maxPayment) * (barAreaHeight - 5);
      const barY = barAreaY + barAreaHeight - barHeight;
      const color = calc.totalMonthly === minPayment ? COLORS.lowest : getColorForLoanType(calc.loanType);

      // Draw bar
      pdf.setFillColor(color.r, color.g, color.b);
      pdf.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');

      // Value on top of bar
      pdf.setFontSize(6);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(formatCurrency(calc.totalMonthly), barX + barWidth / 2, barY - 2, { align: 'center' });

      // Label below
      pdf.setFontSize(6);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      const shortName = LOAN_TYPE_INFO[calc.loanType].shortName.replace(' ', '\n');
      pdf.text(shortName, barX + barWidth / 2, barAreaY + barAreaHeight + 4, { align: 'center' });
    });

    // Legend for lowest
    pdf.setFillColor(COLORS.lowest.r, COLORS.lowest.g, COLORS.lowest.b);
    pdf.rect(barChartX + 8, barChartY + barChartHeight + 12, 4, 4, 'F');
    pdf.setFontSize(6);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('Lowest Monthly Payment', barChartX + 14, barChartY + barChartHeight + 15);

    // ===== PIE CHART - Payment Breakdown for Lowest =====
    const pieChartX = margin + barChartWidth + margin;
    const pieChartY = yPos;
    const pieChartWidth = barChartWidth;
    const pieChartHeight = barChartHeight + 20;

    // Chart background
    pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.roundedRect(pieChartX, pieChartY, pieChartWidth, pieChartHeight, 3, 3, 'FD');

    // Chart title
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(`Payment Breakdown - ${LOAN_TYPE_INFO[lowestCalc.loanType].shortName}`, pieChartX + pieChartWidth / 2, pieChartY + 8, { align: 'center' });

    // Prepare pie data
    const pieData = [
      { label: 'P&I', value: lowestCalc.monthlyPI, color: COLORS.pi },
      { label: 'MI', value: lowestCalc.monthlyMI, color: COLORS.mi },
      { label: 'Taxes', value: lowestCalc.monthlyTaxes, color: COLORS.taxes },
      { label: 'Insurance', value: lowestCalc.monthlyInsurance, color: COLORS.insurance },
      { label: 'HOA', value: lowestCalc.monthlyHOA, color: COLORS.hoa },
    ].filter(item => item.value > 0);

    const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0);
    const pieCenterX = pieChartX + pieChartWidth / 3;
    const pieCenterY = pieChartY + pieChartHeight / 2 + 5;
    const pieRadius = 28;

    // Draw pie segments
    let currentAngle = -Math.PI / 2; // Start from top

    pieData.forEach((item) => {
      const sliceAngle = (item.value / pieTotal) * 2 * Math.PI;
      drawPieSegment(pdf, pieCenterX, pieCenterY, pieRadius, currentAngle, currentAngle + sliceAngle, item.color);
      currentAngle += sliceAngle;
    });

    // Draw white center (donut effect)
    pdf.setFillColor(255, 255, 255);
    pdf.circle(pieCenterX, pieCenterY, pieRadius * 0.5, 'F');

    // Total in center
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(formatCurrency(pieTotal), pieCenterX, pieCenterY - 1, { align: 'center' });
    pdf.setFontSize(5);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('/month', pieCenterX, pieCenterY + 3, { align: 'center' });

    // Legend on the right side of pie
    const legendX = pieChartX + pieChartWidth / 2 + 10;
    let legendY = pieChartY + 20;

    pieData.forEach((item) => {
      const percent = ((item.value / pieTotal) * 100).toFixed(0);

      // Color box
      pdf.setFillColor(item.color.r, item.color.g, item.color.b);
      pdf.rect(legendX, legendY - 2.5, 4, 4, 'F');

      // Label and value
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(item.label, legendX + 6, legendY);

      pdf.setFontSize(6);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text(`${formatCurrency(item.value)} (${percent}%)`, legendX + 6, legendY + 4);

      legendY += 12;
    });

    // ===== FOOTER =====
    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text(
      'This calculator provides estimates only. Actual rates, terms, and costs may vary.',
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
    pdf.text(
      'Contact your loan officer for accurate quotes and eligibility requirements.',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

  // Save the PDF
  const clientSlug = options?.clientName ? options.clientName.replace(/\s+/g, '-').toLowerCase() + '-' : '';
  const pdfFilename = filename || `loan-comparison-${clientSlug}${Date.now()}.pdf`;
  pdf.save(pdfFilename);
}

/**
 * Generate PDF without options (backward compatible)
 */
export function generateSimplePDF(scenario: LoanScenario): Promise<void> {
  return generatePDF('', scenario);
}
