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

    // Helper: Pricing Breakdown Section (Updated for single-line with dividers)
    const drawPricingSection = (y: number, title: string, rate: number, total: number, isCustom: boolean) => {
        const height = 35; // Thinner card for one-line breakdown
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

        // Divider Line
        sectionY += 5;
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.line(margin, sectionY, pageWidth - margin, sectionY);

        // Single line breakdown
        sectionY += 10;
        const monthlyAmount = isCustom ? plan.monthlyInstallment : (total * 0.70) / plan.installmentMonths;
        const rateLabel = isCustom ? "Custom Rate" : "Standard Rate";
        const breakdownLine = `${rateLabel}: PKR ${rate.toLocaleString()}/sqft  |  DP (15%): PKR ${(total * 0.15).toLocaleString()}  |  Inst. (${plan.installmentMonths}x): PKR ${Math.round(monthlyAmount).toLocaleString()}  |  Possession (15%): PKR ${(total * 0.15).toLocaleString()}`;

        setFont('value', 9);
        doc.text(breakdownLine, pageWidth / 2, sectionY, { align: 'center' });

        return y + height + 10;
    };


    // --- Header & Title Section ---
    let currentY = 20;

    // Add Logo in top right - adjusted dimensions to prevent stretching
    try {
        // Using a more standard logo aspect ratio
        doc.addImage('/WHITE LOGO.png', 'PNG', pageWidth - margin - 35, 10, 35, 10);
    } catch (e) {
        console.error("Logo not found", e);
    }

    setFont('heading');
    doc.text('Payment Plan Proposal', margin, currentY);

    // Introduction Text
    currentY += 10;
    setFont('body', 10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const introText = "This tailored payment structure has been thoughtfully designed around your specific requirements to give you maximum flexibility and ease.";

    const splitIntro = doc.splitTextToSize(introText, contentWidth);
    doc.text(splitIntro, margin, currentY);
    currentY += (splitIntro.length * 5) + 10;

    // --- One-line Header Details ---
    const headerLine = `Client: ${sale.customer.name}  |  Unit: ${sale.unit_number}  |  Area: ${plan.totalSqf} SQF  |  Date: ${format(new Date(), 'dd MMM yyyy')}`;
    setFont('label', 10);
    doc.text(headerLine, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;


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

    // Totals Summary
    currentY += 5;
    const finalTotal = plan.totalAmount || 0;
    setFont('label', 16);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(`Total Payable: PKR ${finalTotal.toLocaleString()}`, pageWidth - margin - 5, currentY, { align: 'right' });

    // Footer Text
    currentY += 20;
    setFont('body', 10);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    const footerText = "Please note, this is a provisional plan; once you confirm, it will be forwarded for formal approval and final confirmation.";
    const splitFooter = doc.splitTextToSize(footerText, contentWidth);
    doc.text(splitFooter, pageWidth / 2, currentY, { align: 'center' });

    doc.save(`Payment_Plan_${sale.customer.name.replace(/\s+/g, '_')}.pdf`);
};
