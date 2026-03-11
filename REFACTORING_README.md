
# 代码重构说明

## 重构概述

本次重构旨在消除代码重复，提高代码的可维护性和可扩展性。主要涉及屏幕管理器相关的代码。

## 重构内容

### 1. 创建基类 BaseScreenManager.js

创建了`BaseScreenManager`基类，提取了屏幕管理的公共功能：
- Canvas初始化和纹理创建
- 屏幕网格的创建和管理
- 点击检测和处理
- 相机控制
- 纹理更新和清理

### 2. 重构 DesktopScreenManager

- 继承自`BaseScreenManager`
- 移除了重复的Canvas初始化代码
- 使用基类的`createScreenMesh`方法
- 保留了桌面特有的绘制逻辑

### 3. 重构 CanvasScreenManager

- 继承自`BaseScreenManager`
- 移除了重复的Canvas初始化代码
- 使用基类的`createScreenMesh`方法
- 保留了终端风格特有的绘制逻辑

### 4. 创建统一配置文件 screenConfig.js

集中管理所有屏幕配置：
- 桌面图标配置
- Canvas屏幕页面配置
- 屏幕尺寸配置
- 屏幕位置配置
- 屏幕缩放配置

## 文件结构

```
js/
├── BaseScreenManager.js          # 基类
├── DesktopScreenManager.js       # 原始文件（保留）
├── DesktopScreenManager_new.js   # 重构后的文件
├── CanvasScreenManager.js        # 原始文件（保留）
├── CanvasScreenManager_new.js    # 重构后的文件
├── screenConfig.js               # 统一配置文件
└── REFACTORING_README.md         # 本文档
```

## 使用方法

### 1. 使用重构后的DesktopScreenManager

```javascript
import { DesktopScreenManager } from './DesktopScreenManager_new.js';
import { desktopIcons } from './screenConfig.js';

// 创建管理器
const desktopManager = new DesktopScreenManager(scene, camera, cameraManager);

// 创建桌面屏幕
desktopManager.createDesktopScreen(parentMesh, desktopIcons);
```

### 2. 使用重构后的CanvasScreenManager

```javascript
import { CanvasScreenManager } from './CanvasScreenManager_new.js';
import { canvasPages, screenPositions, screenScales } from './screenConfig.js';

// 创建管理器
const canvasManager = new CanvasScreenManager(scene, camera, cameraManager);

// 创建屏幕
canvasManager.createScreen(
    screenPositions.canvas,
    screenScales.canvas
);
```

### 3. 自定义配置

编辑`screenConfig.js`文件来自定义屏幕内容：

```javascript
// 修改桌面图标
export const desktopIcons = [
    { name: '我的网站', type: 'link', url: 'https://mysite.com', icon: '🌐' },
    // 添加更多图标...
];

// 修改Canvas页面
export const canvasPages = {
    desktop: {
        title: '我的桌面',
        items: [
            { label: '关于我', action: 'about' },
            // 添加更多菜单项...
        ]
    },
    // 添加更多页面...
};
```

## 迁移指南

### 从旧版本迁移到新版本

1. 更新导入语句：
   ```javascript
   // 旧版本
   import { DesktopScreenManager } from './DesktopScreenManager.js';

   // 新版本
   import { DesktopScreenManager } from './DesktopScreenManager_new.js';
   ```

2. 使用配置文件：
   ```javascript
   import { desktopIcons } from './screenConfig.js';

   // 在创建屏幕时使用配置
   desktopManager.createDesktopScreen(parentMesh, desktopIcons);
   ```

3. API保持兼容：
   - 所有公共方法保持不变
   - 可以平滑迁移，无需修改现有代码逻辑

## 优势

1. **减少代码重复**：公共功能集中在基类中
2. **提高可维护性**：修改公共功能只需修改基类
3. **易于扩展**：创建新的屏幕风格只需继承基类
4. **配置集中**：所有配置集中在一个文件中
5. **向后兼容**：API保持不变，平滑迁移

## 后续计划

1. 测试重构后的代码
2. 更新所有使用旧版本的文件
3. 删除旧版本文件
4. 添加更多屏幕风格示例
5. 完善配置系统

## 注意事项

- 旧版本文件暂时保留，用于回滚
- 建议先测试新版本，确认无误后再删除旧文件
- 配置文件可以根据需要自定义
