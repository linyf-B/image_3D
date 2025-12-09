import React, { useState, FormEvent } from 'react';
import { PromptTemplate, TemplateCategory } from '../types';

interface AddTemplateModalProps {
  onClose: () => void;
  onSave: (template: Omit<PromptTemplate, 'id' | 'isUserDefined'>, categoryId?: string) => void;
  disabled: boolean;
  availableCategories: TemplateCategory[]; // New prop
}

const AddTemplateModal: React.FC<AddTemplateModalProps> = ({ onClose, onSave, disabled, availableCategories }) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined); // New state for category
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !prompt.trim()) {
      setError("模板名称和提示词是必填项。");
      return;
    }

    onSave({ name, description, prompt }, selectedCategoryId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">添加自定义模板</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          aria-label="关闭"
          disabled={disabled}
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
              模板名称: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              disabled={disabled}
              required
              aria-required="true"
              placeholder="例如：赛博朋克风格"
            />
          </div>
          <div>
            <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
              模板描述:
            </label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md resize-y min-h-[60px] focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              disabled={disabled}
              placeholder="例如：将图片转换为霓虹灯效的赛博朋克艺术风格。"
            ></textarea>
          </div>
          <div>
            <label htmlFor="template-prompt" className="block text-sm font-medium text-gray-700 mb-1">
              提示词: <span className="text-red-500">*</span>
            </label>
            <textarea
              id="template-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md resize-y min-h-[100px] focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              disabled={disabled}
              required
              aria-required="true"
              placeholder="例如：Transform the image into a cyberpunk aesthetic with neon lights and futuristic elements."
            ></textarea>
          </div>
          <div>
            <label htmlFor="template-category" className="block text-sm font-medium text-gray-700 mb-1">
              所属分类:
            </label>
            <select
              id="template-category"
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || undefined)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              disabled={disabled}
            >
              <option value="">(无分类 / 归入自定义)</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              如果您不选择分类，模板将显示在“自定义模板”类别中。
            </p>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              保存模板
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTemplateModal;