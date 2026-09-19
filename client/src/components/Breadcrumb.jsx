import { Link } from '../router';

export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className="breadcrumb-nav flex items-center text-xs sm:text-sm my-3 py-2" aria-label="Breadcrumb">
      <ol className="breadcrumb-list flex items-center flex-wrap gap-1.5 list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="breadcrumb-item inline-flex items-center">
              {index > 0 && (
                <span className="breadcrumb-separator text-gray-400 mx-1.5 select-none" aria-hidden="true">
                  ›
                </span>
              )}
              {isLast || !item.to ? (
                <span className="breadcrumb-current text-gray-800 font-semibold truncate max-w-[240px] sm:max-w-md" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="breadcrumb-link text-[#0071e3] hover:underline hover:text-[#005bb5] transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
