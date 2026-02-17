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
import { format, addMonths } from "date-fns";
import { FileText } from "lucide-react";
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
import { generatePaymentPlanPDF } from "@/lib/paymentPlanGenerator";
import { Separator } from "@/components/ui/separator";

const PaymentPlanGenerator = () => {
    // UI State
    const [clientName, setClientName] = useState("");
    const [unitCategory, setUnitCategory] = useState<UnitCategory>("Apartment");
    const [floorType, setFloorType] = useState<FloorType>("2nd to 6th Floor");
    const [facingType, setFacingType] = useState<FacingType>("General");
    const [area, setArea] = useState<number>(0);
    const [unitNumber, setUnitNumber] = useState("");
    const [user, setUser] = useState<{ name: string } | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Options
    const [showDetailedSchedule, setShowDetailedSchedule] = useState(true);

    // Custom Plan State
    const [bookingAmount, setBookingAmount] = useState<number>(0);
    const [bookingDate, setBookingDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [downPayment, setDownPayment] = useState<number>(0);
    const [downPaymentDate, setDownPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    // Installments
    const [installmentMonths, setInstallmentMonths] = useState<number>(36);
    const [monthlyInstallment, setMonthlyInstallment] = useState<number>(0);
    const [installmentStartDate, setInstallmentStartDate] = useState<string>(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));

    // Possession
    const [possessionAmount, setPossessionAmount] = useState<number>(0);
    const [possessionDate, setPossessionDate] = useState<string>(format(addMonths(new Date(), 36), 'yyyy-MM-dd'));

    // Calculated Values & Rates
    const [standardRate, setStandardRate] = useState<number>(0);
    const [customRate, setCustomRate] = useState<number>(0);
    const [standardTotal, setStandardTotal] = useState<number>(0);
    const [customTotal, setCustomTotal] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [discountPercentage, setDiscountPercentage] = useState<number>(0);

    // Update Standard Price when selection changes
    useEffect(() => {
        const rate = getStandardRate(unitCategory, floorType, unitCategory === 'Shop' ? facingType : undefined);
        setStandardRate(rate);

        // Only update custom rate if it hasn't been manually set, or if we want to reset it on category change
        if (customRate === 0) {
            setCustomRate(rate);
        }

        setStandardTotal(rate * (area || 0));
    }, [unitCategory, floorType, facingType, area]);

    // Update Totals when Custom Rate or Area changes
    useEffect(() => {
        if (area > 0 && customRate > 0) {
            const total = area * customRate;
            setCustomTotal(total);
        }
    }, [area, customRate]);

    // Calculate Discount based on Standard total vs Custom Total
    useEffect(() => {
        if (standardTotal > 0 && customTotal > 0) {
            const discount = standardTotal - customTotal;
            setDiscountAmount(discount);
            setDiscountPercentage((discount / standardTotal) * 100);
        } else {
            setDiscountAmount(0);
            setDiscountPercentage(0);
        }
    }, [standardTotal, customTotal]);


    const generatePDF = async () => {
        if (!clientName || !area) {
            toast.error("Please fill in Client Name and Area");
            return;
        }

        const totalSum = bookingAmount + downPayment + (monthlyInstallment * installmentMonths) + possessionAmount;

        // Validation: Sum must equal Custom Total
        // Allow a small margin of error for floating point arithmetic
        if (Math.abs(totalSum - customTotal) > 100) {
            toast.error(`Validation Error: Sum of parts (${totalSum.toLocaleString()}) does not match Total Amount (${customTotal.toLocaleString()})`);
            return;
        }

        // Mock Sale Object for the generator
        const mockSale: any = {
            customer: {
                name: clientName,
            },
            unit_number: unitNumber || "TBD",
            unit_total_price: standardTotal, // Original price before discount
        };

        // Params
        const params = {
            totalAmount: customTotal,
            downPayment: downPayment,
            downPaymentDate: new Date(downPaymentDate),
            monthlyInstallment: monthlyInstallment,
            installmentMonths: installmentMonths,
            installmentStartDate: new Date(installmentStartDate),
            possessionAmount: possessionAmount,
            possessionDate: new Date(possessionDate),
            discount: discountAmount > 0 ? discountAmount : 0, // Only pass positive discount
            bookingAmount: bookingAmount,
            bookingDate: new Date(bookingDate),
            totalSqf: area,
            ratePerSqf: customRate,
            standardRate: standardRate,
            showDetailedSchedule: showDetailedSchedule,
            preparedBy: user?.name
        };

        await generatePaymentPlanPDF(mockSale, params);
        toast.success("Payment Plan PDF Generated");
    };

    const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Payment Plan Generator</h1>
                    <p className="text-muted-foreground mt-2">Generate custom payment plans with rate customization and validation.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="detailedSchedule"
                            checked={showDetailedSchedule}
                            onChange={(e) => setShowDetailedSchedule(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="detailedSchedule" className="cursor-pointer text-sm">Generate Payment Ledger (Detailed)</Label>
                    </div>
                    <Button onClick={generatePDF} className="gap-2">
                        <FileText className="h-4 w-4" />
                        Generate PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Unit Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Unit & Client Details</CardTitle>
                        <CardDescription>Configure unit params to derive pricing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Client Name *</Label>
                                <Input
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="Enter client name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unit Number (Optional)</Label>
                                <Input
                                    value={unitNumber}
                                    onChange={(e) => setUnitNumber(e.target.value)}
                                    placeholder="e.g. A-101"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Area (Square Feet) *</Label>
                                <Input
                                    type="number"
                                    value={area || ''}
                                    onChange={(e) => setArea(Number(e.target.value))}
                                    placeholder="e.g. 1000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
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

                            <div className="space-y-2">
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

                            {unitCategory === 'Shop' && (
                                <div className="space-y-2">
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
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing & Plan Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pricing & Payment Schedule</CardTitle>
                        <CardDescription>Set rates and define payment milestones. All parts must sum to Total Amount.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Rates Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg border">
                            <div className="space-y-2">
                                <Label>Standard Rate</Label>
                                <div className="p-2 bg-muted rounded text-sm text-muted-foreground">
                                    PKR {standardRate.toLocaleString()}/sqft
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Standard Total</Label>
                                <div className="p-2 bg-muted rounded text-sm text-muted-foreground">
                                    PKR {standardTotal.toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-primary font-semibold">Custom Rate (Per SQF)</Label>
                                <Input
                                    type="number"
                                    value={customRate}
                                    onChange={(e) => setCustomRate(Number(e.target.value))}
                                    className="border-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-primary font-semibold">Custom Total Amount</Label>
                                <div className="p-2 bg-primary/5 border border-primary/20 rounded font-bold text-primary">
                                    PKR {customTotal.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Payment Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Booking */}
                            <div className="space-y-2">
                                <Label>Booking Amount</Label>
                                <Input
                                    type="number"
                                    value={bookingAmount}
                                    onChange={(e) => setBookingAmount(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Booking Date</Label>
                                <Input
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                />
                            </div>

                            {/* Down Payment */}
                            <div className="space-y-2">
                                <Label>Down Payment</Label>
                                <Input
                                    type="number"
                                    value={downPayment}
                                    onChange={(e) => setDownPayment(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>DP Due Date</Label>
                                <Input
                                    type="date"
                                    value={downPaymentDate}
                                    onChange={(e) => setDownPaymentDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Installments */}
                            <div className="space-y-2">
                                <Label>Installment Months</Label>
                                <Input
                                    type="number"
                                    value={installmentMonths}
                                    onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Monthly Installment</Label>
                                <Input
                                    type="number"
                                    value={monthlyInstallment}
                                    onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={installmentStartDate}
                                    onChange={(e) => setInstallmentStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Installment Total</Label>
                                <div className="p-2 bg-muted rounded text-sm">
                                    PKR {(monthlyInstallment * installmentMonths).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Possession */}
                            <div className="space-y-2">
                                <Label>Possession Amount</Label>
                                <Input
                                    type="number"
                                    value={possessionAmount}
                                    onChange={(e) => setPossessionAmount(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Possession Date</Label>
                                <Input
                                    type="date"
                                    value={possessionDate}
                                    onChange={(e) => setPossessionDate(e.target.value)}
                                />
                            </div>

                            {/* Validation Display */}
                            <div className="col-span-2 space-y-2">
                                <Label>Validation Check</Label>
                                <div className={`p-2 border rounded-md text-sm font-medium flex justify-between items-center ${Math.abs((bookingAmount + downPayment + (monthlyInstallment * installmentMonths) + possessionAmount) - customTotal) < 100
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                    }`}>
                                    <span>Sum: {formatCurrency(bookingAmount + downPayment + (monthlyInstallment * installmentMonths) + possessionAmount)}</span>
                                    <span>Target: {formatCurrency(customTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PaymentPlanGenerator;
