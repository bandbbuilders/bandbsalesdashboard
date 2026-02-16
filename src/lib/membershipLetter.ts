import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Sale, LedgerEntry } from '../types';
import letterheadImg from '../assets/bb-letterhead-hq.png'; // Updated to high quality image
import ceoSignature from '../assets/ceo-signature-new.png';

export const generateMembershipLetter = async (sale: Sale, ledgerEntries: LedgerEntry[]) => {
    const doc = new jsPDF();
    const primaryColor = [180, 2, 2]; // #B40202
    const pageHeight = doc.internal.pageSize.height;

    // Load images once
    const letterhead = new Image();
    letterhead.src = letterheadImg;
    await new Promise((resolve) => {
        letterhead.onload = resolve;
    });

    const signature = new Image();
    signature.src = ceoSignature;
    await new Promise((resolve) => {
        signature.onload = resolve;
    });

    // Function to add background to current page
    const addBackground = (pageDoc: jsPDF) => {
        // Letterhead background (A4 size is approx 210x297mm)
        pageDoc.addImage(letterhead, 'PNG', 0, 0, 210, 297);
    };

    // --- PAGE 1: Purchase Confirmation ---
    addBackground(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('MEMBERSHIP LETTER', 105, 60, { align: 'center' });

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(60, 65, 150, 65);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALE DETAILS', 25, 80);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const startY = 90;
    const lineSpacing = 8;

    doc.text(`Date of Sale:`, 25, startY);
    doc.text(`${format(new Date(sale.created_at), 'dd MMMM yyyy')}`, 70, startY);

    doc.text(`Client Name:`, 25, startY + lineSpacing);
    doc.text(`${sale.customer.name}`, 70, startY + lineSpacing);

    doc.text(`CNIC Number:`, 25, startY + lineSpacing * 2);
    doc.text(`${sale.customer.cnic || 'N/A'}`, 70, startY + lineSpacing * 2);

    doc.text(`Contact Details:`, 25, startY + lineSpacing * 3);
    doc.text(`${sale.customer.contact}`, 70, startY + lineSpacing * 3);

    doc.text(`Unit Number:`, 25, startY + lineSpacing * 4);
    doc.text(`${sale.unit_number}`, 70, startY + lineSpacing * 4);

    doc.text(`Mailing Address:`, 25, startY + lineSpacing * 5);
    const addressLines = doc.splitTextToSize(sale.customer.address || 'N/A', 120);
    doc.text(addressLines, 70, startY + lineSpacing * 5);

    // Onboarding Message
    const msgY = startY + lineSpacing * 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Welcome to B&B Builders!', 25, msgY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const welcomeMsg = `Dear ${sale.customer.name},\n\nWe would like to express our deepest gratitude for choosing B&B Builders for your property investment. It is an honor to have you as part of our community. This letter serves as the official document of your purchase confirmation for Unit ${sale.unit_number}.\n\nWe are committed to delivering excellence and ensuring a smooth journey as we build your dreams together. Should you have any questions, our dedicated team is always here to assist you.\n\nThank you for your trust and confidence in our vision.`;
    const splitWelcome = doc.splitTextToSize(welcomeMsg, 160);
    doc.text(splitWelcome, 25, msgY + 10);

    // --- PAGE 2: Payment Ledger ---
    doc.addPage();
    addBackground(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PAYMENT LEDGER', 105, 60, { align: 'center' });

    const ledgerBody = ledgerEntries
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .map(entry => [
            entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1),
            format(new Date(entry.due_date), 'dd/MM/yyyy'),
            `PKR ${entry.amount.toLocaleString()}`,
            `PKR ${entry.paid_amount.toLocaleString()}`,
            entry.status.charAt(0).toUpperCase() + entry.status.slice(1)
        ]);

    autoTable(doc, {
        startY: 70,
        head: [['Type', 'Due Date', 'Amount', 'Paid', 'Status']],
        body: ledgerBody,
        theme: 'plain', // Transparent table as requested
        headStyles: {
            fillColor: [255, 255, 255] as [number, number, number],
            textColor: primaryColor as [number, number, number],
            fontStyle: 'bold'
        },
        styles: {
            fillColor: [255, 255, 255] as [number, number, number], // Transparent/White rows
            textColor: [0, 0, 0] as [number, number, number],
            lineColor: [200, 200, 200] as [number, number, number],
            lineWidth: 0.1,
        },
        margin: { top: 70, left: 20, right: 20, bottom: 40 }, // Increased bottom margin to avoid covering footer
    });

    // --- PAGE 3: Terms and Conditions ---
    doc.addPage();
    addBackground(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TERMS AND CONDITIONS', 105, 60, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const terms = [
        "1. B&B Builders will hand over possession only after the client has paid all remaining dues. If the client has not completed the due payment of the unit at the time of handover, the Company will not provide possession until all payments are fully cleared.",
        "2. Monthly installments are due on the 5th of each month. If the client fails to pay installments for three consecutive months, the file will be cancelled. In such a case, the total amount paid by the client will be refunded in full within 90 working days without any deduction.",
        "3. B&B Builders has the right to cancel the membership of any client who violates the terms and conditions set by the company.",
        "4. The purchaser is allowed to sell the SHOP/FLAT before taking possession. However, prior written permission is required from the seller, besides the purchaser shall also have to pay Rs. 30/- (per sqft) as transfer fee to the B &B BUILDERS.",
        "5. As per FBR transfer of 3% for filler and 12% for non-filler and Rs.100 per/sqrft transfer fees.",
        "6. The occupant/purchaser must pay monthly maintenance charges as per market value after taking possession of the unit.",
        "7. The purchaser shall install Sui-gas and electricity connection at their own cost and responsibility.",
        "8. At time of possession as per FBR GST 5% will be imposed",
        "9. All units are priced the same, regardless of location, view, lift or floor. There's a first-come, first-served approach, giving early buyers the advantage.",
        "10. B&B Builders will not charge anything beyond the amount agreed at the time of the deal. No hidden charges will apply at any stage.",
        "11. B&B Builders allows clients to cancel their file at any time without any cancellation charges. In the event of cancellation, any payment due will be refunded within 45 days.",
        "12. I have carefully read and understood the terms and conditions and agreed to abide by them in letter and spirit and understand that this agreement supersedes all previous communication whether verbal or in writing."
    ];

    let termY = 70;
    terms.forEach((term, index) => {
        const splitTerm = doc.splitTextToSize(term, 170);
        // Check if term fits on page, if not add new page with background
        if (termY + splitTerm.length * 5 > pageHeight - 40) {
            doc.addPage();
            addBackground(doc);
            termY = 60; // Reset Y for new page
        }
        doc.text(splitTerm, 20, termY);
        termY += splitTerm.length * 5 + 2;
    });

    // --- PAGE 4: Authorization Page ---
    doc.addPage();
    addBackground(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('AUTHORIZATION', 105, 60, { align: 'center' });

    // Signatures at the bottom
    const finalY = pageHeight - 60; // 60 units from bottom

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);

    // Client Signature
    doc.line(20, finalY, 80, finalY);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Client Signature', 20, finalY + 10);

    // Add CEO Signature Image
    doc.addImage(signature, 'PNG', 130, finalY - 25, 50, 20);

    // Authorized Signature line
    doc.line(130, finalY, 190, finalY);
    doc.text('Authorized Signature', 130, finalY + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Abdullah Shah (CEO)', 130, finalY + 18);
    doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, 130, finalY + 25);

    // Save PDF
    doc.save(`Membership_Letter_${sale.customer.name.replace(/\s+/g, '_')}.pdf`);
};
