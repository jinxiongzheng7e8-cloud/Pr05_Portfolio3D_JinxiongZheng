/**
 * Screen configuration file
 * Centralized configuration for all screen content and icons
 */

// Desktop icon configuration
export const desktopIcons = [
    { name: 'Browser', type: 'link', url: 'https://github.com', icon: '🌐' },
    { name: 'Resume', type: 'pdf', path: 'docs/CV_Jinxiong_Zheng.pdf', icon: '📄' },
    { name: 'Projects', type: 'pdf', path: 'assets/pdfs/projects.pdf', icon: '📁' },
    { name: 'Contact', type: 'link', url: 'https://linkedin.com', icon: '📧' }
];

// Canvas screen page configuration
export const canvasPages = {
    desktop: {
        title: 'DESKTOP',
        items: [
            { label: 'Browser', link: 'https://jinxiongzheng7e8-cloud.github.io/gIt-JS/MiPortfolio/index.html#contact' },
            { label: 'CV Folder', action: 'cv' },
            { label: 'Projects Folder', action: 'projects' },
            { label: 'Contact Folder', action: 'contact' }
        ]
    },
    cv: {
        title: 'CV FOLDER',
        items: [
            { label: 'Download CV', link: 'assets/pdfs/resume.pdf' },
            { label: 'Back to Desktop', action: 'desktop' }
        ]
    },
    projects: {
        title: 'PROJECTS FOLDER',
        items: [
            { label: 'Project 1: 3D Scene', link: 'assets/pdfs/project1.pdf' },
            { label: 'Project 2: Web Design', link: 'assets/pdfs/project2.pdf' },
            { label: 'Back to Desktop', action: 'desktop' }
        ]
    },
    contact: {
        title: 'CONTACT FOLDER',
        items: [
            { label: 'Email: jinxiong@email.com', action: null },
            { label: 'Back to Desktop', action: 'desktop' }
        ]
    }
};

// Screen size configuration
export const screenSizes = {
    desktop: { width: 512, height: 384 },
    canvas: { width: 1024, height: 768 }
};

// Screen position configuration
export const screenPositions = {
    desktop: { x: -0.279, y: 1.148, z: -2.0 },
    canvas: { x: 5, y: 2, z: -2 }
};

// Screen scale configuration
export const screenScales = {
    desktop: { width: 1.0, height: 0.75 },
    canvas: { width: 4, height: 3 }
};