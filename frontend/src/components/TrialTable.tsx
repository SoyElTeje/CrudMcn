import React, { useEffect, useState } from "react";
import axios from "axios";
// API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface TrialData {
  database: string;
  table: string;
  count: number;
  data: any[];
}

export const TrialTable: React.FC = () => {
  const [data, setData] = useState<TrialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/trial/table`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data || !data.data.length)
    return <div className="p-4">No data found.</div>;

  const columns = Object.keys(data.data[0]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">
        Trial Table: {data.table} (DB: {data.database})
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border px-2 py-1 bg-gray-100 text-xs text-left"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.data.map((row, i) => (
              <tr key={i} className="even:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="border px-2 py-1 text-xs">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-sm text-gray-500">Rows: {data.count}</div>
    </div>
  );
};
