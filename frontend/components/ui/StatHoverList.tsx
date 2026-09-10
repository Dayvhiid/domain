import React from 'react';

interface StatHoverListProps {
    title: string;
    items: string[];
    isVisible: boolean;
}

export default function StatHoverList({ title, items, isVisible }: StatHoverListProps) {
    if (!isVisible) return null;

    return (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-100 bg-white/50">
                <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            </div>
            <div className="max-height-[240px] overflow-y-auto p-2">
                {items.length > 0 ? (
                    <ul className="space-y-1">
                        {items.map((item, index) => (
                            <li
                                key={index}
                                className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50/50 rounded-lg transition-colors cursor-default"
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="px-3 py-4 text-xs text-gray-400 text-center italic">
                        No items to display
                    </div>
                )}
            </div>
        </div>
    );
}
