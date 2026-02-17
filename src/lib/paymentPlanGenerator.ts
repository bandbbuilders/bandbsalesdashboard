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
    const primaryColor = [180, 2, 2]; // #B40202
    const lightGray = [240, 240, 240];
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // Helper to draw rounded rect with text
    const drawRoundedBox = (x: number, y: number, w: number, h: number, fillColor: [number, number, number] | null, strokeColor: [number, number, number], title?: string, text?: string) => {
        doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
        if (fillColor) {
            doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
            doc.roundedRect(x, y, w, h, 3, 3, 'FD');
        } else {
            doc.roundedRect(x, y, w, h, 3, 3, 'S');
        }

        if (title) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(title, x + 5, y + 15);
        }
        if (text) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(text, x + 5, y + 25);
        }
    };

    // Helper to draw price breakdown box
    const drawPriceBox = (x: number, y: number, w: number, title: string, rate: number, totalAmount: number) => {
        const boxHeight = 45;
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(x, y, w, boxHeight, 3, 3, 'S');

        // Title Background
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(x, y, w, 10, 3, 3, 'F');
        // Fix bottom corners of title bg (make them square to not look weird with the rest of the box)
        doc.rect(x, y + 5, w, 5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(title, x + (w / 2), y + 7, { align: 'center' });

        // Content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);

        const leftX = x + 5;
        const rightX = x + w - 5;
        let currentY = y + 16;
        const lineHeight = 6;

        // Rate
        doc.text(`Rate / SQF:`, leftX, currentY);
        doc.text(`PKR ${rate.toLocaleString()}`, rightX, currentY, { align: 'right' });
        currentY += lineHeight;

        const breakdownTotal = totalAmount; // Assuming totalAmount matches rate * sqf logic

        // Down Payment (15%)
        doc.text(`Down Payment (15%):`, leftX, currentY);
        doc.text(`PKR ${(breakdownTotal * 0.15).toLocaleString()}`, rightX, currentY, { align: 'right' });
        currentY += lineHeight;

        // Installments (70%)
        doc.text(`Installments (70%):`, leftX, currentY);
        doc.text(`PKR ${(breakdownTotal * 0.70).toLocaleString()}`, rightX, currentY, { align: 'right' });
        currentY += lineHeight;

        // Possession (15%)
        doc.text(`Possession (15%):`, leftX, currentY);
        doc.text(`PKR ${(breakdownTotal * 0.15).toLocaleString()}`, rightX, currentY, { align: 'right' });

        // Total Line
        doc.setDrawColor(220, 220, 220);
        doc.line(x, y + boxHeight - 8, x + w, y + boxHeight - 8);

        doc.setFont('helvetica', 'bold');
        doc.text(`Total Amount:`, leftX, y + boxHeight - 2);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`PKR ${totalAmount.toLocaleString()}`, rightX, y + boxHeight - 2, { align: 'right' });
    };

    // --- Header Section ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PAYMENT PLAN PROPOSAL', pageWidth / 2, 20, { align: 'center' });

    // Header Details Box
    const headerBoxY = 30;
    const headerBoxH = 35;

    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(15, headerBoxY, pageWidth - 30, headerBoxH, 3, 3, 'S');

    doc.setFont('helvetica', 'bold'); // Lighter bold
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Left Column
    doc.text(`Client Name:`, 20, headerBoxY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.customer.name, 50, headerBoxY + 10);

    doc.setFont('helvetica', 'bold');
    doc.text(`Unit Number:`, 20, headerBoxY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.unit_number, 50, headerBoxY + 20);

    if (plan.totalSqf > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Unit Size:`, 20, headerBoxY + 30);
        doc.setFont('helvetica', 'normal');
        doc.text(`${plan.totalSqf} SQF`, 50, headerBoxY + 30);
    }

    // Right Column
    doc.setFont('helvetica', 'bold');
    doc.text(`Date:`, 120, headerBoxY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), 'dd MMM yyyy'), 150, headerBoxY + 10);

    if (plan.preparedBy) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Prepared By:`, 120, headerBoxY + 20);
        doc.setFont('helvetica', 'normal');
        doc.text(plan.preparedBy, 150, headerBoxY + 20);
    }

    // --- Pricing Breakdown Section ---
    const boxY = 75;
    const boxWidth = (pageWidth - 40) / 2; // Split space

    // 1. Original Price Box
    if (plan.standardRate && plan.standardRate > 0) {
        const standardTotal = plan.standardRate * plan.totalSqf;
        drawPriceBox(15, boxY, boxWidth, "ORIGINAL PRICE (Standard)", plan.standardRate, standardTotal);
    }

    // 2. Custom Plan Box
    drawPriceBox(15 + boxWidth + 10, boxY, boxWidth, "CUSTOM PAYMENT PLAN", plan.ratePerSqf, plan.totalAmount);

    // --- Discount Section ---
    let tableStartY = 135;

    // Check if there is a discount to show
    if (plan.discount > 0) {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(15, 125, pageWidth - 30, 20, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const savingsText = `TOTAL SAVINGS / DISCOUNT:   PKR ${plan.discount.toLocaleString()}`;
        doc.text(savingsText, pageWidth / 2, 137, { align: 'center' });

        tableStartY = 155;
    }

    // --- Schedule Table ---
    const scheduleData = [];

    // 1. Booking Amount
    if (plan.bookingAmount > 0) {
        scheduleData.push([
            'Booking Amount',
            format(plan.bookingDate, 'dd/MM/yyyy'),
            `PKR ${plan.bookingAmount.toLocaleString()}`
        ]);
    }

    // 2. Down Payment
    scheduleData.push([
        'Down Payment',
        format(plan.downPaymentDate, 'dd/MM/yyyy'),
        `PKR ${plan.downPayment.toLocaleString()}`
    ]);

    // 3. Installments
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

    // 4. Possession
    if (plan.possessionAmount > 0) {
        scheduleData.push([
            'Possession',
            format(plan.possessionDate, 'dd/MM/yyyy'),
            `PKR ${plan.possessionAmount.toLocaleString()}`
        ]);
    }

    // Totals
    const baseTotal = plan.bookingAmount + plan.downPayment + (plan.monthlyInstallment * plan.installmentMonths) + plan.possessionAmount;

    autoTable(doc, {
        startY: tableStartY,
        head: [['Milestone', 'Due Date', 'Amount']],
        body: scheduleData,
        foot: [['Total Payable', '', `PKR ${baseTotal.toLocaleString()}`]],
        theme: 'grid', // Cleaner grid
        headStyles: {
            fillColor: [245, 245, 245] as [number, number, number], // Light gray header
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'right' }
        },
        footStyles: {
            fillColor: [250, 250, 250] as [number, number, number],
            textColor: primaryColor as [number, number, number],
            fontStyle: 'bold',
            halign: 'right'
        },
        styles: {
            lineColor: [220, 220, 220] as [number, number, number],
            lineWidth: 0.1,
            cellPadding: 3,
            textColor: [50, 50, 50]
        },
    });

    // NOTE: Signatures removed as per request

    doc.save(`Payment_Plan_${sale.customer.name.replace(/\s+/g, '_')}.pdf`);
};
