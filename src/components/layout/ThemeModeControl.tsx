import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { useUiStore, type ThemeMode } from '../../stores/ui';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
  { value: 'system', label: '系统' },
];

export function ThemeModeControl() {
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);
  return (
    <SegmentedControl
      label="主题模式"
      size="sm"
      value={themeMode}
      onChange={(value) => setThemeMode(value as ThemeMode)}
    >
      {MODES.map((mode) => (
        <SegmentedControlItem key={mode.value} value={mode.value} label={mode.label} />
      ))}
    </SegmentedControl>
  );
}
