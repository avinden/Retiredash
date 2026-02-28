import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Welcome to RetireView"
        description="Your personal retirement readiness dashboard"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Retirement Target</CardTitle>
            <CardDescription>Based on your spending goals</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">--</p>
            <p className="text-sm text-muted-foreground">
              Set up your goals in Settings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Savings</CardTitle>
            <CardDescription>Total across all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">--</p>
            <p className="text-sm text-muted-foreground">
              Add accounts to get started
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>How close you are to your goal</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">--%</p>
            <p className="text-sm text-muted-foreground">
              Coming in Milestone 2
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
