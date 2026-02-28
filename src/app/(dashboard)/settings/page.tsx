import { PageHeader } from '@/components/layout/page-header';
import { SettingsForm } from '@/components/forms/settings-form';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your retirement goals."
      />
      <SettingsForm />
    </div>
  );
}
