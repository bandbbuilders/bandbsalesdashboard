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
    showDetailedSchedule?: boolean;
}

export const generatePaymentPlanPDF = async (sale: Sale, plan: PaymentPlanParams) => {
    const doc = new jsPDF();
    const primaryColor = [180, 2, 2]; // #B40202
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

    // --- Header Section ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PAYMENT PLAN PROPOSAL', pageWidth / 2, 20, { align: 'center' });

    // Client & Unit Info Box
    drawRoundedBox(15, 30, pageWidth - 30, 45, [250, 250, 250], [200, 200, 200]);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Client Name: ${sale.customer.name}`, 20, 42);
    doc.text(`Unit Number: ${sale.unit_number}`, 20, 52);

    // Size and Rate Info
    if (plan.totalSqf > 0) {
        doc.text(`Unit Size: ${plan.totalSqf} SQF`, 20, 62);
    }
    if (plan.ratePerSqf > 0) {
        doc.text(`Rate/SQF: PKR ${plan.ratePerSqf.toLocaleString()}`, 100, 62);
    }

    doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, 140, 42);


    // --- Discount Section (Big Numbers) ---
    let tableStartY = 90;
    if (plan.discount > 0) {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(15, 80, pageWidth - 30, 25, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text("TOTAL SAVINGS / DISCOUNT", pageWidth / 2, 88, { align: 'center' });

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`PKR ${plan.discount.toLocaleString()}`, pageWidth / 2, 98, { align: 'center' });
        tableStartY = 115;
    }

    // --- Schedule Table ---
    const scheduleData = [];

    // 1. Booking Amount
    if (plan.bookingAmount > 0) {
        scheduleData.push([
            'Booking Amount',
            format(plan.bookingDate, 'dd/MM/yyyy'),
            `PKR ${plan.bookingAmount.toLocaleString()}`,
            ''
        ]);
    }

    // 2. Down Payment
    scheduleData.push([
        'Down Payment',
        format(plan.downPaymentDate, 'dd/MM/yyyy'),
        `PKR ${plan.downPayment.toLocaleString()}`,
        ''
    ]);

    // 3. Installments
    if (plan.showDetailedSchedule) {
        for (let i = 0; i < plan.installmentMonths; i++) {
            const dueDate = addMonths(plan.installmentStartDate, i);
            scheduleData.push([
                `Installment ${i + 1}`,
                format(dueDate, 'dd/MM/yyyy'),
                `PKR ${plan.monthlyInstallment.toLocaleString()}`,
                ''
            ]);
        }
    } else {
        const totalInstallmentAmount = plan.monthlyInstallment * plan.installmentMonths;
        scheduleData.push([
            `${plan.installmentMonths} Monthly Installments`,
            `${format(plan.installmentStartDate, 'dd/MM/yyyy')} to ${format(addMonths(plan.installmentStartDate, plan.installmentMonths - 1), 'dd/MM/yyyy')}`,
            `PKR ${totalInstallmentAmount.toLocaleString()}`,
            `@ PKR ${plan.monthlyInstallment.toLocaleString()} / month`
        ]);
    }


    // 4. Possession
    if (plan.possessionAmount > 0) {
        scheduleData.push([
            'Possession',
            format(plan.possessionDate, 'dd/MM/yyyy'),
            `PKR ${plan.possessionAmount.toLocaleString()}`,
            ''
        ]);
    }

    // Totals
    const baseTotal = plan.bookingAmount + plan.downPayment + (plan.monthlyInstallment * plan.installmentMonths) + plan.possessionAmount;

    autoTable(doc, {
        startY: tableStartY,
        head: [['Milestone', 'Due Date', 'Amount', 'Notes']],
        body: scheduleData,
        foot: [['Total Payable', '', `PKR ${baseTotal.toLocaleString()}`, '']],
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor as [number, number, number],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' }
        },
        footStyles: {
            fillColor: [240, 240, 240] as [number, number, number],
            textColor: [0, 0, 0] as [number, number, number],
            fontStyle: 'bold',
            halign: 'right'
        },
        styles: {
            lineColor: [200, 200, 200] as [number, number, number],
            lineWidth: 0.1,
        },
    });

    // --- Signatures Section ---
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    const signatureY = finalY > pageHeight - 40 ? pageHeight - 40 : finalY;

    if (signatureY > pageHeight - 40) doc.addPage();

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Authorized Signature
    doc.line(130, signatureY, 190, signatureY);
    doc.text('Authorized Signature', 130, signatureY + 8);
    doc.text('B&B Builders', 130, signatureY + 14);

    // Client Signature
    doc.line(20, signatureY, 80, signatureY);
    doc.text('Client Signature', 20, signatureY + 8);

    doc.save(`Payment_Plan_${sale.customer.name.replace(/\s+/g, '_')}.pdf`);
};
