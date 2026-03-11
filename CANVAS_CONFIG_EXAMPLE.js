// Canvas Screen 配置示例
// 
// 说明：修改canvasScreenManager.js中的pages对象来自定义菜单内容
// 该文件展示了各种配置选项的用法

// 基本页面配置结构：
const pageTemplate = {
    title: 'PAGE TITLE',
    items: [
        // 导航按钮（跳转到其他页面）
        { label: 'GO TO OTHER PAGE', action: 'other_page_name' },
        
        // PDF链接（相对路径）
        { label: 'DOWNLOAD DOCUMENT', link: 'assets/pdfs/document.pdf' },
        
        // 外部链接（绝对URL）
        { label: 'VISIT WEBSITE', link: 'https://example.com' },
        
        // 纯文本项（无交互）
        { label: 'INFO TEXT ONLY', action: null }
    ]
};

// 完整的pages对象示例：

const pages = {
    main: {
        title: 'SYSTEM MENU',
        items: [
            { label: 'VIEW PROJECTS', action: 'projects' },
            { label: 'DOWNLOAD RESUME', action: 'resume' },
            { label: 'VIEW GITHUB', action: 'github' },
            { label: 'CONTACT INFO', action: 'contact' }
        ]
    },
    
    projects: {
        title: 'PROJECTS PORTFOLIO',
        items: [
            { label: '3D Scene Development', link: 'assets/pdfs/project1.pdf' },
            { label: 'Web Design System', link: 'assets/pdfs/project2.pdf' },
            { label: 'Game Engine Prototype', link: 'assets/pdfs/project3.pdf' },
            { label: 'BACK TO MENU', action: 'main' }
        ]
    },
    
    resume: {
        title: 'RESUME DOWNLOAD',
        items: [
            { label: 'Download PDF (Local)', link: 'assets/pdfs/resume.pdf' },
            { label: 'View Online (LinkedIn)', link: 'https://www.linkedin.com/in/jinxiong' },
            { label: 'BACK TO MENU', action: 'main' }
        ]
    },
    
    github: {
        title: 'GITHUB PROFILE',
        items: [
            { label: 'Visit Main Profile', link: 'https://github.com/jinxiong' },
            { label: 'View All Repositories', link: 'https://github.com/jinxiong?tab=repositories' },
            { label: 'Featured Project', link: 'https://github.com/jinxiong/featured-project' },
            { label: 'BACK TO MENU', action: 'main' }
        ]
    },
    
    contact: {
        title: 'CONTACT INFORMATION',
        items: [
            { label: 'Email: jinxiong@example.com', action: null },
            { label: 'Phone: +886-912-XXXXXX', action: null },
            { label: 'WeChat: jinxiong_art', action: null },
            { label: 'BACK TO MENU', action: 'main' }
        ]
    }
};

// 使用场景：

// 1. 修改页面标题
pages.main.title = '欢迎来到我的作品集';

// 2. 添加新页面
pages.experience = {
    title: 'WORK EXPERIENCE',
    items: [
        { label: '3D Artist - Studio ABC (2021-2023)', action: null },
        { label: 'Web Developer - Company XYZ (2020-2021)', action: null },
        { label: 'View Full CV', link: 'assets/pdfs/cv.pdf' },
        { label: 'BACK TO MENU', action: 'main' }
    ]
};

// 3. 动态更新项目列表（在代码中调用）
// canvasScreenManager.updatePageContent('projects', [
//     { label: '最新项目1', link: 'assets/pdfs/newest_project.pdf' },
//     { label: '最新项目2', link: 'assets/pdfs/another_project.pdf' },
//     { label: 'BACK TO MENU', action: 'main' }
// ]);

// 4. 在JavaScript中调用导航
// canvasScreenManager.setPage('projects');

// 指南：
// - action字段用于页面导航，值必须是pages对象中的键
// - link字段用于打开链接，相对路径会在浏览器中打开，绝对URL在新标签页打开
// - label是按钮显示的文字，建议保持简洁且大写
// - action为null时按钮不可交互，用于纯文本显示
// - 每个页面建议3-5个菜单项，超过5个会显示拥挤

// PDF文件位置：
// /assets/pdfs/ 目录下放置所有PDF文件
// 例如：
// - assets/pdfs/resume.pdf
// - assets/pdfs/project1.pdf
// - assets/pdfs/project2.pdf
// - assets/pdfs/cv.pdf

// 外部链接推荐：
// - GitHub: https://github.com/[username]
// - LinkedIn: https://www.linkedin.com/in/[username]
// - Personal Website: https://yourwebsite.com
// - Portfolio: https://portfolio.yoursite.com
// - Contact: mailto:your@email.com
