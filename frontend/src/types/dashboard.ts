export interface DashboardStat {
  title: string;
  value: string | number;
  icon: string;
  trend: string;
  color: string;
  bgColor: string;
}

export interface Activity {
  action: string;
  item: string;
  time: string;
}

export interface ContentOverviewItem {
  icon: string;
  title: string;
  description: string;
  value: string | number;
}

export interface DashboardStats {
  stats: DashboardStat[];
  recentActivities: Activity[];
  contentOverview: ContentOverviewItem[];
}
