import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Clock, Users } from "lucide-react";

interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  department_id: string;
  assigned_to: string;
  created_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  department?: Department;
}

interface TaskStatsProps {
  tasks: Task[];
  departments: Department[];
}

export const TaskStats = ({ tasks, departments }: TaskStatsProps) => {
  const getTotalStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'done').length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const pending = tasks.filter(task => task.status === 'todo').length;
    const overdue = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
    ).length;

    return { total, completed, inProgress, pending, overdue };
  };

  const getPriorityStats = () => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;
    return priorities.map(priority => ({
      priority,
      count: tasks.filter(task => task.priority === priority).length,
      percentage: tasks.length > 0 ? (tasks.filter(task => task.priority === priority).length / tasks.length) * 100 : 0
    }));
  };

  const getDepartmentStats = () => {
    return departments.map(dept => {
      const deptTasks = tasks.filter(task => task.department_id === dept.id);
      const completed = deptTasks.filter(task => task.status === 'done').length;
      const completionRate = deptTasks.length > 0 ? (completed / deptTasks.length) * 100 : 0;
      
      return {
        ...dept,
        totalTasks: deptTasks.length,
        completedTasks: completed,
        completionRate,
        estimatedHours: deptTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0),
        actualHours: deptTasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0)
      };
    });
  };

  const getTotalHours = () => {
    const estimated = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    const actual = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
    return { estimated, actual };
  };

  const stats = getTotalStats();
  const priorityStats = getPriorityStats();
  const departmentStats = getDepartmentStats();
  const hourStats = getTotalHours();

  const priorityColors = {
    low: '#6B7280',
    medium: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444'
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Active tasks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hourStats.estimated}</div>
            <p className="text-xs text-muted-foreground">
              Estimated hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priorityStats.map((stat) => (
              <div key={stat.priority} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: priorityColors[stat.priority] }}
                  />
                  <span className="capitalize font-medium">{stat.priority}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                  <Badge variant="secondary">{stat.count}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {departmentStats.map((dept) => (
              <div key={dept.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="font-medium">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {dept.completedTasks}/{dept.totalTasks} tasks
                    </span>
                    <Badge variant="secondary">
                      {Math.round(dept.completionRate)}% complete
                    </Badge>
                  </div>
                </div>
                <Progress value={dept.completionRate} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Estimated: {dept.estimatedHours}h</span>
                  <span>Actual: {dept.actualHours}h</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};