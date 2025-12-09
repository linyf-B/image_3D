import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onLoadHistoryItem: (entry: HistoryEntry) => void;
  onDeleteHistoryItem: (id: string) => void; // New prop for deleting history items
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoadHistoryItem, onDeleteHistoryItem }) => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">历史记录</h2>
      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">暂无编辑历史。</p>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100"> {/* Added scrollbar styling */}
          <div className="grid grid-cols-1 gap-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col items-start"
              >
                <div className="flex gap-4 w-full mb-3">
                  <div className="flex-shrink-0">
                    <img
                      src={`data:${entry.originalImageMimeType};base64,${entry.originalImageBase64}`}
                      alt="Original"
                      className="w-16 h-16 object-cover rounded-md border border-gray-100"
                      title="原始图片"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <img
                      src={`data:image/png;base64,${entry.editedImageBase64}`}
                      alt="Edited"
                      className="w-16 h-16 object-cover rounded-md border border-gray-100"
                      title="编辑后的图片"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate mb-1" title={entry.prompt}>
                      提示词: {entry.prompt}
                    </p>
                    {entry.templateName && (
                      <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-1">
                        模板: {entry.templateName}
                      </p>
                    )}
                    {entry.categoryName && (
                      <p className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block ml-1 mb-1">
                        分类: {entry.categoryName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex w-full gap-2">
                  <button
                    onClick={() => onLoadHistoryItem(entry)}
                    className="flex-grow py-2 px-4 bg-indigo-500 text-white font-medium rounded-md text-sm hover:bg-indigo-600 transition-colors disabled:bg-indigo-300"
                    aria-label={`加载历史记录：${entry.prompt}`}
                  >
                    加载到编辑器
                  </button>
                  <button
                    onClick={() => onDeleteHistoryItem(entry.id)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                    aria-label="删除此历史记录"
                    title="删除此历史记录"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;