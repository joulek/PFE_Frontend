// components/ActivityFeed.jsx
// À utiliser dans TabGlobal du dashboard — remplace les données hardcodées
"use client";

import { useActivity } from "../hooks/useDashboard";

export default function ActivityFeed({ limit = 10 }) {
  const { items, loading, error, unread, reload } = useActivity({ limit });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Activité récente
          </h2>
          {unread > 0 && (
            <span className="bg-[#4E8F2F] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        <button
          onClick={reload}
          className="text-xs text-gray-400 hover:text-[#4E8F2F] dark:hover:text-emerald-400 transition"
        >
          Actualiser
        </button>
      </div>

      {/* États */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-32" />
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-400 py-2">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">Aucune activité récente.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map(item => (
            <div
              key={item._id}
              className={`flex items-center gap-3 py-3 transition cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-700/30 rounded-xl px-2 -mx-2 ${
                !item.read ? "opacity-100" : "opacity-75"
              }`}
              onClick={() => item.link && (window.location.href = item.link)}
            >
              {/* Avatar avec initiales */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.color}`}
              >
                {item.initials}
              </div>

              {/* Texte */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.action}
                </p>
              </div>

              {/* Temps + point non lu */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-[#4E8F2F] flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}