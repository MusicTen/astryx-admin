// 列表接口统一响应信封：所有返回集合的端点一律 { items, total }
export interface PageResult<T> {
  items: T[];
  total: number;
}
