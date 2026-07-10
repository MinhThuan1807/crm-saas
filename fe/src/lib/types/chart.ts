export interface TooltipPayloadItem {
  name: string;
  value: number | string;
  dataKey?: string | number;
  fill?: string;
  color?: string;
  stroke?: string;
  payload?: Record<string, unknown>;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}
