import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, BarChart3, Users, Target, FileText, TrendingUp, PenTool, Coins, UserCircle } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const applications = [
    {
      id: "sales",
      title: "Sales Management",
      description: "Manage property sales, customers, payment plans, and track progress towards sales targets.",
      icon: BarChart3,
      color: "bg-blue-500",
      features: ["Property Sales", "Customer Management", "Payment Tracking", "Sales Reports"]
    },
    {
      id: "crm",
      title: "B&B CRM",
      description: "Complete customer relationship management with lead tracking, conversations, and reminders.",
      icon: Users,
      color: "bg-green-500",
      features: ["Lead Management", "Stage Tracking", "Conversations", "Reminders & Tasks"]
    },
    {
      id: "tasks",
      title: "Task Manager",
      description: "Organize tasks, track progress, and manage department workflows efficiently.",
      icon: FileText,
      color: "bg-purple-500",
      features: ["Task Boards", "Department Management", "Priority Tracking", "Team Collaboration"]
    },
    {
      id: "accounting",
      title: "Accounting",
      description: "Manage general ledger, track expenses, and generate comprehensive financial reports.",
      icon: TrendingUp,
      color: "bg-orange-500",
      features: ["Journal Entries", "T-Accounts", "P&L Statement", "Balance Sheet"]
    },
    {
      id: "content",
      title: "Content Production",
      description: "Plan, create, approve, and schedule all social media and marketing content.",
      icon: PenTool,
      color: "bg-pink-500",
      features: ["Content Planning", "Approval Workflow", "Social Scheduler", "AI Script Generator"]
    },
    {
      id: "attendance",
      title: "Attendance",
      description: "Track team attendance, working hours, and manage employee check-ins.",
      icon: Target,
      color: "bg-indigo-500",
      features: ["Daily Attendance", "Time Tracking", "Leave Management", "Monthly Reports"]
    },
    {
      id: "commission-management",
      title: "Commission Management",
      description: "Password-protected module to track and manage all agent, dealer, and COO commissions.",
      icon: Coins,
      color: "bg-red-500",
      features: ["Commission Tracking", "Release Management", "Analytics", "Reports"],
      protected: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12 pt-12">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-16 w-16 text-primary mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">B&B Builders</h1>
              <p className="text-xl text-muted-foreground">Business Management Suite</p>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Your comprehensive platform for managing property sales and customer relationships. 
            Choose the application you need to get started.
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="gap-2"
          >
            <UserCircle className="h-4 w-4" />
            Employee Login / Sign Up
          </Button>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {applications.map((app) => {
            const Icon = app.icon;
            return (
              <Card key={app.id} className={`relative group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 ${app.protected ? 'border-red-500/30' : ''}`} onClick={(e) => {
                e.stopPropagation();
                navigate(`/${app.id}`);
              }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${app.color} text-white`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {app.title}
                        {app.protected && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">Protected</span>}
                      </CardTitle>
                      <CardDescription className="text-base">{app.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Key Features</h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {app.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Target className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full mt-6 group-hover:bg-primary/90" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${app.id}`);
                  }}>
                    Launch {app.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 B&B Builders. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;