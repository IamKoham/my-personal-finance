import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { DateRangeFilter } from './DateRangeFilter';

const DATE_FILTER_PAGES = ['/', '/spending'];

interface Props {
  title: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: Props) {
  const { pathname } = useLocation();
  const showFilter = DATE_FILTER_PAGES.includes(pathname);

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-950 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-white">{title}</h1>
      </div>
      {showFilter && <DateRangeFilter page={pathname} />}
    </header>
  );
}
