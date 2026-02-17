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

    // Helper: Pricing Breakdown Section
    const drawPricingSection = (y: number, title: string, rate: number, total: number, isCustom: boolean) => {
        const height = 45;
        const bgColor = isCustom ? colors.primaryBg : colors.bgMuted;
        const borderColor = isCustom ? [254, 202, 202] : colors.border; // lighter red for custom border

        drawCard(y, height, bgColor, borderColor);

        // Header Row inside card
        let currentY = y + 10;
        setFont('label', 12);
        if (isCustom) doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(title, margin + 5, currentY);

        setFont('label', 12);
        if (isCustom) doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        const totalText = `PKR ${total.toLocaleString()}`;
        doc.text(totalText, pageWidth - margin - 5, currentY, { align: 'right' });

        // Divider
        currentY += 5;
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.line(margin, currentY, pageWidth - margin, currentY);

        // Columns
        currentY += 10;
        const colWidth = contentWidth / 4;

        // Rate
        drawField(isCustom ? "Custom Rate (Per SQF)" : "Standard Rate", `PKR ${rate.toLocaleString()}/sqft`, margin + 5, currentY);

        // Breakdown Math
        // If total is 0, breakdown is 0
        const breakdownTotal = total;

        // Down Payment (15%)
        drawField("Down Payment (15%)", `PKR ${(breakdownTotal * 0.15).toLocaleString()}`, margin + 5 + colWidth, currentY);

        // Installments (70%)
        drawField("Installments (70%)", `PKR ${(breakdownTotal * 0.70).toLocaleString()}`, margin + 5 + (colWidth * 2), currentY);

        // Possession (15%)
        drawField("Possession (15%)", `PKR ${(breakdownTotal * 0.15).toLocaleString()}`, margin + 5 + (colWidth * 3), currentY);

        return y + height + 10; // Return next Y
    };

    // --- Title ---
    let currentY = 20;
    setFont('heading');
    doc.text('Payment Plan Proposal', margin, currentY);

    setFont('value');
    doc.text('Generate custom payment plans with rate customization and validation.', margin, currentY + 8);

    // --- Section 1: Unit & Client Details ---
    currentY += 20;
    const detailsHeight = 50;
    drawCard(currentY, detailsHeight, null, colors.border);

    // Header
    doc.setFontSize(14);
    setFont('label', 12);
    doc.text('Unit & Client Details', margin + 5, currentY + 10);
    setFont('value');
    doc.text('Configure unit params to derive pricing', margin + 5, currentY + 16);

    // fields
    let fieldsY = currentY + 30;
    const colWidth = contentWidth / 3;

    drawField('Client Name', sale.customer.name, margin + 5, fieldsY);
    drawField('Unit Number', sale.unit_number, margin + 5 + colWidth, fieldsY);
    drawField('Area (Square Feet)', `${plan.totalSqf} SQF`, margin + 5 + (colWidth * 2), fieldsY);

    fieldsY += 15; // Second row

    drawField('Date', format(new Date(), 'dd MMM yyyy'), margin + 5, fieldsY);

    if (plan.preparedBy) {
        drawField('Prepared By', plan.preparedBy, margin + 5 + colWidth, fieldsY);
    }


    // --- Section 2: Standard Pricing ---
    currentY += detailsHeight + 10;

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


    // --- Table ---
    // Schedule Table
    const scheduleData = [];

    if (plan.bookingAmount > 0) {
        scheduleData.push([
            'Booking Amount',
            format(plan.bookingDate, 'dd/MM/yyyy'),
            `PKR ${plan.bookingAmount.toLocaleString()}`
        ]);
    }

    scheduleData.push([
        'Down Payment',
        format(plan.downPaymentDate, 'dd/MM/yyyy'),
        `PKR ${plan.downPayment.toLocaleString()}`
    ]);

    if (plan.showDetailedSchedule) {
        for (let i = 0; i < plan.installmentMonths; i++) {
            const dueDate = addMonths(plan.installmentStartDate, i);
            scheduleData.push([
                `Installment ${i + 1}`,
                format(dueDate, 'dd/MM/yyyy'),
                `PKR ${plan.monthlyInstallment.toLocaleString()}`
            ]);
        }
    } else {
        const totalInstallmentAmount = plan.monthlyInstallment * plan.installmentMonths;
        scheduleData.push([
            `${plan.installmentMonths} Monthly Installments`,
            `${format(plan.installmentStartDate, 'dd/MM/yyyy')} to ${format(addMonths(plan.installmentStartDate, plan.installmentMonths - 1), 'dd/MM/yyyy')}`,
            `PKR ${totalInstallmentAmount.toLocaleString()}`
        ]);
    }

    if (plan.possessionAmount > 0) {
        scheduleData.push([
            'Possession',
            format(plan.possessionDate, 'dd/MM/yyyy'),
            `PKR ${plan.possessionAmount.toLocaleString()}`
        ]);
    }

    const baseTotal = plan.bookingAmount + plan.downPayment + (plan.monthlyInstallment * plan.installmentMonths) + plan.possessionAmount;

    autoTable(doc, {
        startY: currentY,
        head: [['Milestone', 'Due Date', 'Amount']],
        body: scheduleData,
        foot: [['Total Payable', '', `PKR ${baseTotal.toLocaleString()}`]],
        theme: 'grid',
        headStyles: {
            fillColor: colors.bgMuted as [number, number, number],
            textColor: colors.text as [number, number, number],
            fontStyle: 'bold',
            halign: 'left',
            lineWidth: 0.1,
            lineColor: colors.border as [number, number, number]
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'right' }
        },
        footStyles: {
            fillColor: colors.bgMuted as [number, number, number],
            textColor: colors.primary as [number, number, number],
            fontStyle: 'bold',
            halign: 'right'
        },
        styles: {
            lineColor: colors.border as [number, number, number],
            lineWidth: 0.1,
            cellPadding: 4,
            textColor: colors.text as [number, number, number]
        },
    });

    doc.save(`Payment_Plan_${sale.customer.name.replace(/\s+/g, '_')}.pdf`);
};
