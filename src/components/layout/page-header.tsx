interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <div className="text-muted-foreground text-sm mt-1">{description}</div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
