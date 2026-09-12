/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';

function getLocation() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, queryString = ''] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(queryString) };
}

export function navigate(to) {
  window.location.hash = to;
}

export function useRoute() {
  const [location, setLocation] = useState(getLocation);

  useEffect(() => {
    const onHashChange = () => setLocation(getLocation());
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
