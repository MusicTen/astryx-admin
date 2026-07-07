import { Button } from '@astryxdesign/core/Button';
import { AppProviders } from './providers';

export function App() {
  return (
    <AppProviders>
      <Button label="astryx ok" variant="primary" />
    </AppProviders>
  );
}
