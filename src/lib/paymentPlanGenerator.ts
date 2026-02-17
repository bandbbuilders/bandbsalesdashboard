import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addMonths } from 'date-fns';
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

    // Colors
    const colors = {
        primary: [180, 2, 2], // #B40202
        primaryBg: [254, 242, 242], // #FEF2F2
        text: [17, 24, 39], // #111827 (Gray-900)
        textMuted: [107, 114, 128], // #6B7280 (Gray-500)
        border: [229, 231, 235], // #E5E7EB (Gray-200)
        bgMuted: [249, 250, 251], // #F9FAFB (Gray-50)
        white: [255, 255, 255]
    };

    // Typography
    const setFont = (type: 'heading' | 'body' | 'label' | 'value', size?: number) => {
        if (type === 'heading') {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.setFontSize(size || 22);
        } else if (type === 'label') {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            doc.setFontSize(size || 10);
        } else if (type === 'value') {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
            doc.setFontSize(size || 10);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            doc.setFontSize(size || 10);
        }
    };

    // Helper: Draw Card
    const drawCard = (y: number, height: number, bgColor: number[] | null = null, borderColor: number[] = colors.border) => {
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        if (bgColor) {
            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.roundedRect(margin, y, contentWidth, height, 3, 3, 'FD');
        } else {
            doc.roundedRect(margin, y, contentWidth, height, 3, 3, 'S');
        }
    };

    // Helper: Detail Field
    const drawField = (label: string, value: string, x: number, y: number) => {
        setFont('label');
        doc.text(label, x, y);
        setFont('value');
        doc.text(value, x, y + 6);
    };



    // --- Header & Title Section ---
    let currentY = 20;

    // Add Logo in top right
    try {
        // Since we moved it to public, it's served at /WHITE LOGO.png
        doc.addImage('/WHITE LOGO.png', 'PNG', pageWidth - margin - 40, 10, 40, 15);
    } catch (e) {
        console.error("Logo not found", e);
    }

    setFont('heading');
    doc.text('Payment Plan Proposal', margin, currentY);

    // New Introduction Text
    currentY += 10;
    setFont('body', 10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const introText = "This tailored payment structure has been thoughtfully designed around your specific requirements to give you maximum flexibility and ease.";
    const introText2 = "Please note, this is a provisional plan; once you confirm, it will be forwarded for formal approval and final confirmation.";

    const splitIntro = doc.splitTextToSize(introText, contentWidth);
    doc.text(splitIntro, margin, currentY);
    currentY += (splitIntro.length * 5) + 2;

    const splitIntro2 = doc.splitTextToSize(introText2, contentWidth);
    doc.text(splitIntro2, margin, currentY);
    currentY += (splitIntro2.length * 5) + 10;

    // --- One-line Header Details ---
    const headerLine = `Client: ${sale.customer.name}  |  Unit: ${sale.unit_number}  |  Area: ${plan.totalSqf} SQF  |  Date: ${format(new Date(), 'dd MMM yyyy')}`;
    setFont('label', 10);
    doc.text(headerLine, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Helper: Pricing Breakdown Section (Updated for per-month installment)
    const drawPricingSection = (y: number, title: string, rate: number, total: number, isCustom: boolean) => {
        const height = 45;
        const bgColor = isCustom ? colors.primaryBg : colors.bgMuted;
        const borderColor = isCustom ? [254, 202, 202] : colors.border;

        drawCard(y, height, bgColor, borderColor);

        let sectionY = y + 10;
        setFont('label', 12);
        if (isCustom) doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(title, margin + 5, sectionY);

        setFont('label', 12);
        const totalText = `PKR ${total.toLocaleString()}`;
        doc.text(totalText, pageWidth - margin - 5, sectionY, { align: 'right' });

        sectionY += 5;
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.line(margin, sectionY, pageWidth - margin, sectionY);

        sectionY += 10;
        const colWidth = contentWidth / 4;

        // Col 1: Rate
        drawField(isCustom ? "Custom Rate" : "Standard Rate", `PKR ${rate.toLocaleString()}/sqft`, margin + 5, sectionY);

        // Col 2: Down Payment
        drawField("Down Payment (15%)", `PKR ${(total * 0.15).toLocaleString()}`, margin + 5 + colWidth, sectionY);

        // Col 3: Installments (Updated)
        const monthlyAmount = isCustom ? plan.monthlyInstallment : (total * 0.70) / plan.installmentMonths;
        drawField(`Inst. per month (${plan.installmentMonths})`, `PKR ${Math.round(monthlyAmount).toLocaleString()}`, margin + 5 + (colWidth * 2), sectionY);

        // Col 4: Possession
        drawField("Possession (15%)", `PKR ${(total * 0.15).toLocaleString()}`, margin + 5 + (colWidth * 3), sectionY);

        return y + height + 10;
    };

    // --- Section 2: Standard Pricing ---
    if (plan.standardRate && plan.standardRate > 0) {
        const standardTotal = plan.standardRate * plan.totalSqf;
        currentY = drawPricingSection(currentY, "Standard Pricing", plan.standardRate, standardTotal, false);
    }

    // --- Section 3: Discount ---
    if (plan.discount > 0) {
        drawCard(currentY, 25, colors.primaryBg, [254, 202, 202]);

        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text("TOTAL SAVINGS / DISCOUNT", pageWidth / 2, currentY + 10, { align: 'center' });

        doc.setFontSize(16);
        doc.text(`PKR ${plan.discount.toLocaleString()}`, pageWidth / 2, currentY + 18, { align: 'center' });

        currentY += 35;
    }

    // --- Section 4: Custom Pricing ---
    currentY = drawPricingSection(currentY, "Custom Payment Plan", plan.ratePerSqf, plan.totalAmount, true);

    // Totals Summary (Instead of table)
    currentY += 5;
    const finalTotal = plan.totalAmount;
    setFont('label', 14);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(`Total Payable: PKR ${finalTotal.toLocaleString()}`, pageWidth - margin - 5, currentY, { align: 'right' });

    doc.save(`Payment_Plan_${sale.customer.name.replace(/\s+/g, '_')}.pdf`);
};
