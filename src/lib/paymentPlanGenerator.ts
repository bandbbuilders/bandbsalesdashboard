import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Sale } from '../types';

interface PaymentPlanParams {
    totalAmount: number;
    downPayment: number;
    downPaymentDate: Date;
    monthlyInstallment: number;
    installmentMonths: number;
    installmentStartDate: Date;
    possessionAmount: number;
    possessionDate: Date;
    discount: number;
    bookingAmount: number;
    bookingDate: Date;
    totalSqf: number;
    ratePerSqf: number;
    standardRate?: number;
    showDetailedSchedule?: boolean;
    preparedBy?: string;
}

export const generatePaymentPlanPDF = async (sale: Sale, plan: PaymentPlanParams) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Colors - Matching the reference
    const colors = {
        primary: [180, 2, 2], // #B40202 (B&B Red)
        standardBg: [255, 255, 255],
        customBg: [255, 241, 241], // Faint pink for custom sections
        text: [0, 0, 0],
        textMuted: [100, 100, 100],
        border: [230, 230, 230]
    };

    // Typography Helper
    const setFont = (type: 'heading' | 'label' | 'value' | 'disclaimer', size: number = 10) => {
        if (type === 'heading') {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        } else if (type === 'label') {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        } else if (type === 'disclaimer') {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        }
        doc.setFontSize(size);
    };

    // Helper: Draw Card with grid content
    const drawPricingCard = (y: number, title: string, amount: number, rate: number, dp: number, inst: number, months: number, poss: number, isCustom: boolean) => {
        const height = 45;
        const bgColor = isCustom ? colors.customBg : colors.standardBg;
        const borderColor = colors.border;

        // Card Border and Background
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.roundedRect(margin, y, contentWidth, height, 3, 3, 'FD');

        // Header Row
        let cardY = y + 8;
        setFont('label', 11);
        if (isCustom) doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(title, margin + 5, cardY);

        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]); // reset to black for amount
        doc.text(`PKR ${amount.toLocaleString()}`, pageWidth - margin - 5, cardY, { align: 'right' });

        // Divider
        cardY += 4;
        doc.setDrawColor(240, 240, 240);
        doc.line(margin + 2, cardY, pageWidth - margin - 2, cardY);

        // Content Grid
        cardY += 10;
        const colWidth = contentWidth / 4;

        // Column 1: Rate
        setFont('label', 9);
        doc.text(isCustom ? "Custom Rate" : "Standard Rate", margin + 5, cardY);
        setFont('value', 9);
        doc.text(`PKR ${rate.toLocaleString()}/sqft`, margin + 5, cardY + 6);

        // Column 2: Down Payment
        setFont('label', 9);
        doc.text("Down Payment (15%)", margin + 5 + colWidth, cardY);
        setFont('value', 9);
        doc.text(`PKR ${dp.toLocaleString()}`, margin + 5 + colWidth, cardY + 6);

        // Column 3: Installments
        setFont('label', 9);
        doc.text(`Inst. per month (${months})`, margin + 5 + (colWidth * 2), cardY);
        setFont('value', 9);
        doc.text(`PKR ${Math.round(inst).toLocaleString()}`, margin + 5 + (colWidth * 2), cardY + 6);

        // Column 4: Possession
        setFont('label', 9);
        doc.text("Possession (15%)", margin + 5 + (colWidth * 3), cardY);
        setFont('value', 9);
        doc.text(`PKR ${poss.toLocaleString()}`, margin + 5 + (colWidth * 3), cardY + 6);

        return y + height + 10;
    };

    // --- 1. Logo (Centered) ---
    try {
        // Logo size: 40x25? Reference looks vertically taller than previous 40x10
        doc.addImage('/WHITE LOGO.png', 'PNG', (pageWidth / 2) - 20, 10, 40, 25);
    } catch (e) {
        console.error("Logo failed", e);
    }

    // --- 2. Title (Centered Red) ---
    let currentY = 45;
    setFont('heading', 22);
    doc.text('Payment Plan Proposal', pageWidth / 2, currentY, { align: 'center' });

    // --- 3. One-line Details ---
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

    // Constructing centered text with bold labels
    const clientX = margin + 10;
    doc.text('Client:', clientX, currentY);
    doc.setFont('helvetica', 'normal');
    const clientValX = clientX + doc.getTextWidth('Client: ') + 2;
    doc.text(sale.customer.name, clientValX, currentY);

    const divider1X = clientValX + doc.getTextWidth(sale.customer.name) + 5;
    doc.text('|', divider1X, currentY);

    const unitX = divider1X + 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Unit:', unitX, currentY);
    doc.setFont('helvetica', 'normal');
    const unitValX = unitX + doc.getTextWidth('Unit: ') + 2;
    doc.text(sale.unit_number || 'TBD', unitValX, currentY);

    const divider2X = unitValX + doc.getTextWidth(sale.unit_number || 'TBD') + 5;
    doc.text('|', divider2X, currentY);

    const areaX = divider2X + 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Area:', areaX, currentY);
    doc.setFont('helvetica', 'normal');
    const areaValX = areaX + doc.getTextWidth('Area: ') + 2;
    doc.text(`${plan.totalSqf} SQF`, areaValX, currentY);

    const divider3X = areaValX + doc.getTextWidth(`${plan.totalSqf} SQF`) + 5;
    doc.text('|', divider3X, currentY);

    const dateX = divider3X + 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', dateX, currentY);
    doc.setFont('helvetica', 'normal');
    const dateValX = dateX + doc.getTextWidth('Date: ') + 2;
    doc.text(format(new Date(), 'dd MMM yyyy'), dateValX, currentY);

    // Centering the whole line
    const totalLineWidth = dateValX + doc.getTextWidth(format(new Date(), 'dd MMM yyyy')) - clientX;
    const startShift = (pageWidth - totalLineWidth) / 2 - clientX;
    // We can't easily "shift" drawn text, but the above was for planning.
    // Let's just use a simpler approach: one centered string with different parts is hard in jsPDF.
    // Approach: Single string for now, it's easier to center accurately.
    currentY += 0; // use same Y but re-render
    doc.clearRect(0, currentY - 10, pageWidth, 20); // clean previous attempts

    const fullLine = `Client: ${sale.customer.name}  |  Unit: ${sale.unit_number || 'TBD'}  |  Area: ${plan.totalSqf} SQF  |  Date: ${format(new Date(), 'dd MMM yyyy')}`;
    // Harder to bold parts, so let's stick to the manual layout above but with correct centering math.
    const startX = (pageWidth - totalLineWidth) / 2;

    // Re-draw with startX
    let runningX = startX;
    doc.setFont('helvetica', 'bold'); doc.text('Client:', runningX, currentY); runningX += doc.getTextWidth('Client: ') + 1;
    doc.setFont('helvetica', 'normal'); doc.text(sale.customer.name, runningX, currentY); runningX += doc.getTextWidth(sale.customer.name) + 4;
    doc.text('|', runningX, currentY); runningX += 4;
    doc.setFont('helvetica', 'bold'); doc.text('Unit:', runningX, currentY); runningX += doc.getTextWidth('Unit: ') + 1;
    doc.setFont('helvetica', 'normal'); doc.text(sale.unit_number || 'TBD', runningX, currentY); runningX += doc.getTextWidth(sale.unit_number || 'TBD') + 4;
    doc.text('|', runningX, currentY); runningX += 4;
    doc.setFont('helvetica', 'bold'); doc.text('Area:', runningX, currentY); runningX += doc.getTextWidth('Area: ') + 1;
    doc.setFont('helvetica', 'normal'); doc.text(`${plan.totalSqf} SQF`, runningX, currentY); runningX += doc.getTextWidth(`${plan.totalSqf} SQF`) + 4;
    doc.text('|', runningX, currentY); runningX += 4;
    doc.setFont('helvetica', 'bold'); doc.text('Date:', runningX, currentY); runningX += doc.getTextWidth('Date: ') + 1;
    doc.setFont('helvetica', 'normal'); doc.text(format(new Date(), 'dd MMM yyyy'), runningX, currentY);

    // --- 4. Standard Pricing Card ---
    currentY += 15;
    if (plan.standardRate && plan.standardRate > 0) {
        const standardTotal = plan.standardRate * plan.totalSqf;
        const standardInst = (standardTotal * 0.70) / plan.installmentMonths;
        currentY = drawPricingCard(
            currentY,
            "Standard Pricing",
            standardTotal,
            plan.standardRate,
            standardTotal * 0.15,
            standardInst,
            plan.installmentMonths,
            standardTotal * 0.15,
            false
        );
    }

    // --- 5. Total Savings / Discount ---
    if (plan.discount > 0) {
        doc.setFillColor(colors.customBg[0], colors.customBg[1], colors.customBg[2]);
        doc.roundedRect(margin, currentY, contentWidth, 30, 3, 3, 'F');

        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL SAVINGS / DISCOUNT', pageWidth / 2, currentY + 10, { align: 'center' });

        doc.setFontSize(18);
        doc.text(`PKR ${plan.discount.toLocaleString()}`, pageWidth / 2, currentY + 22, { align: 'center' });

        currentY += 40;
    }

    // --- 6. Custom Payment Plan Card ---
    const customInst = plan.monthlyInstallment;
    currentY = drawPricingCard(
        currentY,
        "Custom Payment Plan",
        plan.totalAmount,
        plan.ratePerSqf,
        plan.totalAmount * 0.15,
        customInst,
        plan.installmentMonths,
        plan.totalAmount * 0.15,
        true
    );

    // --- 7. Total Payable ---
    currentY += 2;
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Total Payable: PKR ${plan.totalAmount.toLocaleString()}`, pageWidth - margin, currentY, { align: 'right' });

    // --- 8. Disclaimer ---
    const disclaimer = "Please note, this is a provisional plan; once you confirm, it will be forwarded for formal approval and final confirmation.";
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(disclaimer, pageWidth / 2, pageHeight - 15, { align: 'center' });

    doc.save(`Payment_Plan_${sale.customer.name.replace(/\s+/g, '_')}.pdf`);
};
