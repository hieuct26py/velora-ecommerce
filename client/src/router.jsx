/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';

function getLocation() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, queryString = ''] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(queryString) };
}

export function navigate(to) {
  const isAlreadyAtTarget = window.location.hash === `#${to}` || (window.location.hash === '' && to === '/');
  window.location.hash = to;
  if (isAlreadyAtTarget || to === '/') {
    if (!to.includes('scroll=catalog') && !to.includes('category=')) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
}

export function useRoute() {
  const [location, setLocation] = useState(getLocation);

  useEffect(() => {
    const onHashChange = () => {
      const nextLocation = getLocation();
      setLocation(nextLocation);
      // Khi quay lại trang chủ hoặc chuyển trang mà không yêu cầu vị trí scroll cụ thể, luôn cuộn lên đầu trang
      if (!nextLocation.query.get('scroll') && !nextLocation.query.get('category')) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return location;
}

export function useNavigate() {
  return navigate;
}

export function Link({ to, children, ...props }) {
  const handleClick = (event) => {
    if (props.onClick) props.onClick(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };

  return <a href={`#${to}`} {...props} onClick={handleClick}>{children}</a>;
}
