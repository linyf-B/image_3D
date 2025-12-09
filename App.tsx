import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import PromptTemplateSelector from './components/PromptTemplateSelector';
import AddTemplateModal from './components/AddTemplateModal';
import HistoryPanel from './components/HistoryPanel';
import PromptSuggestions from './components/PromptSuggestions';
import UnifiedImageDisplay from './components/UnifiedImageDisplay'; // New unified image component
import MergeImageModal from './components/MergeImageModal'; // New merge image modal
import { editImage, getPromptSuggestions } from './services/geminiService';
import { PromptTemplate, HistoryEntry, TemplateCategory, BlendMode } from './types';
import { mergeImagesWithBlendMode } from './utils/imageProcessor';

// Define prompt templates categorized
const INITIAL_CATEGORIZED_TEMPLATES: TemplateCategory[] = [
  {
    id: 'id-photo',
    name: '证件照',
    description: '专业证件照编辑，包括背景更换和尺寸调整。',
    templates: [
      {
        id: 'id-photo-bg-change',
        name: '证件照换背景',
        description: '将证件照的背景替换为纯白色、蓝色或红色，并使其均匀。',
        prompt: '将图片中的人像从背景中精确抠出，并智能地将其背景替换为纯蓝色，背景颜色应均匀无暇，没有噪点或渐变。确保人像边缘清晰自然，与新背景无缝融合，生成一张标准证件照风格的图片。',
      },
      {
        id: 'id-photo-resize',
        name: '证件照尺寸调整',
        description: '调整证件照的尺寸和比例，使其符合标准规格。',
        prompt: '将这张照片中的人像剪裁并调整为标准二寸（3.5cm x 4.9cm）证件照的尺寸和比例。确保人脸居中，头部占据画面约2/3的高度，画面清晰度不受影响，生成一张符合中国居民身份证或护照标准的图片。',
      },
      {
        id: 'id-photo-beautify',
        name: '证件照美颜',
        description: '对证件照进行轻度美颜，去除瑕疵，保留自然。',
        prompt: '对这张证件照中的人脸进行轻度美颜处理。智能平滑皮肤，去除痘痘、斑点等瑕疵，同时保留面部细节和自然纹理，避免过度磨皮。轻微提亮肤色，使人像看起来更精神、自然。',
      },
    ],
  },
  {
    id: 'figurine',
    name: '手办',
    description: '将图片中的人物或角色转换为高质量的3D手办效果。',
    templates: [
      {
        id: '3d-figurine-high-quality',
        name: '高质量手办制作',
        description: '将主体制作为1/7比例的高质量手办，摆放在办公桌上，具有景深效果。',
        prompt: '将图片中的主要人物或角色模型化，制作成一个1/7比例的高质量手办。手办的动作、服装、发型和面部表情应与原图保持高度一致，栩栩如生。将其摆放在一个精致的木质办公桌上，手办立于晶莹透明的圆形亚克力底座。桌左侧放置一台运行中的大型拓竹 H2S 彩色 3D 打印机，内部正在打印相同手办的微缩模型。桌右侧放置一个透明的BANDAI风格展示盒，盒中展示另一个手办，盒子正面印有原图的人物立绘。整体环境渲染应写实细腻，具有明显的光学景深效果，背景模糊，前景清晰，营造出收藏家精致的私人工作室氛围。',
      },
      {
        id: '3d-figurine-q-version',
        name: 'Q版手办',
        description: '将图片主体转换为可爱的Q版手办形象，具有圆润的特征。',
        prompt: '将图片中的人物或角色转换为可爱的Q版（Chibi）手办形象。其特征应被大幅卡通化，头部比例相对于身体显著增大，身体和四肢则缩短并圆润化，整体呈现出憨态可掬、萌趣十足的风格。手办材质表现为光滑、色彩鲜艳的塑料质感，摆放在一个简约的白色底座上，背景虚化以突出主体。',
      },
    ],
  },
  {
    id: 'pet',
    name: '宠物',
    description: '为宠物图片添加各种艺术风格或趣味效果。',
    templates: [
      {
        id: 'pet-cartoon',
        name: '卡通宠物',
        description: '将宠物图片转换为可爱的卡通画风。',
        prompt: '将图片中的宠物转换为可爱的美式卡通画风。线条应粗犷有力，色彩鲜明饱和，表情夸张且生动活泼，使其看起来像动画片或儿童插画中的角色，充满童趣和活力。',
      },
      {
        id: 'pet-art-style',
        name: '艺术画风宠物',
        description: '将宠物图片转换为印象派油画或水彩画风格。',
        prompt: '将图片中的宠物转换为一幅梵高风格的印象派油画作品。运用厚重、粗犷的螺旋状笔触和明亮饱和的色彩，捕捉宠物独特的姿态和神韵，使其充满强烈的艺术感染力，背景也应随之风格化。',
      },
      {
        id: 'pet-futuristic',
        name: '未来感宠物',
        description: '将宠物图片融入赛博朋克或未来科技感场景。',
        prompt: '将图片中的宠物主体保留，并将其放置在一个充满赛博朋克风格的未来城市景观中。背景应包含高耸的金属建筑、闪烁的霓虹灯牌、空中交通工具和科技感十足的街道。宠物身上可以有微弱的发光线条或机械义肢，整体画面应呈现出炫酷、神秘的未来世界氛围。',
      },
    ],
  },
  {
    id: 'anime',
    name: '动漫',
    description: '将普通图片转换为各种动漫风格。',
    templates: [
      {
        id: 'anime-japanese',
        name: '转日漫风格',
        description: '将图片转换为日本动漫的画风，具有大眼睛和细腻线条。',
        prompt: '将这张图片转换为经典的日本动漫（Anime）风格。人物应具有大而富有神采的眼睛、柔和细腻的肤色、精致的五官和纤细的轮廓。背景细节应丰富且充满层次感，色彩饱和且充满活力，整体画面营造出如动画电影般的梦幻感和二次元美学。',
      },
      {
        id: 'anime-american',
        name: '转美漫风格',
        description: '将图片转换为美式漫画的画风，具有粗犷线条和强烈阴影。',
        prompt: '将这张图片转换为经典的美式漫画（Comic Book）风格。画面应具有粗犷有力的黑色描边线条、夸张的形体比例和强烈的明暗阴影对比。色彩鲜明大胆，充满动感和冲击力，仿佛是超级英雄漫画中的一帧，展现出强烈的视觉表现力。',
      },
      {
        id: 'anime-chibi',
        name: '转Q版动漫',
        description: '将图片中的人物或物体转换为Q版（Chibi）动漫风格。头部放大，身体缩小，四肢短粗，整体造型圆润可爱。眼睛大而亮，表情纯真或搞怪，颜色鲜艳明快，营造出萌趣十足的二次元可爱世界。',
        prompt: '将图片中的人物或核心物体转换为Q版（Chibi）动漫风格。头部比例相对于身体显著增大，五官、身体和四肢则缩短并圆润化，整体呈现出卡通化、萌趣十足的形象。眼神应灵动可爱，表情纯真或带有一丝搞怪，色彩鲜艳明快，背景虚化以突出主体，营造出活泼、可爱的二次元世界。', // Added prompt
      },
    ],
  },
  {
    id: 'meme',
    name: '表情包',
    description: '快速生成各种有趣、富有创意的表情包。',
    templates: [
      {
        id: 'meme-nine-grid',
        name: '九宫格表情包',
        description: '将图片处理成九宫格形式，每个格子有不同的趣味表情。',
        prompt: '将图片中的主要人物或动物表情进行九宫格变化处理。在保持主体一致性的前提下，将原始表情进行微调，使其在九个格子里分别展现出从开心到困惑、从惊讶到搞怪等九种不同但都充满趣味和喜感的表情或姿态。每格底部可配简洁的短语。',
      },
      {
        id: 'meme-animated',
        name: '动漫化表情包',
        description: '将图片主体动漫化，并配上搞怪文字。',
        prompt: '将图片中的人物或核心物体进行动漫化处理，使其成为一个具有日漫或美漫风格的可爱卡通角色。突出其搞笑的表情或姿态，并为其底部配上一句流行、诙谐的中文动漫梗或网络流行语，生成一个充满二次元幽默感的表情包。',
      },
      {
        id: 'meme-weird',
        name: '奇怪表情',
        description: '将图片主体生成奇怪或夸张的表情包。',
        prompt: '将图片中的人物或动物的表情进行极端夸张和扭曲，使其呈现出一种令人捧腹的奇怪、荒诞或超现实感。面部特征可以被拉伸、变形，添加非现实元素，并配上恰当的无厘头中文文字，生成一个充满视觉冲击力和黑色幽默的表情包。',
      },
    ],
  },
  {
    id: 'stylized-filters',
    name: '风格化滤镜',
    description: '为图片应用一系列预设的风格化滤镜，改变其艺术风格或氛围。',
    templates: [
      {
        id: 'retro-filter',
        name: '复古滤镜',
        description: '为图片添加复古滤镜效果，使其看起来像70年代拍摄的照片，具有温暖的色调和颗粒感。',
        prompt: '为这张图片添加经典的70年代复古胶片滤镜效果。确保画面整体呈现温暖的棕褐色调，色彩饱和度略微降低，并引入细微的胶片颗粒感和轻微的漏光效果。让画面充满怀旧氛围，仿佛在泛黄的旧照片中重现，具有浓郁的历史感。',
      },
      {
        id: 'filter-cinematic',
        name: '电影感滤镜',
        description: '为图片添加电影级的色彩分级和光影效果，营造史诗感。',
        prompt: '为图片应用电影级的色彩分级（Color Grading），调整对比度、饱和度和色调，使其具有宽银幕电影的深邃感和戏剧性光影效果。特别是暗部应呈现蓝绿色调，亮部偏暖，营造出磅礴大气、富有叙事感的史诗大片般质感。',
      },
      {
        id: 'filter-watercolor',
        name: '水彩画效果',
        description: '将图片转换为柔和、富有流动感的水彩画风格。',
        prompt: '将图片转换为柔和、透明且富有流动感的水彩画风格。模拟水彩颜料在纸上自然晕染的效果，色彩过渡平滑细腻，物体边缘略带模糊，整体画面呈现出清新、梦幻且充满艺术气息的湿润感。',
      },
      {
        id: 'filter-neon-glow',
        name: '霓虹光影',
        description: '为图片添加充满未来感的霓虹光晕和赛博朋克色彩。',
        prompt: '为图片添加充满未来感的霓虹光晕和赛博朋克风格的色彩。画面应有明显的蓝色、紫色、粉色和青绿色调，从物体边缘或画面深处散发出强烈的电光和霓虹灯光效，营造出迷幻、高科技且略带颓废的都市夜景氛围。',
      },
      {
        id: 'style-transfer-impressionist',
        name: '印象派风格',
        description: '将图片转换为梵高风格的印象派画作。',
        prompt: '将这张图片完全转换为文森特·梵高（Vincent van Gogh）标志性的印象派画作风格。画面应充满强劲的螺旋状笔触感、流动的线条和明亮饱和的色彩，尤其是天空和光影部分，展现出独特的艺术韵味和强烈的情感张力，如同“星月夜”般的视觉效果。',
      },
      {
        id: 'apply-sketch-effect',
        name: '素描效果',
        description: '将图片转换为逼真的铅笔素描效果。',
        prompt: '将这张图片转换为高度逼真的铅笔素描效果。注重线条的粗细变化、阴影的层次感和素描的质感，模拟手绘铅笔画的精细与艺术性，仿佛由专业画师在素描纸上勾勒而成。画面应以黑白灰为主，线条干净有力。',
      },
      {
        id: 'convert-to-oil-painting',
        name: '油画效果',
        description: '将图片转换为经典油画的风格，具有厚重的笔触和丰富的色彩。',
        prompt: '将这张图片转换为一幅经典的写实主义油画风格作品。画面应呈现出厚重、有质感的笔触，色彩浓郁且层次丰富，光影对比强烈。模拟油画颜料的纹理和光泽，让整张图片散发出博物馆藏品的艺术气息，如同大师亲手绘制。',
      },
      {
        id: 'add-lens-flare',
        name: '添加镜头光晕',
        description: '在图片中添加自然、柔和的镜头光晕效果，增强氛围感。',
        prompt: '在图片中合适的位置（例如阳光方向）添加自然、柔和且具有电影感的镜头光晕效果。光晕应呈圆形或条纹状，与光源方向一致，不突兀，能有效增强画面的氛围感和视觉美感，营造出梦幻、温暖或阳光普照的意境。',
      },
      {
        id: 'add-vignette',
        name: '添加暗角',
        description: '在图片边缘添加柔和的暗角效果，将视线引导至中心。',
        prompt: '为图片的四个边缘添加柔和自然的暗角（Vignette）效果。暗角应逐渐向中心过渡，轻微加深边缘亮度，从而将观者的视线有效引导至画面的中心焦点，增强作品的艺术感和构图深度，营造出电影镜头下的视觉效果。',
      },
      {
        id: 'black-and-white',
        name: '黑白效果',
        description: '将图片转换为经典的黑白照片，具有高对比度。',
        prompt: '将这张图片转换为经典的黑白摄影作品。着重于高对比度、丰富的灰度层次以及深邃的阴影和明亮的高光，以凸显画面的结构、纹理和情感，呈现出永恒的艺术感和戏剧性效果。',
      },
      {
        id: 'enhance-colors',
        name: '色彩增强',
        description: '增强图片色彩的饱和度和鲜艳度，使其更加生动。',
        prompt: '全面增强图片中的色彩表现力。提升整体饱和度和鲜艳度，使颜色更加生动、明亮，同时保持色彩的自然和谐，避免过曝或失真，让画面更具视觉冲击力，但不过于卡通化。',
      },
      {
        id: 'apply-bokeh-effect',
        name: '背景虚化 (散景)',
        description: '为图片的背景添加柔和的散景虚化效果，使主体更突出。',
        prompt: '对图片的背景应用柔和、电影感的散景（Bokeh）虚化效果。背景应模糊且光斑圆润，形成奶油般的虚化效果。确保主体保持清晰锐利，从而在视觉上将其从背景中分离出来，突出焦点，营造专业摄影作品的景深感。',
      },
    ],
  },
  {
    id: 'general-editing', // Catch-all for other general editing tasks
    name: '通用编辑',
    description: '基础的图片编辑功能，如背景替换、物体移除、智能抠图等。',
    templates: [
      {
        id: 'remove-person',
        name: '移除人物',
        description: '移除图片背景中的任何人物。',
        prompt: '智能识别并完全移除图片背景中出现的所有人物。在移除后，利用AI智能算法对受影响的区域进行内容感知填充和重建，确保背景得到无缝、自然地恢复，不留下任何人物存在的痕迹或视觉瑕疵。',
      },
      {
        id: 'remove-watermark',
        name: '去除水印',
        description: '移除图片上所有的水印，并无缝恢复背景内容。',
        prompt: '请精确识别并彻底移除图片上存在的所有水印、文本、标志或不透明覆盖物。在移除后，利用AI智能算法对受影响的区域进行内容感知填充和修复，使背景恢复到原始的自然状态，不留任何编辑痕迹。',
      },
      {
        id: 'restore-old-photo',
        name: '老照片修复',
        description: '修复并上色褪色的老照片，提升清晰度，移除划痕。',
        prompt: '对这张褪色、模糊、破损的老照片进行全面修复。提高整体清晰度和锐度，移除所有划痕、污渍、折痕及其他物理损伤。同时，智能地为黑白照片添加自然、逼真的色彩，使其焕发新生，保留原始情感的同时呈现现代质感。',
      },
      {
        id: 'change-background-beach',
        name: '更换背景：海滩',
        description: '将图片的背景替换为阳光明媚的热带海滩。',
        prompt: '将图片中的主体精确抠出并保留，将其背景替换为一个阳光明媚、充满活力的热带海滩场景。新背景应包含碧蓝的海水、金色的沙滩、摇曳的棕榈树，以及明亮自然的阳光效果，使主体与新环境完美融合，光影一致。',
      },
      {
        id: 'futuristic-cityscape',
        name: '未来城市景观',
        description: '将图片背景替换为充满霓虹灯和高科技建筑的未来城市景观。',
        prompt: '将图片中的主体精确抠出并保留，将其背景替换为一座充满未来感的赛博朋克城市景观。新背景应包含高耸的摩天大楼、闪烁的霓虹灯招牌、空中飞行的交通工具以及高科技的建筑细节，营造出科幻、炫酷的都市氛围，并调整主体光影以匹配新背景。',
      },
      {
        id: 'change-weather-rain',
        name: '改变天气：雨天',
        description: '将场景天气改为下雨天，营造湿润、沉静的氛围。',
        prompt: '将图片中的场景天气转换为一个逼真的雨天。画面应展现出细密的雨丝、湿润的地面反光、模糊的远景以及整体偏冷的色调。为物体表面添加雨滴和水渍效果，营造出一种宁静、沉思甚至略带忧郁的雨中氛围。',
      },
      {
        id: 'swap-sky-sunset',
        name: '替换天空：日落',
        description: '将图片中的天空替换为壮观的日落景象，色彩绚烂。',
        prompt: '智能识别并替换图片中的天空部分，将其替换为一个壮观、色彩绚烂的日落景象。新天空应充满橙色、粉色、紫色等渐变色彩，云朵被夕阳染红，金色的阳光洒满画面。确保天空边缘自然，与地面景物融合无缝，营造出浪漫、温暖的傍晚氛围。',
      },
      {
        id: 'remove-text',
        name: '移除文字',
        description: '从图片中移除所有检测到的文本或标志，并无缝填充背景。',
        prompt: '请精确识别并彻底移除图片中所有存在的文本、标志或标识符。在移除后，利用AI智能算法对受影响的区域进行内容感知填充和修复，使背景恢复到原始的自然状态，不留任何编辑痕迹。',
      },
      {
        id: 'cutout',
        name: '智能抠图',
        description: '移除图片背景，使主体清晰突出，生成透明背景的图片。',
        prompt: '智能识别图片中的主要主体，并将其从背景中精确地抠取出来。生成一张主体边缘清晰、细节保留完整，并且背景完全透明的PNG格式图片（背景为棋盘格），便于后续合成和使用。',
      },
      {
        id: 'professional-retouching',
        name: '专业修图',
        description: '进行专业级图像修饰，调整色彩、光影、细节等，提升整体视觉质量。',
        prompt: '对图片进行专业级的图像修饰。精细调整色彩平衡、白平衡、曝光和对比度，优化光影效果以增强立体感，锐化关键细节，同时平滑皮肤或修复轻微瑕疵，最终呈现出高品质、精致且富有艺术感的作品。目标是提升整体视觉质量，使其达到杂志封面级别。',
      },
      {
        id: 'make-object-gold',
        name: '物体镀金',
        description: '将图片中的主要物体渲染成闪闪发光的黄金材质。',
        prompt: '识别图片中的主要物体，并将其材质替换为高度反射、闪闪发光的抛光黄金。确保黄金的纹理、光泽和反射效果逼真，周围环境的光线应在其表面产生自然的反射和高光，展现出奢华与质感，如同纯金雕塑一般。',
      },
    ],
  },
];


