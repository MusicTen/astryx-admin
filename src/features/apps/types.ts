export type AppCategory = "沟通协作" | "开发工具" | "支付" | "自动化" | "数据分析";

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  icon: string;
  isConnected: boolean;
}

export interface IntegrationListResult {
  items: Integration[];
}
