export type AppCategory = "沟通协作" | "开发工具" | "支付" | "自动化" | "数据分析";

export interface MockIntegration {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  icon: string;
  isConnected: boolean;
}

export function createSeedIntegrations(): MockIntegration[] {
  return [
    { id: "slack", name: "Slack", description: "团队即时消息与通知同步", category: "沟通协作", icon: "MessageSquare", isConnected: true },
    { id: "discord", name: "Discord", description: "社区与团队语音协作", category: "沟通协作", icon: "MessagesSquare", isConnected: false },
    { id: "github", name: "GitHub", description: "代码托管与 CI 状态同步", category: "开发工具", icon: "Github", isConnected: true },
    { id: "linear", name: "Linear", description: "研发任务与迭代跟踪", category: "开发工具", icon: "ListChecks", isConnected: false },
    { id: "figma", name: "Figma", description: "设计稿评审与交付同步", category: "开发工具", icon: "Figma", isConnected: false },
    { id: "stripe", name: "Stripe", description: "订阅账单与支付对账", category: "支付", icon: "CreditCard", isConnected: true },
    { id: "paypal", name: "PayPal", description: "跨境收款与结算", category: "支付", icon: "Wallet", isConnected: false },
    { id: "zapier", name: "Zapier", description: "跨应用自动化工作流", category: "自动化", icon: "Workflow", isConnected: false },
    { id: "n8n", name: "n8n", description: "自托管自动化编排", category: "自动化", icon: "GitBranch", isConnected: false },
    { id: "google-analytics", name: "Google Analytics", description: "产品流量与转化分析", category: "数据分析", icon: "BarChart3", isConnected: true },
    { id: "mixpanel", name: "Mixpanel", description: "用户行为漏斗分析", category: "数据分析", icon: "PieChart", isConnected: false },
  ];
}
