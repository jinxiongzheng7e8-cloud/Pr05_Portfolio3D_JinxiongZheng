export class UIManager {
    constructor() {
        this.initListeners();
    }

    initListeners() {
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.info-panel');
                if (panel) panel.classList.add('hidden');
            });
        });

        const resetBtn = document.getElementById('reset-view-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const event = new CustomEvent('ui:resetView');
                window.dispatchEvent(event);
            });
        }
    }

    showPanel(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }

    hidePanel(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }
}
