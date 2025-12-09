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
    description: '专业证件照编辑，包括背景更换、尺寸调整、面部优化等。',
    templates: [
      {
        id: 'id-photo-face-cutout-generate',
        name: '抠面部生成证件照',
        description: '从图片中智能识别并抠取面部，生成一张用于入职等正式场合的专业证件照。',
        prompt: '请从用户上传的图片中智能识别并精确抠取人物面部信息，在此基础上生成一张符合入职等正式场合的专业证件照。确保面部表情端庄自然，眼神有神。自动添加标准纯白色背景（RGB: 255,255,255），并智能匹配一套合适的深色商务正装（如西装、衬衫），使其与脸部光影自然融合。证件照尺寸应符合通用二寸标准（3.5cm x 4.9cm），头部占据画面约2/3，整体效果专业得体。',
      },
      {
        id: 'id-photo-bg-change-blue',
        name: '背景换蓝底',
        description: '将证件照背景替换为标准蓝色，均匀无瑕。',
        prompt: '请将图片中人物从背景中智能抠出，并将其背景替换为标准纯蓝色（R:0, G:191, B:243），背景应均匀无瑕疵，无渐变或噪点。确保人像边缘清晰自然，与新背景无缝融合，生成一张符合证件照规范的图片。',
      },
      {
        id: 'id-photo-bg-change-white',
        name: '背景换白底',
        description: '将证件照背景替换为标准白色，均匀无瑕。',
        prompt: '请将图片中人物从背景中智能抠出，并将其背景替换为标准纯白色（R:255, G:255, B:255），背景应均匀无瑕疵，无渐变或噪点。确保人像边缘清晰自然，与新背景无缝融合，生成一张符合证件照规范的图片。',
      },
      {
        id: 'id-photo-bg-change-red',
        name: '背景换红底',
        description: '将证件照背景替换为标准红色，均匀无瑕。',
        prompt: '请将图片中人物从背景中智能抠出，并将其背景替换为标准纯红色（R:255, G:0, B:0），背景应均匀无瑕疵，无渐变或噪点。确保人像边缘清晰自然，与新背景无缝融合，生成一张符合证件照规范的图片。',
      },
      {
        id: 'id-photo-resize-1inch',
        name: '尺寸调整：一寸照',
        description: '将照片调整为标准一寸（2.5cm x 3.5cm）尺寸。',
        prompt: '请将这张照片中的人像剪裁并调整为标准一寸（2.5cm x 3.5cm / 295px x 413px）证件照的尺寸和比例。确保人脸居中，头部占据画面约2/3的高度，画面清晰度不受影响，生成一张符合通用证件照标准的图片。',
      },
      {
        id: 'id-photo-resize-2inch',
        name: '尺寸调整：二寸照',
        description: '将照片调整为标准二寸（3.5cm x 4.9cm）尺寸。',
        prompt: '请将这张照片中的人像剪裁并调整为标准二寸（3.5cm x 4.9cm / 413px x 579px）证件照的尺寸和比例。确保人脸居中，头部占据画面约2/3的高度，画面清晰度不受影响，生成一张符合中国居民身份证或护照标准的图片。',
      },
      {
        id: 'id-photo-resize-passport',
        name: '尺寸调整：护照照',
        description: '将照片调整为标准护照（3.3cm x 4.8cm）尺寸。',
        prompt: '请将这张照片中的人像剪裁并调整为标准中国护照照片（3.3cm x 4.8cm / 390px x 567px）的尺寸和比例。确保人脸居中，头部占据画面约2/3的高度，画面清晰度不受影响，生成一张符合护照标准的图片。',
      },
      {
        id: 'id-photo-beautify',
        name: '轻度美颜',
        description: '对证件照进行轻度美颜，去除瑕疵，保留自然。',
        prompt: '请对这张证件照中的人脸进行轻度美颜处理。智能平滑皮肤，去除痘痘、斑点等细微瑕疵，同时保留面部细节和自然的皮肤纹理，避免过度磨皮。轻微提亮肤色，使人像看起来更精神、自然，符合证件照的严肃性。',
      },
      {
        id: 'id-photo-formal-wear',
        name: '智能换正装',
        description: '为照片中的人物智能更换一套合身的正装。',
        prompt: '请识别图片中的人物，并为TA智能更换一套款式经典、颜色深沉的商务正装（如西装、衬衫或职业套装），确保服装合身、自然无褶皱，与人物姿态和光影完美融合。自动调整服装颜色以适应背景色调，使其看起来专业且得体。',
      },
      {
        id: 'id-photo-glasses-glare',
        name: '去除眼镜反光',
        description: '消除眼镜上的反光，使眼睛清晰可见。',
        prompt: '请识别图片中人物佩戴的眼镜，并智能消除镜片上的所有反光或眩光，确保眼镜后的眼睛清晰、自然可见。同时不影响眼镜本身的形状、材质和光泽，修复后眼镜应保持透明。',
      },
      {
        id: 'id-photo-hair-neat',
        name: '整理发型',
        description: '整理杂乱的发丝，使发型更整洁。',
        prompt: '请对图片中人物的发型进行智能整理。去除所有杂乱、飞翘的碎发和不整齐的发丝，使发型看起来更加整洁、服帖，但仍保留自然的纹理和体积感。自动填充缺失的发丝，使其与原有发型无缝衔接。',
      },
      {
        id: 'id-photo-lighting-adjust',
        name: '均匀面部光线',
        description: '均匀面部光线，消除阴影。',
        prompt: '请对图片中人物的面部光线进行均匀化处理。智能消除面部所有不自然或过重的阴影区域，特别是眼部、鼻翼和下巴处，使面部光线柔和、均匀，凸显五官立体感，避免局部曝光过度或不足。',
      },
      {
        id: 'id-photo-remove-shadow',
        name: '去除背景阴影',
        description: '移除背景上的任何阴影。',
        prompt: '请智能识别并彻底移除图片背景上的任何人物自身产生的阴影或环境阴影。在移除后，对背景进行内容感知填充和重建，确保背景纯净、平整、均匀，不留下任何阴影痕迹。',
      },
      {
        id: 'id-photo-red-eye',
        name: '去除红眼',
        description: '修复照片中的红眼问题。',
        prompt: '请检测并修复图片中人物因闪光灯造成的红眼效应。将瞳孔颜色自然恢复，使其与正常的眼睛颜色一致，同时不影响眼睛其他部分的细节和神态，使眼神更加自然。',
      },
      {
        id: 'id-photo-expression-smile',
        name: '表情自然微笑',
        description: '微调人物表情，使其呈现自然微笑。',
        prompt: '请对图片中人物的表情进行微调。使其嘴角略微上扬，眼神柔和且有神，呈现出一个自然、亲切且充满自信的微笑表情。避免表情僵硬或过度夸张，保持面部肌肉的自然状态。',
      },
      {
        id: 'id-photo-clarity',
        name: '清晰度增强',
        description: '增强证件照的清晰度和细节。',
        prompt: '请对这张证件照进行整体清晰度增强。锐化人像的轮廓和面部细节，提高图片的视觉清晰度，同时避免过度锐化产生噪点或锯齿感，使照片看起来更专业、更清晰、更有质感。',
      },
      {
        id: 'id-photo-skin-matte',
        name: '去除皮肤油光',
        description: '消除面部皮肤的油光，呈现哑光效果。',
        prompt: '请智能识别图片中人物面部的油光区域，并进行平滑处理，消除皮肤上的反光和油腻感，使其呈现自然健康的哑光质感。同时保留皮肤本身的纹理和细节，使肤色均匀。',
      },
      {
        id: 'id-photo-skin-tone',
        name: '调整肤色',
        description: '将人物肤色调整为自然白皙。',
        prompt: '请对图片中人物的肤色进行调整。使其呈现自然、健康的白皙肤色，均匀肤色不均的区域，去除泛黄或暗沉感。但要避免过度美白，保留真实感和肤色的自然过渡。',
      },
      {
        id: 'id-photo-remove-clutter',
        name: '去除背景杂物',
        description: '移除证件照背景中任何不相关的杂物。',
        prompt: '请智能识别并彻底移除证件照背景中所有不相关的杂物、指示牌、插座或其他干扰元素。在移除后，对背景进行内容感知填充和重建，确保背景纯净、简洁，不留下任何编辑痕迹。',
      },
      {
        id: 'id-photo-repair-blemishes',
        name: '修复面部瑕疵',
        description: '智能修复面部痘痘、斑点、黑眼圈等瑕疵。',
        prompt: '请对图片中人物面部进行精细修复，智能去除痘痘、雀斑、小疤痕、黑眼圈等瑕疵。同时保留皮肤的自然纹理和光泽，使面部看起来更加光滑、洁净，但不过度磨皮，保持真实感。',
      },
      {
        id: 'id-photo-adjust-head-tilt',
        name: '纠正面部倾斜',
        description: '纠正人物面部轻微倾斜，使其居中。',
        prompt: '请智能检测并纠正图片中人物面部的轻微倾斜。将头部调整至完全正直和居中的位置，确保双眼水平对齐，同时保持颈部和身体的自然衔接，使证件照符合标准要求。',
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
        name: '高质量写实手办',
        description: '将主体制作为1/7比例的高质量手办，摆放在办公桌上，具有景深效果。',
        prompt: '请将图片中的主要人物或角色模型化，制作成一个1/7比例的高质量写实手办。手办的动作、服装、发型和面部表情应与原图保持高度一致，栩栩如生。将其摆放在一个精致的木质办公桌上，手办立于晶莹透明的圆形亚克力底座。桌左侧放置一台运行中的大型拓竹 H2S 彩色 3D 打印机，内部正在打印相同手办的微缩模型。桌右侧放置一个透明的BANDAI风格展示盒，盒中展示另一个手办，盒子正面印有原图的人物立绘。整体环境渲染应写实细腻，具有明显的光学景深效果，背景模糊，前景清晰，营造出收藏家精致的私人工作室氛围。',
      },
      {
        id: '3d-figurine-q-version',
        name: 'Q版可爱手办',
        description: '将图片主体转换为可爱的Q版手办形象，具有圆润的特征。',
        prompt: '请将图片中的人物或角色（整体）转换为可爱的Q版（Chibi）手办形象。其特征应被大幅卡通化，头部比例相对于身体显著增大，身体和四肢则缩短并圆润化，整体呈现出憨态可掬、萌趣十足的风格。手办材质表现为光滑、色彩鲜艳的塑料质感，摆放在一个简约的白色底座上，背景虚化以突出主体。',
      },
      {
        id: 'figurine-material-metal',
        name: '材质：闪亮金属',
        description: '将手办材质转换为闪亮抛光的金属质感。',
        prompt: '请将图片中手办的主体材质替换为具有高级感的闪亮抛光金属，如银色或铬合金。确保金属表面能真实反射环境光线，展现出冷硬的光泽和细腻的纹理，使手办看起来更加坚固、未来感十足。',
      },
      {
        id: 'figurine-material-wood',
        name: '材质：温润木质',
        description: '将手办材质转换为温润的木质雕刻感。',
        prompt: '请将图片中手办的主体材质替换为温润、富有纹理的雕刻木质。保留木材自然的颜色和清晰的年轮纹理，光泽度适中，营造出一种手工雕刻的艺术品感，使其看起来古朴而典雅。',
      },
      {
        id: 'figurine-material-crystal',
        name: '材质：晶莹水晶',
        description: '将手办材质转换为晶莹剔透的水晶质感。',
        prompt: '请将图片中手办的主体材质转换为晶莹剔透、内部闪烁着微光的蓝色水晶质感。确保能够通过手办看到背景的折射效果，同时保留其轮廓和色彩的反射效果，使其看起来如同艺术品般璀璨夺目。',
      },
      {
        id: 'figurine-glowing',
        name: '添加发光特效',
        description: '为手办添加炫酷的发光效果。',
        prompt: '请为图片中手办的特定部位（如眼睛、武器边缘或能量核心）添加柔和而明亮的内部发光效果。光芒应带有科幻或魔法色彩，向周围环境散发出微弱的光晕，增强手办的能量感和视觉冲击力。',
      },
      {
        id: 'figurine-scene-scifi',
        name: '置于科幻场景',
        description: '将手办置于充满未来感的科幻场景。',
        prompt: '请将图片中手办的背景替换为一个充满未来科技感的赛博朋克城市夜景。背景应包含未来都市的浮空建筑、闪烁的霓虹灯光效、全息投影或外星球地貌，光影效果与手办主体完美融合，营造出强烈的未来世界氛围。',
      },
      {
        id: 'figurine-scene-fantasy',
        name: '置于奇幻场景',
        description: '将手办置于神秘的奇幻世界场景。',
        prompt: '请将图片中手办的背景替换为一个神秘、壮丽的奇幻世界场景。背景应包含古老的魔法遗迹、神秘的森林、龙穴或漂浮的岛屿，光线柔和而富有层次感，使手办仿佛置身于史诗般的冒险之中。',
      },
      {
        id: 'figurine-dynamic-pose',
        name: '手办动态姿势',
        description: '微调手办姿势，使其更具动感。',
        prompt: '请对手办的姿势进行微调，使其更具动感和张力。例如，使其呈现出正在跳跃、挥舞武器或施放技能的瞬间，肌肉线条和衣物褶皱应随之变化，展现出爆发力和速度感，仿佛捕捉到了一个动作定格的瞬间。',
      },
      {
        id: 'figurine-add-prop-sword',
        name: '添加武器道具',
        description: '为手办添加特定的武器或道具。',
        prompt: '请为图片中手办的手中智能添加一把未来科技感十足的能量剑。确保武器尺寸与手办比例协调，材质逼真，并发出微弱的蓝色光芒，使手办看起来更加完整和强大，背景光影随之调整。',
      },
      {
        id: 'figurine-add-prop-shield',
        name: '添加盾牌道具',
        description: '为手办添加一面守护盾牌。',
        prompt: '请为图片中手办的手臂智能添加一面设计精美的未来科技感盾牌。确保盾牌尺寸与手办比例协调，材质坚固，表面有微弱的能量护盾效果，使其看起来更具防御性和史诗感，光影自然。',
      },
      {
        id: 'figurine-weathered',
        name: '旧化/战损效果',
        description: '为手办添加逼真的旧化或战损效果。',
        prompt: '请为图片中手办的表面添加逼真的旧化和战损效果。使其金属部分出现磨损、划痕和锈迹，衣物部分有破损或泥土附着，整体呈现出饱经风霜、历经战斗的沧桑感，细节丰富。',
      },
      {
        id: 'figurine-custom-paint',
        name: '自定义涂装',
        description: '为手办重新涂装，改变其颜色和细节。',
        prompt: '请为图片中手办进行全新的涂装，将其主色调改为鲜亮的亮红色和黑色，并添加更多细致的线条和图案装饰。保持材质感不变，使手办看起来焕然一新，充满定制化的艺术气息，光泽度适中。',
      },
      {
        id: 'figurine-light-shadow',
        name: '光影重塑',
        description: '调整手办的光照和阴影效果。',
        prompt: '请对图片中手办的光照和阴影效果进行精细调整。模拟一个从上方45度角投射下来的强烈聚光灯效果，使手办的边缘和凸起部分高光明显，阴影深邃，增强其立体感和雕塑感，背景光影应自然过渡。',
      },
      {
        id: 'figurine-transparent',
        name: '半透明化',
        description: '将手办的主体变为半透明材质。',
        prompt: '请将图片中手办的主体材质转换为晶莹剔透的半透明玻璃或水晶质感。确保能够透过手办看到背景的折射效果，同时保留其轮廓和色彩的反射效果，使其看起来轻盈而神秘，仿佛幽灵般的存在。',
      },
      {
        id: 'figurine-close-up',
        name: '局部特写',
        description: '对手办的某个局部进行特写放大。',
        prompt: '请将图片中手办的头部进行特写放大，使其占据画面大部分空间。聚焦于面部表情和眼睛的细节，背景进行大幅虚化，以突出其精细的雕刻工艺和神态，营造出电影镜头般的特写效果。',
      },
      {
        id: 'figurine-miniature',
        name: '微缩模型化',
        description: '将图片主体变为微缩模型手办。',
        prompt: '请将图片中的主要人物或物体转化为一个精致的微缩模型手办，使其看起来非常小巧可爱。将其置于一个正常大小的日常物品（如铅笔盒或咖啡杯）旁边，以突出其迷你感，背景和光影应自然融合。',
      },
      {
        id: 'figurine-packaging',
        name: '手办包装展示',
        description: '将手办置于精美包装盒中展示。',
        prompt: '请将图片中的手办主体保留，并将其置于一个设计精美、带有透明展示窗的高级收藏级包装盒内。包装盒应有品牌Logo和角色艺术图，背景虚化，营造出未拆封的收藏品魅力。',
      },
      {
        id: 'figurine-gacha',
        name: '扭蛋玩具化',
        description: '将手办转变为塑料扭蛋玩具风格。',
        prompt: '请将图片中的手办主体转换为一个表面光滑、色彩明亮的塑料扭蛋（Gashapon）玩具风格。使其看起来像是从扭蛋机中刚取出，边缘圆润，质感卡通，背景可以是一个简单的扭蛋机内部或包装环境。',
      },
      {
        id: 'figurine-scene-urban',
        name: '手办置于城市街头',
        description: '将手办置于日系城市街头场景。',
        prompt: '请将图片中手办的背景替换为充满日系风格的城市街头场景。背景应包含繁忙的街道、闪烁的霓虹灯牌和高楼大厦，光影效果与手办主体完美融合，营造出时尚动感的都市感。',
      },
      {
        id: 'figurine-hologram',
        name: '全息投影手办',
        description: '将手办转变为未来感全息投影效果。',
        prompt: '请将图片中的手办主体转换为一个半透明、泛着蓝色或青绿色光芒的全息投影形象。使其边缘带有轻微的像素抖动和扫描线效果，周围散发着科技感的光晕，背景可为暗色，以突出全息效果。',
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
        name: '卡通化',
        description: '将宠物图片转换为可爱的美式卡通画风。',
        prompt: '请将图片中的宠物（整体）转换为可爱的美式卡通画风。线条应粗犷有力，色彩鲜明饱和，表情夸张且生动活泼，使其看起来像动画片或儿童插画中的角色，充满童趣和活力，保留宠物特征。',
      },
      {
        id: 'pet-art-style-oil',
        name: '油画艺术风',
        description: '将宠物图片转换为印象派油画风格。',
        prompt: '请将图片中的宠物（整体）转换为一幅梵高风格的印象派油画作品。运用厚重、粗犷的螺旋状笔触和明亮饱和的色彩，捕捉宠物独特的姿态和神韵，使其充满强烈的艺术感染力，背景也应随之风格化。',
      },
      {
        id: 'pet-art-style-watercolor',
        name: '水彩画艺术风',
        description: '将宠物图片转换为柔和水彩画风格。',
        prompt: '请将图片中的宠物（整体）转换为一幅柔和、透明且富有流动感的水彩画作品。模拟水彩颜料在纸上自然晕染的效果，色彩过渡平滑细腻，物体边缘略带模糊，整体画面呈现出清新、梦幻的艺术气息。',
      },
      {
        id: 'pet-futuristic',
        name: '未来赛博朋克宠物',
        description: '将宠物图片融入赛博朋克或未来科技感场景。',
        prompt: '请将图片中的宠物主体保留，并将其放置在一个充满赛博朋克风格的未来城市景观中。背景应包含高耸的金属建筑、闪烁的霓虹灯牌、空中交通工具和科技感十足的街道。宠物身上可以有微弱的发光线条或机械义肢，整体画面呈现出炫酷、神秘的未来世界氛围。',
      },
      {
        id: 'pet-humanoid',
        name: '宠物拟人化',
        description: '将宠物图片拟人化，使其穿戴服饰或站立。',
        prompt: '请将图片中的宠物进行拟人化处理。使其像人类一样站立，并穿戴一套可爱的小西装和领结，表情应更具人类情感，但仍保留宠物的基本特征，背景虚化以突出拟人化效果。',
      },
      {
        id: 'pet-accessories-hat',
        name: '添加趣味帽子',
        description: '为宠物添加一顶生日帽。',
        prompt: '请为图片中的宠物头上智能添加一顶迷你生日帽。确保帽子尺寸适合宠物头部，材质逼真，并与宠物毛发自然融合，帽檐可有小巧的流苏装饰，增添趣味和萌感。',
      },
      {
        id: 'pet-accessories-bowtie',
        name: '添加可爱领结',
        description: '为宠物添加一个可爱的蝴蝶结领结。',
        prompt: '请为图片中的宠物颈部智能添加一个粉红色的可爱蝴蝶结领结。确保领结尺寸适合宠物，材质柔和，与宠物毛发自然融合，增添绅士或淑女的趣味和萌感。',
      },
      {
        id: 'pet-expression-exaggerate',
        name: '夸张表情包',
        description: '夸大宠物表情，使其更具喜剧效果。',
        prompt: '请将图片中宠物的面部表情进行喜剧性夸张。例如，如果它在笑，就让它笑得更开怀；如果它在惊讶，就让它的眼睛瞪得更大，使其表情极具感染力和趣味性，直接成为一个生动的表情包。',
      },
      {
        id: 'pet-background-forest',
        name: '背景：生机森林',
        description: '将宠物置于生机勃勃的森林场景。',
        prompt: '请将图片中的宠物主体保留，将其背景替换为一个阳光透过树叶的茂密森林场景。确保森林的色彩鲜明，有远近景深，光影自然，使宠物仿佛置身于大自然中自由奔跑，与环境完美融合。',
      },
      {
        id: 'pet-background-beach',
        name: '背景：阳光海滩',
        description: '将宠物置于阳光明媚的热带海滩。',
        prompt: '请将图片中的宠物主体保留，将其背景替换为一个阳光明媚、充满活力的热带海滩场景。新背景应包含碧蓝的海水、金色的沙滩、摇曳的棕榈树，光影与宠物主体完美融合，营造度假氛围。',
      },
      {
        id: 'pet-fur-enhance',
        name: '毛发增强/顺滑',
        description: '增强宠物毛发细节或使其更顺滑。',
        prompt: '请对图片中宠物的毛发进行精细化处理。增强毛发的细节和光泽感，使其看起来更加蓬松、柔软且富有层次，同时去除任何毛发凌乱或打结的部分，使其整体看起来更加顺滑整洁，毛茸茸的质感突出。',
      },
      {
        id: 'pet-eyes-brighten',
        name: '眼睛提亮增神',
        description: '提亮宠物眼睛，使其炯炯有神。',
        prompt: '请对图片中宠物的眼睛进行提亮和增神处理。增加瞳孔的高光，使其看起来更加明亮、有神，充满活力和灵气。同时保留眼睛的自然色彩和细节，使其眼神生动。',
      },
      {
        id: 'pet-photo-repair',
        name: '模糊照片修复',
        description: '修复模糊的宠物照片，提升清晰度。',
        prompt: '请对这张模糊的宠物照片进行智能修复。提升整体清晰度和锐度，使宠物的毛发、眼睛和鼻子等细节变得清晰可见，同时减少照片中的噪点，让模糊的瞬间重获生机，呈现清晰影像。',
      },
      {
        id: 'pet-remove-leash',
        name: '去除牵引绳/项圈',
        description: '移除宠物身上的牵引绳或其他杂物。',
        prompt: '请智能识别并彻底移除图片中宠物身上或周围的牵引绳、项圈或其他不相关的杂物。在移除后，利用AI智能算法对受影响的区域进行无缝填充和恢复，使宠物看起来更加自由自然。',
      },
      {
        id: 'pet-add-wings-angel',
        name: '添加天使翅膀',
        description: '为宠物添加一对洁白的天使翅膀。',
        prompt: '请为图片中的宠物背部智能添加一对洁白如雪的天使翅膀。翅膀应羽毛丰满，光影自然，与宠物身体比例协调，使其看起来如同神话中的生物，充满奇幻色彩。',
      },
      {
        id: 'pet-add-wings-demon',
        name: '添加恶魔翅膀',
        description: '为宠物添加一对黑色的恶魔翅膀。',
        prompt: '请为图片中的宠物背部智能添加一对深黑色、带有尖锐骨骼感的恶魔翅膀。翅膀应具有皮质感，光影深邃，与宠物身体比例协调，使其看起来充满神秘和力量感。',
      },
      {
        id: 'pet-line-art',
        name: '宠物线稿图',
        description: '将宠物照片转换为简洁的线稿艺术风格。',
        prompt: '请将图片中的宠物（整体）转换为简洁、干净的黑白线条艺术画风格。保留宠物的基本轮廓和关键细节，去除所有色彩和纹理，使其看起来像一幅由细腻钢笔勾勒出的现代插画。',
      },
      {
        id: 'pet-comic-speech',
        name: '添加对话气泡',
        description: '为宠物添加漫画对话气泡。',
        prompt: '请为图片中的宠物添加一个漫画风格的对话气泡，气泡中包含一段可爱的中文文字，例如“铲屎的，饭呢？”。确保气泡和文字风格与图片融合，增添趣味性和故事感。',
      },
      {
        id: 'pet-with-owner',
        name: '与虚拟主人合影',
        description: '将宠物与一个卡通形象的主人同框。',
        prompt: '请将图片中的宠物主体保留，并为其旁边添加一个温馨可爱的卡通女性主人形象，主人应面带微笑，轻抚宠物。确保人物和宠物在构图上自然和谐，光影统一，营造出温馨的互动场景。',
      },
      {
        id: 'pet-add-crown',
        name: '添加迷你皇冠',
        description: '为宠物头上添加一个金色迷你皇冠。',
        prompt: '请为图片中的宠物头上智能添加一个闪耀的金色迷你皇冠。确保皇冠尺寸适合宠物头部，材质真实，镶嵌有微小的宝石，使其看起来尊贵而可爱，仿佛一位小小的王者。',
      },
      {
        id: 'pet-glowing-eyes',
        name: '眼睛发出荧光',
        description: '使宠物眼睛发出神秘的荧光。',
        prompt: '请使图片中宠物的双眼发出柔和而神秘的绿色荧光。光芒应从瞳孔深处散发，向周围环境投射出淡淡的辉光，使其看起来充满灵性或神秘感，同时不影响面部其他细节。',
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
        prompt: '请将这张图片（整体人物和背景）转换为经典的日本动漫（Anime）风格。人物应具有大而富有神采的眼睛、柔和细腻的肤色、精致的五官和纤细的轮廓。背景细节应丰富且充满层次感，色彩饱和且充满活力，整体画面营造出如动画电影般的梦幻感和二次元美学。',
      },
      {
        id: 'anime-american',
        name: '转美漫风格',
        description: '将图片转换为美式漫画的画风，具有粗犷线条和强烈阴影。',
        prompt: '请将这张图片（整体人物和背景）转换为经典的美式漫画（Comic Book）风格。画面应具有粗犷有力的黑色描边线条、夸张的形体比例和强烈的明暗阴影对比。色彩鲜明大胆，充满动感和冲击力，仿佛是超级英雄漫画中的一帧，展现出强烈的视觉表现力。',
      },
      {
        id: 'anime-chibi',
        name: '转Q版动漫',
        description: '将图片中的人物或物体转换为Q版（Chibi）动漫风格。',
        prompt: '请将图片中的人物或核心物体（整体）转换为Q版（Chibi）动漫风格。头部比例相对于身体显著增大，五官、身体和四肢则缩短并圆润化，整体呈现出卡通化、萌趣十足的形象。眼神应灵动可爱，表情纯真或带有一丝搞怪，色彩鲜艳明快，背景虚化以突出主体，营造出活泼、可爱的二次元世界。',
      },
      {
        id: 'anime-chinese-ink',
        name: '转水墨国风',
        description: '将图片转换为中国传统水墨画风格。',
        prompt: '请将图片（整体人物和背景）转换为中国传统水墨画风格。画面应以淡雅的黑白灰为主色调，注重写意留白，笔触流畅自然，墨色浓淡相宜，营造出空灵、清远、富有东方韵味的艺术氛围。人物或物体轮廓清晰，细节以淡墨勾勒。',
      },
      {
        id: 'anime-pixel-art',
        name: '转像素艺术风格',
        description: '将图片转换为复古像素画风格。',
        prompt: '请将图片（整体人物和背景）转换为复古的像素艺术（Pixel Art）风格。画面应由清晰可见的方块像素组成，色彩数量受限，边缘锐利，仿佛是80年代或90年代的电子游戏画面，充满怀旧感和独特的数字美学。',
      },
      {
        id: 'anime-effects-magic',
        name: '添加动漫魔法特效',
        description: '为动漫人物添加魔法能量波特效。',
        prompt: '请识别图片中的人物，并为其手中添加一个集中的、散发着蓝色光芒的魔法能量球，并有能量波向四周扩散的效果。特效应具有动漫风格的动感和冲击力，光影变化自然，使人物看起来像在施展强大的魔法。',
      },
      {
        id: 'anime-expression-happy',
        name: '动漫人物开心表情',
        description: '调整动漫人物表情，使其非常开心。',
        prompt: '请对图片中的动漫人物表情进行调整，使其呈现出极其开心、充满活力的笑容。眼睛弯成月牙状，嘴巴大幅度上扬，脸颊可能带有红晕，表现出极度的喜悦和幸福感。',
      },
      {
        id: 'anime-background-school',
        name: '动漫背景：校园',
        description: '将背景替换为日本动漫风格的学校场景。',
        prompt: '请将图片中的人物或核心主体保留，将其背景替换为一个明亮、整洁的日本动漫风格高中校园场景。背景应包含教学楼、操场、樱花树和蓝天白云，光影柔和，营造出青春洋溢的校园氛围，人物与背景光影完美融合。',
      },
      {
        id: 'anime-comic-panel',
        name: '生成漫画分镜',
        description: '将图片转换为漫画分镜中的一格。',
        prompt: '请将这张图片处理成一个经典的漫画分镜（Comic Panel）效果。图片应被放置在带有粗黑边框的方格内，背景和人物光影对比强烈，画面顶部或底部可留白添加简短的动漫风格旁白或对话。整体画面呈现漫画叙事感。',
      },
      {
        id: 'anime-dialogue-bubble',
        name: '添加动漫对话框',
        description: '为动漫人物添加对话气泡和文字。',
        prompt: '请为图片中的动漫人物添加一个漫画风格的对话气泡，气泡中包含一段与人物表情和情境相符的中文对话（例如：“今天天气真好啊！”）。确保气泡形状和文字排版符合动漫习惯，增添故事性。',
      },
      {
        id: 'anime-outfit-school',
        name: '动漫校服更换',
        description: '为人物更换一套动漫风格校服。',
        prompt: '请识别图片中的人物，并为TA智能更换一套经典的日本动漫风格高中校服（如水手服或西式制服），确保服装合身、细节精致，与人物姿态和光影自然融合，营造出青春的学生气息。',
      },
      {
        id: 'anime-hair-color',
        name: '动漫人物发色改变',
        description: '改变动漫人物的头发颜色。',
        prompt: '请将图片中动漫人物的头发颜色改变为亮丽的天蓝色。保持头发的纹理和光泽感不变，使发色均匀自然，与人物肤色和服装协调一致。',
      },
      {
        id: 'anime-filter-soft',
        name: '动漫柔光滤镜',
        description: '为图片添加动漫柔和光晕滤镜。',
        prompt: '请为图片整体添加一层动漫风格的柔和光晕滤镜。使画面边缘略带模糊，光线均匀柔和，色彩饱和度略微提升，营造出一种梦幻、唯美且充满浪漫气息的动漫氛围。',
      },
      {
        id: 'anime-character-transform',
        name: '真实人物转动漫角色',
        description: '将真实人物转换为动漫角色形象。',
        prompt: '请将图片中的真实人物（整体）转换为日本动漫风格的角色形象。保留人物的基本特征和神韵，但将其面部和身体比例卡通化，具有动漫人物的大眼睛、小嘴巴和流畅线条，使其看起来像二次元世界中的一员。',
      },
      {
        id: 'anime-scene-only',
        name: '照片转动漫场景',
        description: '将照片转换为动漫场景，去除人物。',
        prompt: '请将这张照片中的背景和环境（整体）转换为日本动漫风格的场景。移除照片中所有人物，并用动漫风格的景物填充，例如将现实建筑转绘为动漫建筑，将现实树木转绘为动漫树木，整体画面保持动漫的色彩和细节。',
      },
      {
        id: 'anime-effect-speed-lines',
        name: '添加动漫速度线',
        description: '为图片添加动漫中的速度线，增加动感。',
        prompt: '请在图片中的主体周围智能添加动漫风格的速度线（Speed Lines）或冲击线（Impact Lines），以突出其快速移动或受到冲击的效果。线条应简洁有力，与主体动作方向一致，增强画面的动感和视觉张力。',
      },
      {
        id: 'anime-background-cherry-blossom',
        name: '动漫背景：樱花季',
        description: '将背景替换为日本动漫风格的樱花盛开场景。',
        prompt: '请将图片中的人物或核心主体保留，将其背景替换为一个日本动漫风格的樱花盛开场景。背景应充满粉色的樱花瓣飞舞，光线柔和，营造出唯美、浪漫的春日氛围，人物与背景光影完美融合。',
      },
      {
        id: 'anime-style-gothic',
        name: '转哥特萝莉风格',
        description: '将人物转换为哥特萝莉动漫角色。',
        prompt: '请将图片中的人物（整体）转换为具有哥特萝莉（Gothic Lolita）风格的动漫角色形象。人物应穿着精致的黑色蕾丝、褶边服装，配有优雅的头饰和深色妆容，眼神略带忧郁或神秘，整体呈现出古典、华丽而又带有一丝暗黑美的二次元风格。',
      },
      {
        id: 'anime-effect-sparkle',
        name: '添加闪光特效',
        description: '为动漫人物或物品添加闪耀的星光或光斑。',
        prompt: '请在图片中的动漫人物或特定物品周围智能添加闪耀的星光（Sparkle）或柔和的光斑（Glow）特效。使其看起来更具吸引力或魔法感，营造出梦幻、浪漫的氛围。',
      },
      {
        id: 'anime-body-proportion-adjust',
        name: '调整动漫人物身材比例',
        description: '微调动漫人物身材比例。',
        prompt: '请对图片中动漫人物的身材比例进行微调，使其腿部略微拉长，腰部更加纤细，呈现出更加修长、符合二次元审美的完美比例。同时保持人物整体的自然感和原有风格。',
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
        prompt: '请将图片中的主要人物或动物表情进行九宫格变化处理。在保持主体一致性的前提下，将原始表情进行微调，使其在九个格子里分别展现出从开心到困惑、从惊讶到搞怪等九种不同但都充满趣味和喜感的表情或姿态。每格底部可配简洁的短语，整体生成一个多格表情包。',
      },
      {
        id: 'meme-animated',
        name: '动漫化表情包',
        description: '将图片主体动漫化，并配上搞怪文字。',
        prompt: '请将图片中的人物或核心物体进行动漫化处理，使其成为一个具有日漫或美漫风格的可爱卡通角色。突出其搞笑的表情或姿态，并为其底部配上一句流行、诙谐的中文动漫梗或网络流行语，生成一个充满二次元幽默感的表情包。',
      },
      {
        id: 'meme-weird',
        name: '奇怪表情',
        description: '将图片主体生成奇怪或夸张的表情包。',
        prompt: '请将图片中的人物或动物的表情进行极端夸张和扭曲，使其呈现出一种令人捧腹的奇怪、荒诞或超现实感。面部特征可以被拉伸、变形，添加非现实元素，并配上恰当的无厘头中文文字，生成一个充满视觉冲击力和黑色幽默的表情包。',
      },
      {
        id: 'meme-add-text-basic',
        name: '添加文字梗：我太难了',
        description: '为图片添加“我太难了”文字梗。',
        prompt: '请在图片下方或空白处添加一行流行的中文网络文字梗“我太难了”。文字应醒目、字体粗犷，白色带黑色描边，与图片内容形成对比，增强表情包的幽默感。',
      },
      {
        id: 'meme-add-text-emmm',
        name: '添加文字梗：emmm',
        description: '为图片添加“emmm”文字梗。',
        prompt: '请在图片人物头部上方添加一个灰色的中文网络文字梗“emmm”，文字应手写体风格，略带思考的表情，与图片内容形成对比，增强表情包的内涵。',
      },
      {
        id: 'meme-auto-caption',
        name: '智能配字幕',
        description: '根据图片内容智能生成趣味字幕。',
        prompt: '请根据图片中人物或动物的表情和情境，智能生成一段简短、诙谐的中文字幕，并将其置于图片底部。字幕应字体清晰、白色带黑色描边，符合表情包的视觉习惯。',
      },
      {
        id: 'meme-face-swap',
        name: '面部替换：趣味猫咪',
        description: '将图片人物的脸替换为可爱猫咪脸。',
        prompt: '请识别图片中的人物脸部，并将其替换为一张夸张、搞怪的卡通猫咪表情脸。确保替换后的脸部大小、角度和光影与原图自然融合，达到出乎意料的喜剧效果，生成一个趣味表情包。',
      },
      {
        id: 'meme-scene-office',
        name: '场景替换：办公室',
        description: '将表情包主体置于办公室场景。',
        prompt: '请将图片中的表情包主体（如一只猫）保留，并将其背景替换为一个充满现代感的办公室场景。猫咪应被智能调整姿态，使其看起来像正在认真开会或敲击键盘，营造出反差萌的趣味。',
      },
      {
        id: 'meme-background-blur',
        name: '背景虚化突出表情',
        description: '虚化背景，突出主体表情。',
        prompt: '请将图片中表情包主体的背景进行柔和的虚化处理，使其模糊不清，从而将视觉焦点完全集中到表情主体上，使其面部细节和情绪表达更加突出，增强表情包的冲击力。',
      },
      {
        id: 'meme-add-emoji-laugh',
        name: '添加Emoji表情：哭笑',
        description: '为图片添加哭笑不得Emoji表情。',
        prompt: '请在图片中的人物或动物头部上方添加一个大大的、黄色的“😂”哭笑不得Emoji表情。确保Emoji表情清晰可见，大小适中，与图片情境相符，增强幽默感。',
      },
      {
        id: 'meme-add-emoji-confused',
        name: '添加Emoji表情：困惑',
        description: '为图片添加困惑Emoji表情。',
        prompt: '请在图片中的人物或动物头部上方添加一个大大的、黄色的“🤔”思考/困惑Emoji表情。确保Emoji表情清晰可见，大小适中，与图片情境相符，增强幽默感。',
      },
      {
        id: 'meme-dynamic-effect-stars',
        name: '添加动态感：星星',
        description: '为表情包添加头部旋转星星效果。',
        prompt: '请为图片中的表情包主体添加一些简单的动态感视觉效果，例如在人物头部周围添加快速旋转的星星或问号，使其看起来像在思考或感到困惑，增强活泼感（结果为单帧图片）。',
      },
      {
        id: 'meme-black-white',
        name: '黑白搞怪风格',
        description: '将图片转换为黑白搞怪风格。',
        prompt: '请将图片（整体）转换为高对比度的黑白风格，并在此基础上夸大人物或动物的搞怪表情。通过强烈的明暗对比和简化色彩，使其表情包更具冲击力和复古幽默感。',
      },
      {
        id: 'meme-doodle-border',
        name: '卡通涂鸦边框',
        description: '为表情包添加卡通涂鸦风格边框。',
        prompt: '请为图片中的表情包添加一个手绘卡通涂鸦风格的边框，边框可以是不规则形状，颜色鲜艳，并带有简单的星星、爱心或波浪线等图案，增加活泼和趣味性。',
      },
      {
        id: 'meme-multi-panel-2',
        name: '两格表情组合',
        description: '将图片拆分为2个格，展现不同情绪或动作。',
        prompt: '请将这张图片智能地拆分成两个并列的方格。左侧方格显示人物的惊讶表情，右侧方格显示人物的无奈表情，确保两格之间有明显的分割线，形成对比鲜明的表情包组合。',
      },
      {
        id: 'meme-effect-cry',
        name: '添加哭泣特效',
        description: '为表情包主体添加动漫式哭泣效果。',
        prompt: '请为图片中的人物或动物面部添加动漫风格的眼泪和哭泣特效。眼泪应大颗且晶莹，沿脸颊滑落，嘴角微向下，营造出夸张的悲伤或委屈表情。',
      },
      {
        id: 'meme-enlarge-subject',
        name: '表情主体放大',
        description: '将表情包中的主要主体放大。',
        prompt: '请将图片中作为表情包核心的人物或动物主体进行放大处理，使其占据画面更大比例，面部表情更清晰，背景适当虚化，从而增强表情的视觉冲击力和突出感。',
      },
      {
        id: 'meme-speech-bubble-shock',
        name: '添加对话框：震惊',
        description: '为表情包人物添加震惊对话框。',
        prompt: '请在图片中的人物头部上方添加一个带有锯齿状边缘的漫画对话框，里面写着“！！！！”或“震惊！”。对话框应突出人物的震惊或不可置信的表情。',
      },
      {
        id: 'meme-glitch-effect',
        name: '添加故障艺术效果',
        description: '为表情包添加故障艺术（Glitch Art）效果。',
        prompt: '请为图片中的表情包（整体）添加故障艺术（Glitch Art）效果。画面应出现像素错位、色彩分离和扫描线纹理，营造出一种数字错误或信号干扰的视觉冲击力，使其看起来独特而前卫。',
      },
      {
        id: 'meme-add-glasses-dealwithit',
        name: '添加墨镜 (Deal With It)',
        description: '为人物添加像素风墨镜和“Deal With It”文字。',
        prompt: '请为图片中的人物智能添加一副像素风格的黑色墨镜，并使其从画面上方缓缓落下，最终停留在人物的鼻梁上。同时在图片底部添加白色大写文字“DEAL WITH IT”，营造出酷炫、幽默的氛围。',
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
        name: '复古胶片滤镜',
        description: '为图片添加复古胶片滤镜效果，使其看起来像70年代拍摄的照片，具有温暖的色调和颗粒感。',
        prompt: '请为这张图片（整体）添加经典的70年代复古胶片滤镜效果。确保画面整体呈现温暖的棕褐色调，色彩饱和度略微降低，并引入细微的胶片颗粒感和轻微的漏光效果。让画面充满怀旧氛围，仿佛在泛黄的旧照片中重现，具有浓郁的历史感。',
      },
      {
        id: 'filter-cinematic',
        name: '电影感色彩分级',
        description: '为图片添加电影级的色彩分级和光影效果，营造史诗感。',
        prompt: '请为图片（整体）应用电影级的色彩分级（Color Grading），调整对比度、饱和度和色调，使其具有宽银幕电影的深邃感和戏剧性光影效果。特别是暗部应呈现蓝绿色调，亮部偏暖，营造出磅礴大气、富有叙事感的史诗大片般质感。',
      },
      {
        id: 'filter-watercolor',
        name: '水彩画效果',
        description: '将图片转换为柔和、富有流动感的水彩画风格。',
        prompt: '请将图片（整体）转换为柔和、透明且富有流动感的水彩画风格。模拟水彩颜料在纸上自然晕染的效果，色彩过渡平滑细腻，物体边缘略带模糊，整体画面呈现出清新、梦幻且充满艺术气息的湿润感。',
      },
      {
        id: 'filter-neon-glow',
        name: '霓虹光影滤镜',
        description: '为图片添加充满未来感的霓虹光晕和赛博朋克色彩。',
        prompt: '请为图片（整体）添加充满未来感的霓虹光晕和赛博朋克风格的色彩。画面应有明显的蓝色、紫色、粉色和青绿色调，从物体边缘或画面深处散发出强烈的电光和霓虹灯光效，营造出迷幻、高科技且略带颓废的都市夜景氛围。',
      },
      {
        id: 'style-transfer-impressionist',
        name: '印象派艺术风格',
        description: '将图片转换为梵高风格的印象派画作。',
        prompt: '请将这张图片（整体）完全转换为文森特·梵高（Vincent van Gogh）标志性的印象派画作风格。画面应充满强劲的螺旋状笔触感、流动的线条和明亮饱和的色彩，尤其是天空和光影部分，展现出独特的艺术韵味和强烈的情感张力，如同“星月夜”般的视觉效果。',
      },
      {
        id: 'apply-sketch-effect',
        name: '铅笔素描效果',
        description: '将图片转换为逼真的铅笔素描效果。',
        prompt: '请将这张图片（整体）转换为高度逼真的铅笔素描效果。注重线条的粗细变化、阴影的层次感和素描的质感，模拟手绘铅笔画的精细与艺术性，仿佛由专业画师在素描纸上勾勒而成。画面应以黑白灰为主，线条干净有力。',
      },
      {
        id: 'convert-to-oil-painting',
        name: '经典油画效果',
        description: '将图片转换为经典油画的风格，具有厚重的笔触和丰富的色彩。',
        prompt: '请将这张图片（整体）转换为一幅经典的写实主义油画风格作品。画面应呈现出厚重、有质感的笔触，色彩浓郁且层次丰富，光影对比强烈。模拟油画颜料的纹理和光泽，让整张图片散发出博物馆藏品的艺术气息，如同大师亲手绘制。',
      },
      {
        id: 'add-lens-flare',
        name: '添加镜头光晕',
        description: '在图片中添加自然、柔和的镜头光晕效果，增强氛围感。',
        prompt: '请在图片中合适的位置（例如阳光方向）添加自然、柔和且具有电影感的镜头光晕效果。光晕应呈圆形或条纹状，与光源方向一致，不突兀，能有效增强画面的氛围感和视觉美感，营造出梦幻、温暖或阳光普照的意境。',
      },
      {
        id: 'add-vignette',
        name: '添加柔和暗角',
        description: '在图片边缘添加柔和的暗角效果，将视线引导至中心。',
        prompt: '请为图片的四个边缘添加柔和自然的暗角（Vignette）效果。暗角应逐渐向中心过渡，轻微加深边缘亮度，从而将观者的视线有效引导至画面的中心焦点，增强作品的艺术感和构图深度，营造出电影镜头下的视觉效果。',
      },
      {
        id: 'black-and-white',
        name: '经典黑白效果',
        description: '将图片转换为经典的黑白照片，具有高对比度。',
        prompt: '请将这张图片（整体）转换为经典的黑白摄影作品。着重于高对比度、丰富的灰度层次以及深邃的阴影和明亮的高光，以凸显画面的结构、纹理和情感，呈现出永恒的艺术感和戏剧性效果。',
      },
      {
        id: 'enhance-colors',
        name: '色彩鲜艳增强',
        description: '增强图片色彩的饱和度和鲜艳度，使其更加生动。',
        prompt: '请全面增强图片中的色彩表现力。提升整体饱和度和鲜艳度，使颜色更加生动、明亮，同时保持色彩的自然和谐，避免过曝或失真，让画面更具视觉冲击力，但不过于卡通化。',
      },
      {
        id: 'apply-bokeh-effect',
        name: '背景虚化 (散景)',
        description: '为图片的背景添加柔和的散景虚化效果，使主体更突出。',
        prompt: '请对图片的背景应用柔和、电影感的散景（Bokeh）虚化效果。背景应模糊且光斑圆润，形成奶油般的虚化效果。确保主体保持清晰锐利，从而在视觉上将其从背景中分离出来，突出焦点，营造专业摄影作品的景深感。',
      },
      {
        id: 'filter-cyberpunk-city',
        name: '赛博朋克城市风格',
        description: '为图片添加赛博朋克风格的城市夜景氛围。',
        prompt: '请为图片（整体）添加赛博朋克风格的城市夜景滤镜。画面应充斥着深蓝色、紫色和霓虹粉的色调，高光处有电光蓝或荧光绿的反射，营造出科技感与颓废感并存的未来都市氛围，光影效果与主体完美融合。',
      },
      {
        id: 'filter-low-poly',
        name: '低多边形艺术风格',
        description: '将图片转换为几何化的低多边形艺术风格。',
        prompt: '请将图片中的所有内容（整体）转换为由大量不规则几何多边形组成的低多边形（Low Poly）艺术风格。色彩应平坦且边缘清晰，物体和背景都呈现出抽象而现代的几何化美感，仿佛是数字雕塑。',
      },
      {
        id: 'filter-pop-art',
        name: '波普艺术风格',
        description: '将图片转换为色彩鲜明的波普艺术风格。',
        prompt: '请将图片（整体）转换为安迪·沃霍尔（Andy Warhol）式的波普艺术风格。画面应具有大胆的撞色、重复的图案和鲜艳饱和的色彩，边缘线条清晰，如同印刷品般的视觉效果，充满现代艺术的活力和叛逆。',
      },
      {
        id: 'filter-comic-book',
        name: '老式漫画书效果',
        description: '将图片转换为老式漫画书的印刷效果。',
        prompt: '请将图片（整体）转换为老式漫画书的印刷效果。画面应具有粗糙的网点（Halftone Dots）、夸张的黑色描边和复古的四色印刷色彩，仿佛是从旧漫画书中截取的一页，充满怀旧感和独特的视觉叙事风格。',
      },
      {
        id: 'filter-dreamy-glow',
        name: '梦幻柔焦滤镜',
        description: '为图片添加柔和的梦幻般光晕和虚化效果。',
        prompt: '请为图片（整体）添加一层柔和的梦幻般光晕和轻微的柔焦效果。画面应光线均匀，色彩淡雅，边缘略带模糊，营造出朦胧、唯美、浪漫且充满诗意的氛围，仿佛置身于仙境之中。',
      },
      {
        id: 'filter-noir',
        name: '黑色电影 (Noir) 风格',
        description: '为图片添加高对比度的黑白电影（Noir）风格，增强戏剧性。',
        prompt: '请为图片（整体）应用黑色电影（Film Noir）风格的滤镜。画面应呈现高对比度的黑白影调，光影对比强烈，营造出神秘、压抑、充满悬念的戏剧性氛围，如同经典侦探片中的一幕。',
      },
      {
        id: 'filter-sepia',
        name: '褐色复古（Sepia）滤镜',
        description: '为图片添加温暖的褐色调复古效果。',
        prompt: '请为图片（整体）添加温暖的褐色调（Sepia）复古滤镜。画面色彩将转换为具有历史感的棕褐色，对比度适中，仿佛一张年代久远的旧照片，充满怀旧与典雅的气息。',
      },
      {
        id: 'filter-HDR',
        name: 'HDR效果增强',
        description: '提升图片动态范围和细节，呈现HDR（高动态范围）效果。',
        prompt: '请为图片（整体）应用HDR（高动态范围）效果增强。提升亮部和暗部的细节表现，增加画面的动态对比度，使色彩更加丰富和生动，同时避免出现光晕或不自然感，让图片更具视觉冲击力。',
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
        name: '移除背景人物',
        description: '移除图片背景中的任何人物。',
        prompt: '请智能识别并完全移除图片背景中出现的所有人物。在移除后，利用AI智能算法对受影响的区域进行内容感知填充和重建，确保背景得到无缝、自然地恢复，不留下任何人物存在的痕迹或视觉瑕疵。',
      },
      {
        id: 'remove-watermark',
        name: '彻底去除水印',
        description: '移除图片上所有的水印，并无缝恢复背景内容。',
        prompt: '请精确识别并彻底移除图片上存在的所有水印、文本、标志或不透明覆盖物。在移除后，利用AI智能算法对受影响的区域进行内容感知填充和修复，使背景恢复到原始的自然状态，不留任何编辑痕迹。',
      },
      {
        id: 'restore-old-photo',
        name: '老照片智能修复',
        description: '修复并上色褪色的老照片，提升清晰度，移除划痕。',
        prompt: '请对这张褪色、模糊、破损的老照片进行全面修复。提高整体清晰度和锐度，移除所有划痕、污渍、折痕及其他物理损伤。同时，智能地为黑白照片添加自然、逼真的色彩，使其焕发新生，保留原始情感的同时呈现现代质感。',
      },
      {
        id: 'change-background-beach',
        name: '背景替换：阳光海滩',
        description: '将图片的背景替换为阳光明媚的热带海滩。',
        prompt: '请将图片中的主体精确抠出并保留，将其背景替换为一个阳光明媚、充满活力的热带海滩场景。新背景应包含碧蓝的海水、金色的沙滩、摇曳的棕榈树，以及明亮自然的阳光效果，使主体与新环境完美融合，光影一致。',
      },
      {
        id: 'futuristic-cityscape',
        name: '背景替换：未来城市',
        description: '将图片背景替换为充满霓虹灯和高科技建筑的未来城市景观。',
        prompt: '请将图片中的主体精确抠出并保留，将其背景替换为一座充满未来感的赛博朋克城市景观。新背景应包含高耸的摩天大楼、闪烁的霓虹灯招牌、空中飞行的交通工具以及高科技的建筑细节，营造出科幻、炫酷的都市氛围，并调整主体光影以匹配新背景。',
      },
      {
        id: 'change-weather-rain',
        name: '天气转换：雨天',
        description: '将场景天气改为下雨天，营造湿润、沉静的氛围。',
        prompt: '请将图片中的场景天气转换为一个逼真的雨天。画面应展现出细密的雨丝、湿润的地面反光、模糊的远景以及整体偏冷的色调。为物体表面添加雨滴和水渍效果，营造出一种宁静、沉思甚至略带忧郁的雨中氛围。',
      },
      {
        id: 'swap-sky-sunset',
        name: '天空替换：日落',
        description: '将图片中的天空替换为壮观的日落景象，色彩绚烂。',
        prompt: '请智能识别并替换图片中的天空部分，将其替换为一个壮观、色彩绚烂的日落景象。新天空应充满橙色、粉色、紫色等渐变色彩，云朵被夕阳染红，金色的阳光洒满画面。确保天空边缘自然，与地面景物融合无缝，营造出浪漫、温暖的傍晚氛围。',
      },
      {
        id: 'remove-text',
        name: '移除画面文字',
        description: '从图片中移除所有检测到的文本或标志，并无缝填充背景。',
        prompt: '请精确识别并彻底移除图片上所有存在的文本、标志或标识符。在移除后，利用AI智能算法对受影响的区域进行内容感知填充和修复，使背景恢复到原始的自然状态，不留任何编辑痕迹。',
      },
      {
        id: 'cutout',
        name: '智能抠图',
        description: '移除图片背景，使主体清晰突出，生成透明背景的图片。',
        prompt: '请智能识别图片中的主要主体，并将其从背景中精确地抠取出来。生成一张主体边缘清晰、细节保留完整，并且背景完全透明的PNG格式图片（背景为棋盘格），便于后续合成和使用。',
      },
      {
        id: 'professional-retouching',
        name: '专业级修图',
        description: '进行专业级图像修饰，调整色彩、光影、细节等，提升整体视觉质量。',
        prompt: '请对图片进行专业级的图像修饰。精细调整色彩平衡、白平衡、曝光和对比度，优化光影效果以增强立体感，锐化关键细节，同时平滑皮肤或修复轻微瑕疵，最终呈现出高品质、精致且富有艺术感的作品。目标是提升整体视觉质量，使其达到杂志封面级别。',
      },
      {
        id: 'make-object-gold',
        name: '物体镀金效果',
        description: '将图片中的主要物体渲染成闪闪发光的黄金材质。',
        prompt: '请识别图片中的主要物体，并将其材质替换为高度反射、闪闪发光的抛光黄金。确保黄金的纹理、光泽和反射效果逼真，周围环境的光线应在其表面产生自然的反射和高光，展现出奢华与质感，如同纯金雕塑一般。',
      },
      {
        id: 'change-object-color',
        name: '物体颜色改变',
        description: '改变图片中指定物体的颜色。',
        prompt: '请识别图片中的主要物体，并将其颜色从现有颜色智能改变为鲜艳的亮红色。保持物体的材质、光影和纹理不变，确保颜色变化自然且无色溢。',
      },
      {
        id: 'upscale-image',
        name: '图像分辨率提升',
        description: '智能提升图片的尺寸和分辨率。',
        prompt: '请对图片进行智能超分辨率处理，将其尺寸和分辨率提升至原始的2倍。使用高级AI算法填充缺失细节，消除模糊和噪点，使图片在放大后依然保持清晰、锐利，提升整体图像质量。',
      },
      {
        id: 'remove-red-eye-general',
        name: '去除红眼 (通用)',
        description: '修复照片中所有人物的红眼问题。',
        prompt: '请检测并修复图片中所有人物因闪光灯造成的红眼效应。将瞳孔颜色自然恢复，使其与正常的眼睛颜色一致，同时不影响眼睛其他部分的细节和神态。',
      },
      {
        id: 'blur-area',
        name: '局部模糊/打码',
        description: '对图片中的特定区域进行模糊或马赛克处理。',
        prompt: '请在图片中的人物面部智能应用一个柔和的模糊效果，使其无法辨认，但仍保留面部轮廓。确保模糊区域边缘自然过渡，不影响图片其他部分的清晰度。',
      },
      {
        id: 'remove-clutter-general',
        name: '去除多余杂物',
        description: '从图片中移除任何不相关的物体。',
        prompt: '请智能识别并彻底移除图片中所有不相关的杂物或干扰元素，例如背景中的垃圾桶、电线杆或多余的行人。在移除后，利用AI智能算法对受影响的区域进行内容感知填充和重建，确保背景自然、无缝。',
      },
      {
        id: 'add-text-to-image',
        name: '添加自定义文字',
        description: '在图片上添加自定义文本，可选择字体、颜色和位置。',
        prompt: '请在图片中央位置添加一行白色、加粗、带有黑色描边的中文文字：“我的自定义文字”。文字应清晰可见，与背景形成对比，并能根据图片内容自动调整大小和排版。',
      },
      {
        id: 'adjust-brightness-contrast',
        name: '调整亮度与对比度',
        description: '全局调整图片的亮度和对比度。',
        prompt: '请对图片进行全局亮度与对比度调整。将亮度增加20%，对比度增加15%，使画面更加明亮鲜活，但要避免过曝或细节丢失，保持色彩的自然过渡。',
      },
      {
        id: 'rotate-image-90',
        name: '图片旋转90度',
        description: '将图片顺时针旋转90度。',
        prompt: '请将图片内容进行顺时针90度旋转。确保旋转后画面完整，不裁剪任何内容，并自动调整画布以适应新的尺寸。',
      },
      {
        id: 'mirror-image',
        name: '图片水平翻转',
        description: '将图片内容进行水平镜像翻转。',
        prompt: '请将图片内容进行水平镜像翻转。所有内容将左右颠倒，保持垂直方向不变，生成一张镜像图片。',
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