import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      themeSwitch={{
        enabled: true,
        mode: "light-dark-system"
      }}
    >
      {children}
    </DocsLayout>
  );
}


