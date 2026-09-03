import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);

  return <div>API Status: {data || 'Loading...'}</div>;
}

export default App;