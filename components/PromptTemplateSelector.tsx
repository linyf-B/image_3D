import React from 'react';
import { PromptTemplate, TemplateCategory } from '../types';

interface PromptTemplateSelectorProps {
  categories: TemplateCategory[];
  userTemplates: PromptTemplate[]; // User-defined templates are still flat for now
  onSelectTemplate: (template: PromptTemplate) => void;
  selectedTemplateId: string | null;
  disabled: boolean;
  selectedCategory: TemplateCategory | null;
  onSelectCategory: (category: TemplateCategory | null) => void;
}

const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({
  categories,
  userTemplates,
  onSelectTemplate,
  selectedTemplateId,
  disabled,
  selectedCategory,
  onSelectCategory,
}) => {
  const allCategorizedTemplates = selectedCategory ? selectedCategory.templates : [];

  // Combine user templates into a 'Custom' category if no specific category is selected
  // Or display them alongside built-in ones if within a category (though typically user templates are global)
  // For now, let's add a "自定义" category at the top level.
  const customTemplatesCategory: TemplateCategory = {
    id: 'custom-templates',
    name: '自定义模板',
    description: '您创建的个性化模板列表。',
    templates: userTemplates,
  };

  const currentCategories = userTemplates.length > 0 ? [...categories, customTemplatesCategory] : categories;


  if (selectedCategory) {
    // Display templates within the selected category
    const templatesToDisplay = selectedCategory.templates;

    return (
      <div className="flex flex-col h-full">
        <button
          onClick={() => onSelectCategory(null)}
          className="flex items-center mb-4 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors self-start text-sm font-medium"
          disabled={disabled}
          aria-label="返回分类列表"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回分类
        </button>
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 scrollbar-thumb-blue-400 scrollbar-track-blue-100 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templatesToDisplay.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={`
                  p-3 border-2 rounded-xl text-left transition-all duration-200
                  ${selectedTemplateId === template.id
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 shadow-lg'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-md'}
                  ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}
                  flex flex-col
                `}
                disabled={disabled}
                aria-pressed={selectedTemplateId === template.id}
                aria-label={`选择 ${template.name} 模板`}
              >
                <p className="font-medium text-gray-800 text-base mb-1">{template.name}</p>
                <p className="text-xs text-gray-600 flex-grow">{template.description}</p>
                {template.isUserDefined && (
                  <span className="mt-2 text-xs text-purple-600 font-semibold bg-purple-100 px-2 py-0.5 rounded-full self-start">
                    自定义
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    // Display categories
    return (
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 scrollbar-thumb-blue-400 scrollbar-track-blue-100 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className={`
                p-4 border-2 rounded-xl text-left transition-all duration-200
                bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 shadow-md
                ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}
                flex flex-col h-full
              `}
              disabled={disabled}
              aria-label={`浏览 ${category.name} 分类`}
            >
              <p className="font-bold text-gray-800 text-lg mb-1">{category.name}</p>
              <p className="text-sm text-gray-600 flex-grow">{category.description}</p>
              <span className="mt-2 text-xs text-blue-500 font-medium">
                ({category.templates.length} 个模板)
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
};

export default PromptTemplateSelector;