const LOCAL_STORAGE_HISTORY_KEY = 'imageEditorHistory';
const LOCAL_STORAGE_USER_TEMPLATES_KEY = 'imageEditorUserTemplates';

const App: React.FC = () => {
  // Image states are now managed within UnifiedImageDisplay, but App needs a copy to pass to services/history
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);
  const [editedImageBase64, setEditedImageBase64] = useState<string | null>(null); // This is the AI-generated or merged result

  const [prompt, setPrompt] = useState<string>(''); // User's typed prompt
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For image editing
  const [error, setError] = useState<string | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const [userTemplates, setUserTemplates] = useState<PromptTemplate[]>([]);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // States for AI prompt suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const suggestionTimeoutRef = useRef<number | null>(null); // For debouncing

  // New state for template categorization
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);

  // Credits for payment feature hint
  const [credits, setCredits] = useState<number>(100);

  // State for image merging modal
  const [showMergeImageModal, setShowMergeImageModal] = useState<boolean>(false);

  // Load user templates and history from local storage on mount
  useEffect(() => {
    try {
      const storedUserTemplates = localStorage.getItem(LOCAL_STORAGE_USER_TEMPLATES_KEY);
      if (storedUserTemplates) {
        setUserTemplates(JSON.parse(storedUserTemplates));
      }
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      // Optionally clear corrupted data or notify user
    }
  }, []);

  // Save user templates to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_TEMPLATES_KEY, JSON.stringify(userTemplates));
    } catch (e) {
      console.error("Failed to save user templates to localStorage", e);
    }
  }, [userTemplates]);

  // Save history to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  // Flatten all templates (categorized and user-defined) for searching and suggestions
  const allTemplates = useMemo(() => {
    const categorizedFlatTemplates = INITIAL_CATEGORIZED_TEMPLATES.flatMap(cat => cat.templates);
    return [...categorizedFlatTemplates, ...userTemplates];
  }, [userTemplates]);

  // Debounced AI prompt suggestion logic
  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (prompt.trim().length > 5 && !isLoading) { // Only suggest if prompt has some length and not actively loading
      setIsSuggesting(true);
      setSuggestionError(null);
      setAiSuggestions([]); // Clear previous suggestions

      suggestionTimeoutRef.current = window.setTimeout(async () => {
        try {
          const selectedTemplate = allTemplates.find(t => t.id === selectedTemplateId);
          const suggestions = await getPromptSuggestions(prompt, selectedTemplate?.description);
          setAiSuggestions(suggestions);
        } catch (e: unknown) {
          if (e instanceof Error) {
            setSuggestionError(e.message);
          } else {
            setSuggestionError("获取提示词建议时发生未知错误。");
          }
          setAiSuggestions([]);
        } finally {
          setIsSuggesting(false);
        }
      }, 700); // Debounce for 700ms
    } else {
      setIsSuggesting(false);
      setAiSuggestions([]);
      setSuggestionError(null);
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [prompt, selectedTemplateId, allTemplates, isLoading]); // Dependencies for suggestion effect


  const handleImageSelect = useCallback((base64: string, mimeType: string) => {
    setSelectedImageBase64(base64);
    setSelectedImageMimeType(mimeType);
    setEditedImageBase64(null); // Clear previous edited image
    setError(null);
    setPrompt('');
    setSelectedTemplateId(null);
    setSelectedCategory(null); // Clear category selection on new image
    setAiSuggestions([]); // Clear suggestions
    setSuggestionError(null);
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  const handleClearImage = useCallback(() => {
    setSelectedImageBase64(null);
    setSelectedImageMimeType(null);
    setEditedImageBase64(null);
    setError(null);
    setPrompt('');
    setSelectedTemplateId(null);
    setSelectedCategory(null); // Clear category selection
    setAiSuggestions([]); // Clear suggestions
    setSuggestionError(null);
  }, []);

  const handleSelectTemplate = useCallback((template: PromptTemplate) => {
    setPrompt(template.prompt);
    setSelectedTemplateId(template.id);
    setError(null);
    setAiSuggestions([]); // Clear suggestions when template is selected
    setSuggestionError(null);
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  const handleClearTemplate = useCallback(() => {
    setPrompt('');
    setSelectedTemplateId(null);
    setAiSuggestions([]); // Clear suggestions
    setSuggestionError(null);
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  const handleAddTemplate = useCallback((newTemplate: Omit<PromptTemplate, 'id' | 'isUserDefined'>, categoryId?: string) => {
    const template: PromptTemplate = {
      ...newTemplate,
      id: uuidv4(),
      isUserDefined: true,
    };

    // Store template, even if assigned to a category, it's still a userTemplate
    setUserTemplates((prev) => [...prev, template]);
    setShowAddTemplateModal(false);
  }, []);

  const addToHistory = useCallback((originalBase64: string, originalMimeType: string, newEditedBase64: string, usedPrompt: string, templateId?: string) => {
    const selectedTemplate = allTemplates.find(t => t.id === templateId);
    let categoryName: string | undefined;

    if (selectedTemplate) {
      for (const cat of INITIAL_CATEGORIZED_TEMPLATES) {
        if (cat.templates.some(t => t.id === selectedTemplate.id)) {
          categoryName = cat.name;
          break;
        }
      }
      if (!categoryName && selectedTemplate.isUserDefined) {
        categoryName = "自定义";
      }
    }

    const newHistoryEntry: HistoryEntry = {
      id: uuidv4(),
      originalImageBase64: originalBase64,
      originalImageMimeType: originalMimeType,
      prompt: usedPrompt,
      editedImageBase64: newEditedBase64,
      timestamp: Date.now(),
      templateName: selectedTemplate?.name,
      categoryName: categoryName,
    };
    setHistory((prevHistory) => [newHistoryEntry, ...prevHistory]);
  }, [allTemplates, INITIAL_CATEGORIZED_TEMPLATES]);


  const handleEditImage = useCallback(async () => {
    if (!selectedImageBase64 || !selectedImageMimeType || !prompt.trim()) {
      setError("请上传图片并提供文本提示词。");
      return;
    }
    if (credits <= 0) {
      setError("您的积分不足，请充值。");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await editImage(selectedImageBase64, selectedImageMimeType, prompt);
      if (result) {
        setEditedImageBase64(result);
        setCredits((prev) => prev - 1); // Deduct credit on successful generation
        
        addToHistory(selectedImageBase64, selectedImageMimeType, result, prompt, selectedTemplateId);

      } else {
        setError("未返回编辑后的图片。请尝试不同的提示词。");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
          setError(`编辑图片失败: ${e.message}`);
      } else {
        setError("编辑图片时发生未知错误。");
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedImageBase64, selectedImageMimeType, prompt, credits, selectedTemplateId, addToHistory]);

  const handleDownloadEditedImage = useCallback(() => {
    // This function is now passed to UnifiedImageDisplay
    // UnifiedImageDisplay will call it with the currently displayed edited image base64
  }, []);

  const handleClearCurrentSession = useCallback(() => {
    if (window.confirm("确定要清空当前会话中的图片和提示词吗？此操作不可撤销。")) {
      handleClearImage(); // Clears all image states
      setPrompt('');
      setSelectedTemplateId(null);
      setSelectedCategory(null);
      setError(null);
      setAiSuggestions([]);
      setSuggestionError(null);
      if (promptInputRef.current) {
        promptInputRef.current.focus();
      }
    }
  }, [handleClearImage]);

  const handleLoadHistoryItem = useCallback((entry: HistoryEntry) => {
    setSelectedImageBase64(entry.originalImageBase64);
    setSelectedImageMimeType(entry.originalImageMimeType);
    setEditedImageBase64(entry.editedImageBase64);
    setPrompt(entry.prompt);
    // When loading from history, clear template/category selection as it's a specific prompt
    setSelectedTemplateId(null);
    setSelectedCategory(null);
    setError(null);
    setAiSuggestions([]);
    setSuggestionError(null);
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  const handleDeleteHistoryItem = useCallback((idToDelete: string) => {
    setHistory((prevHistory) => prevHistory.filter(entry => entry.id !== idToDelete));
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setPrompt((prevPrompt) => (prevPrompt.trim() + ' ' + suggestion).trim());
    setAiSuggestions([]); // Clear suggestions after one is selected
    setSuggestionError(null);
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  const handleMergeImages = useCallback(async (overlayImageBase64: string, overlayImageMimeType: string, blendMode: BlendMode, opacity: number) => {
    if (!editedImageBase64) {
      setError("没有当前的编辑结果图片可供叠加。");
      return;
    }
    if (credits <= 0) {
      setError("您的积分不足，无法进行叠加操作。");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Assuming editedImageBase64 is always image/png from Gemini output
      const mergedImage = await mergeImagesWithBlendMode(
        editedImageBase64, 'image/png', // Base image is current edited result
        overlayImageBase64, overlayImageMimeType, // Overlay image from user upload
        blendMode, opacity
      );
      setEditedImageBase64(mergedImage);
      setCredits((prev) => prev - 1); // Deduct credit for merge operation
      setShowMergeImageModal(false);

      // Add merge operation to history
      addToHistory(selectedImageBase64!, selectedImageMimeType!, mergedImage, `图片叠加: ${blendMode} (${(opacity * 100).toFixed(0)}%)`, 'merge-operation');

    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`图片叠加失败: ${e.message}`);
      } else {
        setError("图片叠加时发生未知错误。");
      }
    } finally {
      setIsLoading(false);
    }
  }, [editedImageBase64, credits, selectedImageBase64, selectedImageMimeType, addToHistory]);

  const canEdit = !isLoading && selectedImageBase64 && prompt.trim() && credits > 0;

  return (
    <div className="flex h-full w-full p-4 gap-4"> {/* Outer container, full screen, with padding and gap */}
      {/* 左侧面板: 历史记录 */}
      <div className="flex flex-col w-[280px] p-4 border border-gray-100 rounded-xl shadow-lg bg-white overflow-hidden">
        <HistoryPanel history={history} onLoadHistoryItem={handleLoadHistoryItem} onDeleteHistoryItem={handleDeleteHistoryItem} />
      </div>

      {/* 中间面板: 图片上传，提示词输入，编辑结果展示 */}
      <div className="flex flex-col flex-grow p-6 border border-gray-100 rounded-xl shadow-lg bg-white overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 w-full text-center">AI图像编辑大师</h2>
        
        <div className="flex items-center justify-end w-full text-sm text-gray-600 mb-6">
          <span>积分剩余: <span className="font-semibold text-blue-600">{credits}</span></span>
          <button className="ml-4 text-blue-500 hover:text-blue-700 font-medium" onClick={() => alert("充值功能暂未开放。")}>充值</button>
        </div>

        <div className="flex flex-col gap-6 flex-[2] min-h-0"> {/* Main editor area, 2/3 height, scrollable */}
          {/* Unified Image Display */}
          <UnifiedImageDisplay
            selectedImageBase64={selectedImageBase64}
            selectedImageMimeType={selectedImageMimeType}
            editedImageBase64={editedImageBase64}
            onImageSelect={handleImageSelect}
            onClearImage={handleClearImage}
            onDownloadEditedImage={() => { // Inline download function for edited image
              if (editedImageBase64) {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${editedImageBase64}`;
                link.download = `edited_image_${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}
            onMergeRequest={() => setShowMergeImageModal(true)}
            isLoading={isLoading}
          />

          {/* Clear Session Button */}
          {(selectedImageBase64 || editedImageBase64 || prompt.trim()) && (
            <button
              onClick={handleClearCurrentSession}
              className="w-full py-2 px-4 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors disabled:bg-red-300"
              disabled={isLoading}
            >
              清空当前会话
            </button>
          )}

          {/* Prompt Input and Edit Button */}
          <div className="flex flex-col gap-4 w-full mt-4"> {/* Added mt-4 for spacing */}
            <label htmlFor="prompt-input" className="text-base font-semibold text-gray-700">
              您的提示词:
            </label>
            {selectedTemplateId && (
              <span className="text-blue-600 font-medium flex items-center text-sm p-1 px-3 bg-blue-50 rounded-full border border-blue-200">
                (模板: {allTemplates.find(t => t.id === selectedTemplateId)?.name})
                <button
                  onClick={handleClearTemplate}
                  className="ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-0.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
                  title="清除已选模板及当前提示词"
                  disabled={isLoading}
                  aria-label="清除模板和提示词"
                >
                  清除
                </button>
              </span>
            )}
            <textarea
              id="prompt-input"
              ref={promptInputRef}
              className="w-full p-3 border border-gray-300 rounded-lg resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 text-sm"
              placeholder="例如：“添加复古滤镜”、“移除背景中的人物”、“让它看起来像一幅画”"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading || !selectedImageBase64}
              aria-label="图片编辑的文本提示词"
            ></textarea>

            {/* AI Prompt Suggestions */}
            <PromptSuggestions
              suggestions={aiSuggestions}
              onSelectSuggestion={handleSelectSuggestion}
              isLoading={isSuggesting}
              error={suggestionError}
            />

            <button
              onClick={handleEditImage}
              disabled={!canEdit} // Use canEdit variable for button
              className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              aria-live="polite"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-2">AI正在生成...</span>
                </span>
              ) : (
                `生成编辑后的图片 (消耗1积分)`
              )}
            </button>
          </div>

          <ErrorMessage message={error || ''} />
        </div>
      </div>

      {/* 右侧面板: 模板选择器 */}
      <div className="flex flex-col w-[320px] p-6 border border-gray-100 rounded-xl shadow-lg bg-white flex-grow-0 flex-shrink-0 min-h-0"> {/* fixed width for templates */}
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 z-10">
          <h3 className="text-lg font-semibold text-gray-700">选择模板:</h3>
          <button
            onClick={() => setShowAddTemplateModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-label="添加自定义模板"
          >
            + 自定义模板
          </button>
        </div>
        <PromptTemplateSelector
          categories={INITIAL_CATEGORIZED_TEMPLATES} // Pass categories
          userTemplates={userTemplates} // Pass user-defined templates separately
          onSelectTemplate={handleSelectTemplate}
          selectedTemplateId={selectedTemplateId}
          disabled={isLoading || !selectedImageBase64}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {showAddTemplateModal && (
        <AddTemplateModal
          onClose={() => setShowAddTemplateModal(false)}
          onSave={handleAddTemplate}
          disabled={isLoading}
          availableCategories={INITIAL_CATEGORIZED_TEMPLATES} // Pass categories to modal
        />
      )}

      {showMergeImageModal && editedImageBase64 && (
        <MergeImageModal
          onClose={() => setShowMergeImageModal(false)}
          onMerge={handleMergeImages}
          baseImageBase64={editedImageBase64}
          baseImageMimeType="image/png" // Assuming edited output is PNG
          disabled={isLoading}
        />
      )}
    </div>
  );
};

export default App;