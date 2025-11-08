import { DashboardStats, Activity, ContentOverviewItem, DashboardStat } from '@/types/dashboard';
import dashboardData from './data/dashboard-stats.json';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let dashboardStats: DashboardStats = { ...dashboardData };

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(300);
    return { ...dashboardStats };
  },

  async getStats(): Promise<DashboardStat[]> {
    await delay(200);
    return [...dashboardStats.stats];
  },

  async getRecentActivities(limit?: number): Promise<Activity[]> {
    await delay(200);
    const activities = [...dashboardStats.recentActivities];
    return limit ? activities.slice(0, limit) : activities;
  },

  async getContentOverview(): Promise<ContentOverviewItem[]> {
    await delay(200);
    return [...dashboardStats.contentOverview];
  },

  async updateStat(title: string, value: string | number): Promise<void> {
    await delay(300);
    const stat = dashboardStats.stats.find(s => s.title === title);
    if (stat) {
      stat.value = value;
    }
  },

  async addActivity(activity: Activity): Promise<void> {
    await delay(300);
    dashboardStats.recentActivities.unshift(activity);
    if (dashboardStats.recentActivities.length > 10) {
      dashboardStats.recentActivities.pop();
    }
  },
};
