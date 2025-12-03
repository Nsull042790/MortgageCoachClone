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
  // Pie chart colors - matching screenshot
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
  if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'k';
  }
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Draw a pie chart segment (donut style)
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

  const steps = 30;
  const angleStep = (endAngle - startAngle) / steps;
  const points: { x: number; y: number }[] = [{ x: cx, y: cy }];

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * angleStep;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);

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
 * Generate a styled PDF - single page layout matching the app
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
  const margin = 12;
  const { inputs, calculations } = scenario;

  // Load logo image
  const logoBase64 = await loadImageAsBase64(LOGO_URL);

  // Find lowest monthly payment
  const lowestCalc = calculations.reduce((min, calc) =>
    calc.totalMonthly < min.totalMonthly ? calc : min, calculations[0]);

  // ===== HEADER =====
  let yPos = 10;

  // Add logo if loaded
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'JPEG', margin, yPos - 2, 35, 10);
    } catch {
      // Logo failed to load, continue without it
    }
  }

  // LO info in top right
  if (options?.loName || options?.loCompany) {
    let loY = 10;
    if (options.loCompany) {
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(options.loCompany, pageWidth - margin, loY, { align: 'right' });
      loY += 3.5;
    }
    if (options.loName) {
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text(`${options.loName}${options.loTitle ? ', ' + options.loTitle : ''}`, pageWidth - margin, loY, { align: 'right' });
      loY += 3;
    }
    if (options.loPhone) {
      pdf.text(options.loPhone, pageWidth - margin, loY, { align: 'right' });
      loY += 3;
    }
    if (options.loEmail) {
      pdf.text(options.loEmail, pageWidth - margin, loY, { align: 'right' });
    }
  }

  // Title
  yPos += 12;
  pdf.setFontSize(16);
  pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  pdf.text('Loan Scenario Comparison', margin, yPos);

  // Client name and date
  if (options?.clientName) {
    yPos += 5;
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.blue.r, COLORS.blue.g, COLORS.blue.b);
    pdf.text(`Prepared for: ${options.clientName}`, margin, yPos);
  }

  yPos += 4;
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
  pdf.text(`Generated ${new Date().toLocaleDateString()}`, margin, yPos);

  // ===== LOAN INPUTS BOX =====
  yPos += 6;
  const inputBoxHeight = 18;

  pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.roundedRect(margin, yPos, pageWidth - margin * 2, inputBoxHeight, 2, 2, 'FD');

  const loanAmount = inputs.homePrice - inputs.downPayment;
  const ltv = ((loanAmount / inputs.homePrice) * 100).toFixed(1);
  const downPercent = ((inputs.downPayment / inputs.homePrice) * 100).toFixed(1);

  const colWidth = (pageWidth - margin * 2) / 5;
  const inputY = yPos + 6;
  const valueY = yPos + 12;

  const inputLabels = [
    { label: 'Home Price', value: formatCurrency(inputs.homePrice) },
    { label: 'Down Payment', value: `${formatCurrency(inputs.downPayment)} (${downPercent}%)` },
    { label: 'Loan Amount', value: formatCurrency(loanAmount) },
    { label: 'LTV', value: `${ltv}%` },
    { label: 'Credit Score', value: inputs.creditScore },
  ];

  inputLabels.forEach((item, i) => {
    pdf.setFontSize(6);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text(item.label, margin + colWidth * (i + 0.5), inputY, { align: 'center' });
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(item.value, margin + colWidth * (i + 0.5), valueY, { align: 'center' });
  });

  // ===== COMPARISON CARDS (compact) =====
  yPos += inputBoxHeight + 6;

  const numCards = calculations.length;
  const cardGap = 3;
  const totalGap = (numCards - 1) * cardGap;
  const cardWidth = (pageWidth - margin * 2 - totalGap) / numCards;
  const cardHeight = 85; // Compact height

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
    pdf.roundedRect(cardX, yPos, cardWidth, 10, 2, 2, 'F');
    pdf.rect(cardX, yPos + 6, cardWidth, 4, 'F');

    // Loan type name
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(info.shortName, cardX + cardWidth / 2, yPos + 7, { align: 'center' });

    // Interest rate
    let cardY = yPos + 16;
    pdf.setFontSize(6);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('Interest Rate', cardX + cardWidth / 2, cardY, { align: 'center' });
    cardY += 4;
    pdf.setFontSize(10);
    pdf.setTextColor(color.r, color.g, color.b);
    pdf.text(`${calc.interestRate.toFixed(3)}%`, cardX + cardWidth / 2, cardY, { align: 'center' });

    // Total Monthly
    cardY += 6;
    if (isLowest) {
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(cardX + 2, cardY - 3, cardWidth - 4, 10, 1, 1, 'F');
    }
    pdf.setFontSize(6);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('Total Monthly', cardX + cardWidth / 2, cardY, { align: 'center' });
    cardY += 4;
    pdf.setFontSize(11);
    pdf.setTextColor(isLowest ? COLORS.lowest.r : COLORS.text.r, isLowest ? COLORS.lowest.g : COLORS.text.g, isLowest ? COLORS.lowest.b : COLORS.text.b);
    pdf.text(formatCurrencyDecimal(calc.totalMonthly), cardX + cardWidth / 2, cardY, { align: 'center' });

    // Divider
    cardY += 5;
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.line(cardX + 2, cardY, cardX + cardWidth - 2, cardY);

    // Breakdown (compact)
    cardY += 4;
    pdf.setFontSize(5.5);
    const items = [
      { label: 'P&I', value: calc.monthlyPI },
      { label: 'MI', value: calc.monthlyMI },
      { label: 'Taxes', value: calc.monthlyTaxes },
      { label: 'Insurance', value: calc.monthlyInsurance },
    ];

    items.forEach((item) => {
      pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
      pdf.text(item.label, cardX + 2, cardY);
      pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      pdf.text(formatCurrency(item.value), cardX + cardWidth - 2, cardY, { align: 'right' });
      cardY += 3.5;
    });

    // Cash to Close
    cardY += 1;
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    pdf.text('Cash to Close', cardX + 2, cardY);
    pdf.setFontSize(6);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(formatCurrency(calc.cashToClose), cardX + cardWidth - 2, cardY, { align: 'right' });

    // Lowest badge
    if (isLowest) {
      cardY += 5;
      pdf.setFillColor(COLORS.lowest.r, COLORS.lowest.g, COLORS.lowest.b);
      const badgeWidth = Math.min(24, cardWidth - 6);
      pdf.roundedRect(cardX + (cardWidth - badgeWidth) / 2, cardY - 2, badgeWidth, 6, 1, 1, 'F');
      pdf.setFontSize(5);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LOWEST', cardX + cardWidth / 2, cardY + 2, { align: 'center' });
    }
  });

  // ===== PAYMENT ANALYSIS SECTION =====
  yPos += cardHeight + 8;

  // Section container
  const chartSectionHeight = 75;
  pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.roundedRect(margin, yPos, pageWidth - margin * 2, chartSectionHeight, 3, 3, 'FD');

  // Section title
  pdf.setFontSize(11);
  pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  pdf.text('Payment Analysis', margin + 6, yPos + 8);

  const chartAreaY = yPos + 14;
  const chartAreaHeight = chartSectionHeight - 18;
  const halfWidth = (pageWidth - margin * 2) / 2;

  // ===== BAR CHART =====
  const barChartX = margin + 6;

  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  pdf.text('Monthly Payment Comparison', barChartX, chartAreaY);

  const maxPayment = Math.max(...calculations.map(c => c.totalMonthly));
  const minPayment = Math.min(...calculations.map(c => c.totalMonthly));

  const barAreaX = barChartX + 12;
  const barAreaY = chartAreaY + 6;
  const barAreaWidth = halfWidth - 30;
  const barAreaHeight = chartAreaHeight - 16;
  const barWidth = Math.min(18, (barAreaWidth / calculations.length) - 4);

  // Y-axis labels
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
  pdf.text(formatCurrencyCompact(maxPayment), barChartX + 10, barAreaY + 2, { align: 'right' });
  pdf.text(formatCurrencyCompact(maxPayment / 2), barChartX + 10, barAreaY + barAreaHeight / 2, { align: 'right' });
  pdf.text('$0.0k', barChartX + 10, barAreaY + barAreaHeight, { align: 'right' });

  // Grid lines (dashed style)
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.setLineWidth(0.1);
  pdf.setLineDashPattern([1, 1], 0);
  pdf.line(barAreaX, barAreaY, barAreaX + barAreaWidth, barAreaY);
  pdf.line(barAreaX, barAreaY + barAreaHeight / 2, barAreaX + barAreaWidth, barAreaY + barAreaHeight / 2);
  pdf.line(barAreaX, barAreaY + barAreaHeight, barAreaX + barAreaWidth, barAreaY + barAreaHeight);
  pdf.setLineDashPattern([], 0);

  // Draw bars
  calculations.forEach((calc, index) => {
    const barX = barAreaX + index * (barWidth + 4) + 2;
    const barHeight = (calc.totalMonthly / maxPayment) * (barAreaHeight - 4);
    const barY = barAreaY + barAreaHeight - barHeight;
    const color = calc.totalMonthly === minPayment ? COLORS.lowest : getColorForLoanType(calc.loanType);

    pdf.setFillColor(color.r, color.g, color.b);
    pdf.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');

    // Label below
    pdf.setFontSize(5);
    pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
    const shortName = LOAN_TYPE_INFO[calc.loanType].shortName;
    pdf.text(shortName, barX + barWidth / 2, barAreaY + barAreaHeight + 4, { align: 'center' });
  });

  // Legend
  pdf.setFillColor(COLORS.lowest.r, COLORS.lowest.g, COLORS.lowest.b);
  pdf.circle(barChartX + 4, yPos + chartSectionHeight - 6, 1.5, 'F');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
  pdf.text('Lowest monthly payment', barChartX + 8, yPos + chartSectionHeight - 5);

  // ===== PIE CHART =====
  const pieChartX = margin + halfWidth + 6;

  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  pdf.text('Payment Breakdown', pieChartX, chartAreaY);

  // Loan type indicator (like dropdown in screenshot)
  const dropdownX = pageWidth - margin - 25;
  pdf.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.roundedRect(dropdownX, chartAreaY - 4, 22, 6, 1, 1, 'FD');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  pdf.text(LOAN_TYPE_INFO[lowestCalc.loanType].shortName, dropdownX + 11, chartAreaY - 0.5, { align: 'center' });

  // Prepare pie data
  const pieData = [
    { label: 'Home Insurance', value: lowestCalc.monthlyInsurance, color: COLORS.insurance },
    { label: 'Mortgage Insurance', value: lowestCalc.monthlyMI, color: COLORS.mi },
    { label: 'Principal & Interest', value: lowestCalc.monthlyPI, color: COLORS.pi },
    { label: 'Property Taxes', value: lowestCalc.monthlyTaxes, color: COLORS.taxes },
  ].filter(item => item.value > 0);

  const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0);
  const pieCenterX = pieChartX + 22;
  const pieCenterY = chartAreaY + chartAreaHeight / 2 + 2;
  const pieRadius = 18;

  // Draw pie segments
  let currentAngle = -Math.PI / 2;
  pieData.forEach((item) => {
    const sliceAngle = (item.value / pieTotal) * 2 * Math.PI;
    drawPieSegment(pdf, pieCenterX, pieCenterY, pieRadius, currentAngle, currentAngle + sliceAngle, item.color);
    currentAngle += sliceAngle;
  });

  // Donut hole
  pdf.setFillColor(255, 255, 255);
  pdf.circle(pieCenterX, pieCenterY, pieRadius * 0.55, 'F');

  // Legend on right side
  const legendX = pieChartX + 48;
  let legendY = chartAreaY + 8;

  pieData.forEach((item) => {
    pdf.setFillColor(item.color.r, item.color.g, item.color.b);
    pdf.circle(legendX, legendY, 1.5, 'F');

    pdf.setFontSize(6);
    pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    pdf.text(`${item.label}: ${formatCurrency(item.value)}`, legendX + 4, legendY + 1);
    legendY += 6;
  });

  // Total in center area
  const totalY = pieCenterY + pieRadius + 8;
  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  pdf.text(formatCurrency(pieTotal), pieCenterX, totalY, { align: 'center' });
  pdf.setFontSize(6);
  pdf.text('/mo', pieCenterX + 14, totalY);

  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
  pdf.text(LOAN_TYPE_INFO[lowestCalc.loanType].name, pieCenterX, totalY + 4, { align: 'center' });

  // ===== FOOTER =====
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.textLight.r, COLORS.textLight.g, COLORS.textLight.b);
  pdf.text(
    'This calculator provides estimates only. Actual rates, terms, and costs may vary. Contact your loan officer for accurate quotes.',
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
