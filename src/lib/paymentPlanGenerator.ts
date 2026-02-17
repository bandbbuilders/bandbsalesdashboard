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
        doc.text(isCustom ? "Down Payment" : "Down Payment (15%)", margin + 5 + colWidth, cardY);
        setFont('value', 9);
        doc.text(`PKR ${dp.toLocaleString()}`, margin + 5 + colWidth, cardY + 6);

        // Column 3: Installments
        setFont('label', 9);
        doc.text(`Inst. per month (${months})`, margin + 5 + (colWidth * 2), cardY);
        setFont('value', 9);
        doc.text(`PKR ${Math.round(inst).toLocaleString()}`, margin + 5 + (colWidth * 2), cardY + 6);

        // Column 4: Possession
        setFont('label', 9);
        doc.text(isCustom ? "Possession" : "Possession (15%)", margin + 5 + (colWidth * 3), cardY);
        setFont('value', 9);
        doc.text(`PKR ${poss.toLocaleString()}`, margin + 5 + (colWidth * 3), cardY + 6);

        return y + height + 10;
    };


    // --- 1. Logo (Centered) ---
    try {
        // Image aspect ratio (2938x2463) is approx 1.19
        // Using 30mm width, height should be ~25.2mm
        const logoWidth = 30;
        const logoHeight = 25.2;
        doc.addImage('/WHITE LOGO.png', 'PNG', (pageWidth / 2) - (logoWidth / 2), 10, logoWidth, logoHeight);
    } catch (e) {
        console.error("Logo failed", e);
    }

    // --- 2. Title (Centered Red) ---
    let currentY = 45;
    setFont('heading', 22);
    doc.text('Payment Plan Proposal', pageWidth / 2, currentY, { align: 'center' });

    // --- 3. One-line Details ---
    currentY += 15;

    // First calculate total width for centering
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    const labelW = (label: string) => doc.getTextWidth(label);
    const valW = (val: string) => { doc.setFont('helvetica', 'normal'); const w = doc.getTextWidth(val); doc.setFont('helvetica', 'bold'); return w; };

    const clientName = sale.customer.name;
    const unitNum = sale.unit_number || 'TBD';
    const areaVal = `${plan.totalSqf} SQF`;
    const dateVal = format(new Date(), 'dd MMM yyyy');

    const totalLineWidth =
        labelW('Client: ') + valW(clientName) + 10 +
        labelW('Unit: ') + valW(unitNum) + 10 +
        labelW('Area: ') + valW(areaVal) + 10 +
        labelW('Date: ') + valW(dateVal);

    let runningX = (pageWidth - totalLineWidth) / 2;

    // Draw Client
    doc.setFont('helvetica', 'bold'); doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text('Client:', runningX, currentY); runningX += labelW('Client: ') + 1;
    doc.setFont('helvetica', 'normal'); doc.text(clientName, runningX, currentY); runningX += valW(clientName) + 5;
    doc.text('|', runningX, currentY); runningX += 5;

    // Draw Unit
    doc.setFont('helvetica', 'bold'); doc.text('Unit:', runningX, currentY); runningX += labelW('Unit: ') + 1;
    doc.setFont('helvetica', 'normal'); doc.text(unitNum, runningX, currentY); runningX += valW(unitNum) + 5;
    doc.text('|', runningX, currentY); runningX += 5;

    // Draw Area
    doc.setFont('helvetica', 'bold'); doc.text('Area:', runningX, currentY); runningX += labelW('Area: ') + 1;
    doc.setFont('helvetica', 'normal'); doc.text(areaVal, runningX, currentY); runningX += valW(areaVal) + 5;
    doc.text('|', runningX, currentY); runningX += 5;

    // Draw Date
    doc.setFont('helvetica', 'bold'); doc.text('Date:', runningX, currentY); runningX += labelW('Date: ') + 1;
    doc.setFont('helvetica', 'normal'); doc.text(dateVal, runningX, currentY);

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
    currentY = drawPricingCard(
        currentY,
        "Custom Payment Plan",
        plan.totalAmount,
        plan.ratePerSqf,
        plan.downPayment + plan.bookingAmount,
        plan.monthlyInstallment,
        plan.installmentMonths,
        plan.possessionAmount,
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
