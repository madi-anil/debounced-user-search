import { useState, useEffect } from "react";
import "./App.css";

const searchCache = new Map();

export default function App() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (searchCache.has(trimmedQuery)) {
      setUsers(searchCache.get(trimmedQuery));
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const timerId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
       const endpoint = `https://dummyjson.com/users/search?q=${encodeURIComponent(trimmedQuery)}`;
        const response = await fetch(endpoint, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        const results = data.users || [];

        searchCache.set(trimmedQuery, results);
        setUsers(results);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to fetch users");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timerId);
      controller.abort();
    };
  }, [query]);

 const highlightMatch = (text, match) => {
    if (!match.trim()) return text;
    const escapedMatch = match.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedMatch})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === match.toLowerCase().trim() ? (
        <strong key={index} style={{ backgroundColor: "#ffeb3b" }}>
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>Debounced User Search</h2>

      <input
        type="text"
        placeholder="Search users by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          boxSizing: "border-box",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginBottom: "1rem",
        }}
      />

      {loading && <p style={{ color: "#007acc", fontWeight: "bold" }}>Loading…</p>}

      {error && !loading && (
        <p style={{ color: "#dc3545", backgroundColor: "#f8d7da", padding: "0.5rem", borderRadius: "4px" }}>
          Error: {error}
        </p>
      )}

      {!loading && !error && !query.trim() && (
        <p style={{ color: "#777" }}>Type to search</p>
      )}

      {!loading && !error && query.trim() && users.length === 0 && (
        <p style={{ color: "#777" }}>No users found for "{query}".</p>
      )}

      {!loading && !error && users.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {users.map((user) => {
            const fullName = `${user.firstName} ${user.lastName}`;
            return (
              <li
                key={user.id}
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid #eee",
                  marginBottom: "0.25rem",
                }}
              >
                <div style={{ fontSize: "1.05rem" }}>
                  {highlightMatch(fullName, query)}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  {user.email} • {user.address?.city || "Unknown city"}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
  }