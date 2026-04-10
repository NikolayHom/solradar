"use client";

export function NetworkMapPlaceholder() {
  return (
    <div className="border border-[#2a2a38] rounded-lg bg-[#111118] p-4">
      <h3 className="text-sm font-medium text-[#9898a8] mb-3">Network Map</h3>
      <div className="h-[200px] rounded bg-[#0a0a0f] border border-dashed border-[#2a2a38] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-1">🗺️</div>
          <p className="text-xs text-[#5a5a6e]">
            Mapbox visualization
          </p>
          <p className="text-[10px] text-[#5a5a6e] mt-1">
            Set NEXT_PUBLIC_MAPBOX_TOKEN to enable
          </p>
        </div>
      </div>
    </div>
  );
}
