import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Building2, Calculator, FileText, Share2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import letterheadImg from "@/assets/bb-letterhead-hq.png";
import stampImg from "@/assets/bb-stamp.png";
import ceoSignature from "@/assets/ceo-signature-new.png";
import {
    getStandardRate,
    UNIT_CATEGORIES,
    FLOOR_TYPES,
    FACING_TYPES,
    UnitCategory,
    FloorType,
    FacingType
} from "@/data/standardPricing";
import { toast } from "sonner";

const PaymentPlanGenerator = () => {
    // UI State
    const [clientName, setClientName] = useState("");
    const [unitCategory, setUnitCategory] = useState<UnitCategory>("Apartment");
    const [floorType, setFloorType] = useState<FloorType>("2nd to 6th Floor");
    const [facingType, setFacingType] = useState<FacingType>("General");
    const [area, setArea] = useState<number>(0);

    // Custom Plan State
    const [bookingAmount, setBookingAmount] = useState<number>(0);
    const [downPayment, setDownPayment] = useState<number>(0);
    const [monthlyInstallment, setMonthlyInstallment] = useState<number>(0);
    const [possessionAmount, setPossessionAmount] = useState<number>(0);

    // Calculated Values
    const [standardRate, setStandardRate] = useState<number>(0);
    const [standardTotal, setStandardTotal] = useState<number>(0);
    const [customTotal, setCustomTotal] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [discountPercentage, setDiscountPercentage] = useState<number>(0);

    // Update Standard Price when selection changes
    useEffect(() => {
        const rate = getStandardRate(unitCategory, floorType, unitCategory === 'Shop' ? facingType : undefined);
        setStandardRate(rate);
        setStandardTotal(rate * (area || 0));
    }, [unitCategory, floorType, facingType, area]);

    // Update Custom Total and Discount
    useEffect(() => {
        const total = (bookingAmount || 0) + (downPayment || 0) + ((monthlyInstallment || 0) * 36) + (possessionAmount || 0);
        setCustomTotal(total);

        if (standardTotal > 0) {
            const discount = standardTotal - total;
            setDiscountAmount(discount);
            setDiscountPercentage((discount / standardTotal) * 100);
        } else {
            setDiscountAmount(0);
            setDiscountPercentage(0);
        }
    }, [bookingAmount, downPayment, monthlyInstallment, possessionAmount, standardTotal]);


    const generatePDF = async () => {
        if (!clientName || !area) {
            toast.error("Please fill in Client Name and Area");
            return;
        }

        const doc = new jsPDF();
        const primaryColor = [180, 2, 2]; // #B40202

        // Load Images
        const letterhead = new Image();
        letterhead.src = letterheadImg;
        await new Promise(r => letterhead.onload = r);

        const stamp = new Image();
        stamp.src = stampImg;
        await new Promise(r => stamp.onload = r);

        const signature = new Image();
        signature.src = ceoSignature;
        await new Promise(r => signature.onload = r);

        // Background Helper
        const addBackground = (pageDoc: jsPDF) => {
            pageDoc.addImage(letterhead, 'PNG', 0, 0, 210, 297);
        };

        // Monkey Patch addPage
        const originalAddPage = doc.addPage.bind(doc);
        doc.addPage = function (format?: string | number[], orientation?: "p" | "portrait" | "l" | "landscape") {
            const result = originalAddPage(format, orientation);
            addBackground(this);
            return result;
        };

        // Page 1
        addBackground(doc);

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('PAYMENT PLAN PROPOSAL', 105, 60, { align: 'center' });

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1);
        doc.line(60, 65, 150, 65);

        // Client & Unit Details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENT & UNIT DETAILS', 20, 80);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        let yPos = 90;
        const lineHeight = 8;

        // Left Column
        doc.text(`Client Name:`, 20, yPos);
        doc.text(clientName, 60, yPos);

        doc.text(`Date:`, 120, yPos);
        doc.text(format(new Date(), "dd MMMM yyyy"), 150, yPos);

        yPos += lineHeight;
        doc.text(`Unit Category:`, 20, yPos);
        doc.text(unitCategory, 60, yPos);

        doc.text(`Floor:`, 120, yPos);
        doc.text(floorType, 150, yPos);

        yPos += lineHeight;
        if (unitCategory === 'Shop') {
            doc.text(`Facing:`, 20, yPos);
            doc.text(facingType, 60, yPos);
        } else {
            doc.text(`Type:`, 20, yPos);
            doc.text(floorType === '1st Floor' ? 'Furnished 1 Bed' : '1 Bed Apartment', 60, yPos);
        }

        doc.text(`Area:`, 120, yPos);
        doc.text(`${area} sqft`, 150, yPos);

        // Financial Breakdown Table
        yPos += lineHeight * 2;
        doc.setFont('helvetica', 'bold');
        doc.text('FINANCIAL BREAKDOWN', 20, yPos);

        const financialData = [
            ['Total Standard Price', `PKR ${standardTotal.toLocaleString()}`],
            ['Discount Applied', `${discountPercentage.toFixed(2)}% (PKR ${discountAmount.toLocaleString()})`],
            ['Net Payable Price', `PKR ${customTotal.toLocaleString()}`],
        ];

        autoTable(doc, {
            startY: yPos + 5,
            head: [['Description', 'Amount']],
            body: financialData,
            theme: 'grid',
            headStyles: { fillColor: primaryColor as [number, number, number] },
            styles: { fontSize: 11 },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
        });

        // Payment Schedule
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.text('PROPOSED PAYMENT SCHEDULE', 20, finalY);

        const scheduleData = [
            ['Booking Amount', `PKR ${bookingAmount.toLocaleString()}`],
            ['Down Payment', `PKR ${downPayment.toLocaleString()}`],
            ['36 Monthly Installments', `PKR ${monthlyInstallment.toLocaleString()} x 36 = PKR ${(monthlyInstallment * 36).toLocaleString()}`],
            ['Possession Amount', `PKR ${possessionAmount.toLocaleString()}`],
            ['TOTAL', `PKR ${customTotal.toLocaleString()}`]
        ];

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Milestone', 'Amount']],
            body: scheduleData,
            theme: 'striped',
            headStyles: { fillColor: [50, 50, 50] },
            styles: { fontSize: 10 },
            columnStyles: { 1: { halign: 'right' } }
        });

        // Note Section
        const noteY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const noteText = "Note: This is a proposed payment plan. Prices and availability are subject to change. Possession charges are payable at the time of possession.";
        doc.text(doc.splitTextToSize(noteText, 170), 20, noteY);

        // Signatures
        const sigY = 240;

        // Stamp
        doc.addImage(stamp, 'PNG', 135, sigY - 15, 40, 40);
        // Signature
        doc.addImage(signature, 'PNG', 130, sigY - 10, 40, 16);

        doc.setDrawColor(0, 0, 0);
        doc.line(20, sigY + 10, 80, sigY + 10);
        doc.text("Client Signature", 20, sigY + 15);

        doc.line(130, sigY + 10, 190, sigY + 10);
        doc.text("Authorized Signature", 130, sigY + 15);
        doc.text("Abdullah Shah (CEO)", 130, sigY + 20);

        doc.save(`Payment_Plan_${clientName.replace(/\s+/g, '_')}.pdf`);
        toast.success("Payment Plan PDF Generated");
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Payment Plan Generator</h1>
                    <p className="text-muted-foreground mt-2">Generate custom payment plans with discount analysis.</p>
                </div>
                <Button onClick={generatePDF} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Generate PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Unit & Client Details</CardTitle>
                        <CardDescription>Enter the details to derive standard pricing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Client Name</Label>
                            <Input
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Enter client name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Unit Category</Label>
                                <Select value={unitCategory} onValueChange={(v: UnitCategory) => {
                                    setUnitCategory(v);
                                    setFloorType(FLOOR_TYPES[v][0]);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UNIT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Floor Type</Label>
                                <Select value={floorType} onValueChange={(v: FloorType) => setFloorType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FLOOR_TYPES[unitCategory].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {unitCategory === 'Shop' && (
                            <div className="grid gap-2">
                                <Label>Facing</Label>
                                <Select value={facingType} onValueChange={(v: FacingType) => setFacingType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FACING_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Area (Square Feet)</Label>
                            <Input
                                type="number"
                                value={area || ''}
                                onChange={(e) => setArea(Number(e.target.value))}
                                placeholder="e.g. 1000"
                            />
                        </div>

                        <div className="bg-muted p-4 rounded-lg mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Standard Rate:</span>
                                <span className="font-semibold">PKR {standardRate.toLocaleString()}/sqft</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-primary">
                                <span>Standard Total Price:</span>
                                <span>PKR {standardTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Custom Plan Section */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Custom Payment Schedule</CardTitle>
                        <CardDescription>Adjust amounts to see discount impact</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Booking Amount</Label>
                                <Input
                                    type="number"
                                    value={bookingAmount || ''}
                                    onChange={(e) => setBookingAmount(Number(e.target.value))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Down Payment</Label>
                                <Input
                                    type="number"
                                    value={downPayment || ''}
                                    onChange={(e) => setDownPayment(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Monthly Installment (x36)</Label>
                            <Input
                                type="number"
                                value={monthlyInstallment || ''}
                                onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                Total Installments: PKR {((monthlyInstallment || 0) * 36).toLocaleString()}
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Possession Amount</Label>
                            <Input
                                type="number"
                                value={possessionAmount || ''}
                                onChange={(e) => setPossessionAmount(Number(e.target.value))}
                            />
                        </div>

                        <div className={`p-4 rounded-lg mt-4 space-y-2 border ${discountAmount > 0 ? 'bg-green-50/50 border-green-200' : 'bg-muted border-transparent'}`}>
                            <div className="flex justify-between text-sm">
                                <span>Custom Total Price:</span>
                                <span className="font-semibold">PKR {customTotal.toLocaleString()}</span>
                            </div>
                            {discountAmount !== 0 && (
                                <div className={`flex justify-between text-sm font-medium ${discountAmount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    <span>{discountAmount > 0 ? 'Discount' : 'Premium'}:</span>
                                    <span>
                                        {Math.abs(discountPercentage).toFixed(2)}%
                                        (PKR {Math.abs(discountAmount).toLocaleString()})
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PaymentPlanGenerator;
